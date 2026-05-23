const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const COOKIES_DIR = path.join(__dirname, '..', 'automation', 'cookies');
const COOKIE_FILE = path.join(COOKIES_DIR, 'default_profile.json');

async function run() {
  console.log('==================================================');
  console.log('   Facebook Local Headed Session Authenticator');
  console.log('==================================================');
  console.log('This script will launch a HEADED browser on your desktop.');
  console.log('You can log in manually, solve any CAPTCHAs, and approve 2FA.');
  console.log('Once you are logged in, we will save the cookies to upload to Railway.');
  console.log('--------------------------------------------------\n');

  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }

  // Launch headed browser
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  console.log('Opening Facebook login page...');
  await page.goto('https://www.facebook.com/');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n👉 Log in to Facebook in the browser window, then press ENTER here to save the session...', async () => {
    try {
      console.log('\nCapturing session cookies...');
      const state = await context.storageState();
      
      fs.writeFileSync(COOKIE_FILE, JSON.stringify(state, null, 2), 'utf-8');
      console.log(`\n✔ Success! Cookies saved locally to: ${COOKIE_FILE}`);
      console.log('You can now upload this JSON file on your dashboard Settings page.');
    } catch (err) {
      console.error('Failed to save cookies:', err);
    } finally {
      rl.close();
      await browser.close();
    }
  });
}

run().catch(console.error);
