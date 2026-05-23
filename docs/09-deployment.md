# Deployment & Production Architecture (Layer 10)

This document provides a comprehensive guide for deploying the SocialDiscovery automation suite in a production environment. We focus on deployment via **Railway**, defining required environment variables, and establishing a robust production architecture that ensures stealthy browser sessions and persistent states.

---

## 1. Railway Deployment Setup

[Railway](https://railway.app/) is a modern container-based hosting platform. It uses **Nixpacks** to automatically detect, build, and deploy web applications. For SocialDiscovery, which utilizes Next.js alongside Playwright browser automation, Railway provides a seamless infrastructure.

### Step-by-Step Provisioning

1. **Create a Railway Project**:
   - Go to your Railway dashboard and select **New Project** &rarr; **Deploy from GitHub repo**.
   - Connect your repository containing the SocialDiscovery application.

2. **Add a PostgreSQL Database**:
   - Within the same project layout, click **New** &rarr; **Database** &rarr; **Add PostgreSQL**.
   - Railway will automatically spin up a secure, managed PostgreSQL instance and inject its connection URL into your environment variables.

3. **Configure the Playwright Build Environment**:
   - Because Playwright requires system-level browser libraries (like Chromium, GLib, and font packages), a default Node.js buildpack will fail to run browser sessions.
   - To resolve this on Railway, create a `railway.json` file in the project root or configure Nixpacks custom setup.
   - Add the following environment variable to tell Nixpacks to include the Playwright system dependencies:
     ```env
     NIXPACKS_APT_PKGS = libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm1 text-base
     ```
   - Alternatively, you can configure Nixpacks to run `npx playwright install-deps` during the build phase.

---

## 2. Environment Variables

Define the following environment variables in the Railway service settings interface under the **Variables** tab:

| Variable Name | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Railway provisions this automatically. | `postgresql://postgres:pass@host:port/db` |
| `SESSION_SECRET` | **Yes** | A high-entropy random string used to sign cookie-based user sessions. | `b1e2a095a5fbc40d28362ea7008ff...` |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API authorization key used by the AI Caption System. | `sk-or-v1-xxxxxxxxxxxxxxxxx` |
| `NODE_ENV` | **Yes** | Informs Next.js that the application is running in production. | `production` |
| `PORT` | No | Port on which the Next.js server listens. Railway overrides this. | `3000` |
| `PLAYWRIGHT_HEADLESS` | No | Controls whether Playwright browser runs headless in production. | `true` |

> [!IMPORTANT]
> Never commit actual secret keys or your production `.env` file to version control. Always manage credentials via Railway's secure environment variable vault.

---

## 3. Production Architecture

Our production architecture is designed to handle stateless Next.js app container redeployments while maintaining stateful, localized scraper session states.

```mermaid
flowchart TD
    Client[User Browser] <-->|HTTPS| NextApp[Next.js App Server]
    NextApp <-->|Prisma Client| PG[(Railway PostgreSQL)]
    
    subgraph Container Filesystem
        NextApp <-->|Reads/Writes| Vol[(Persistent Volume: /app/automation/cookies/)]
    end
    
    NextApp -->|Spawns| PW[Playwright Chromium Runner]
    PW <-->|Loads/Saves Cookies| Vol
    PW <-->|HTTP Proxies| Web[Facebook Website]
```

### Persistent Volume for Session Storage

By default, container platforms like Railway have **ephemeral filesystems**. When a new deployment is pushed, or the container restarts, all local files are lost.
* **Why this is critical**: SocialDiscovery stores Facebook authentication states (cookies and local storage) inside `automation/cookies/`. If this folder is wiped, all Facebook login states expire, forcing operators to re-authenticate and re-verify 2FA accounts frequently.
* **Solution**: You must attach a **Persistent Volume** in Railway and mount it to `/app/automation/cookies/`.
  1. In the Railway dashboard, navigate to your Next.js service.
  2. Under the **Settings** tab, scroll to **Volumes** and click **Add Volume**.
  3. Set the Mount Path to `/app/automation/cookies/`.
  4. Any session cookie state written by the Playwright engine will now persist indefinitely across deployments, container crashes, and app updates.

### Scaling & Concurrency Safeguards

Because headless browser automation is heavy on RAM and CPU:
- **Instance Sizing**: Ensure your Railway web service has at least **2GB RAM** (preferably 4GB) to run multiple Playwright browser sessions simultaneously.
- **Worker Separation**: For high-volume deployment, decouple the main Next.js web console from the Playwright scraper execution. You can deploy a standalone background worker image on Railway that polls the database for queue items, leaving the Next.js web application fast and lightweight.
