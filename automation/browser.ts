import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { getCookiesPath, hasSessionState } from './session';

interface LaunchOptions {
  headless?: boolean;
  profileId?: string;
}

interface LaunchResult {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function launchBrowser(options: LaunchOptions = {}): Promise<LaunchResult> {
  const headless = options.headless !== false; // Default true
  
  const launchArgs = [
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];

  const browser = await chromium.launch({
    headless,
    args: launchArgs,
  });

  const contextOptions: any = {
    userAgent: DEFAULT_USER_AGENT,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  };

  // If profileId is specified and cookies exist, load them
  if (options.profileId && await hasSessionState(options.profileId)) {
    contextOptions.storageState = getCookiesPath(options.profileId);
  }

  const context = await browser.newContext(contextOptions);

  // Apply stealth injections
  await context.addInitScript(() => {
    // 1. Override webdriver flag
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // 2. Mock chrome object
    (window as any).chrome = {
      runtime: {},
      app: {},
      csi: () => {},
      loadTimes: () => {},
    };

    // 3. Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  const page = await context.newPage();

  return { browser, context, page };
}
