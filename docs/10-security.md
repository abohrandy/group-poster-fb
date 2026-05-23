# Security, Encryption & Account Safety (Layer 10)

This document details the security model, credential encryption practices, proxy configurations, and account safety mechanisms implemented in the SocialDiscovery platform. These practices ensure the system remains resilient against unauthorized access, data leaks, and automated detection systems.

---

## 1. Web Session Security

The web dashboard is protected by a custom session management layer built on secure cookie standards.

* **Tamper-proof Signature**: Session payloads are serialized, signed with a high-entropy secret (`SESSION_SECRET`), and verified on every server-side request. Any modification of the cookie payload instantly invalidates the session.
* **Cookie Protection Flags**:
  - `HttpOnly`: Restricts cookie access to HTTP requests, making them inaccessible to client-side scripts (`document.cookie`), mitigating Cross-Site Scripting (XSS) token theft.
  - `Secure`: Ensures cookies are only transmitted over encrypted connections (HTTPS) in production.
  - `SameSite=Lax`: Prevents session cookies from being sent along with cross-site requests, mitigating Cross-Site Request Forgery (CSRF) attacks.
* **Server-side Session Validation**: The server verifies user IDs directly against the database on each transition. When an operator clicks "Sign Out", the session token is immediately deleted from both the database and the client browser.

---

## 2. Encrypted Facebook Cookie Storage

Facebook session cookies and local storage tokens are stored locally inside `automation/cookies/`. Because these cookies contain active authentication sessions (bypassing the need for username, password, or 2FA credentials on subsequent browser starts), protecting them is of paramount importance.

### AES-256-GCM Encryption Scheme

To protect session state files on disk, we employ an **AES-256-GCM** (Galois/Counter Mode) encryption scheme. The files are encrypted before being written and decrypted on read, utilizing a system-wide environment key `COOKIE_ENCRYPTION_KEY`.

#### Encryption/Decryption Utility Implementation Example:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.COOKIE_ENCRYPTION_KEY || 'default-secret-key', 'salt', 32);

export function encryptData(text: string): { iv: string; content: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    tag: tag
  };
}

export function decryptData(encryptedObj: { iv: string; content: string; tag: string }): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(encryptedObj.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedObj.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

This guarantees that even if an attacker gains read access to the server’s file system or volume mount, the Facebook sessions remain completely unreadable without the `COOKIE_ENCRYPTION_KEY`.

---

## 3. Proxy Configuration in Playwright

Facebook tracks incoming IP addresses closely. If an automation worker connects from a datacenter hosting range (like AWS, Railway, or Google Cloud) instead of a typical residential internet provider, Facebook is highly likely to issue immediate checkpoint validations or permanent account bans.

To mitigate this, **Residential Proxies** or **Mobile Proxies** must be integrated into the Playwright configuration.

### Dynamically Applying Proxy Configurations

Update the `chromium.launch` arguments in `automation/browser.ts` to accept proxy configurations based on the running profile:

```typescript
interface ProxyConfig {
  server: string; // e.g. "http://proxy.residentialprovider.com:8000"
  username?: string;
  password?: string;
}

export async function launchBrowser(options: { 
  headless?: boolean; 
  profileId?: string;
  proxy?: ProxyConfig;
}) {
  const launchOptions: any = {
    headless: options.headless !== false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--no-sandbox',
    ],
  };

  if (options.proxy) {
    launchOptions.proxy = {
      server: options.proxy.server,
      username: options.proxy.username,
      password: options.proxy.password,
    };
  }

  const browser = await chromium.launch(launchOptions);
  // ... continue with context initialization ...
}
```

> [!TIP]
> Ensure the proxy location matches the geolocational profile settings of the target Facebook account. Connecting from Dublin at 10:00 AM and then logging in from New York at 10:15 AM will immediately trigger Facebook security blocks.

---

## 4. Account Safety & Anti-Detection Strategies

To minimize automated flags, the Playwright engine employs several stealth layers that mirror genuine human activity:

1. **Typing Simulation (`typeHumanLike`)**:
   - Instead of injecting text instantly via JavaScript, we focus the element and press keys sequentially.
   - Keystroke delays are randomized between **50ms and 150ms**.
   - Keystroke delays are prolonged up to **1400ms** on punctuation marks (`.`, `,`, `!`, `?`) and spaces to simulate natural human pacing.

2. **Fingerprint Masking**:
   - The Chromium context overrides `navigator.webdriver` to prevent simple scripts from detecting headless browsers.
   - Outward properties are mocked to resemble typical Windows 10 consumer devices (consistent user-agent, mock `chrome.runtime` APIs, default system languages, and screen viewport boundaries).

3. **Incremental Warming**:
   - New profiles should not post in more than 2-3 groups per day. 
   - Gradually scale up frequency over a period of 2-3 weeks, keeping the total posts below **20 postings per day** to stay well within standard compliance parameters.

4. **Sequential Crawling**:
   - Avoid aggressive parallel automation runs on a single account. Run tasks sequentially with randomized cooldown periods (e.g. 5 to 15 minutes) between posts.
