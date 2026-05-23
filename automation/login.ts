import { launchBrowser } from './browser';
import { saveSessionState } from './session';

interface LoginResult {
  success: boolean;
  message: string;
}

export async function authenticateFacebookProfile(
  profileId: string,
  email: string,
  password: string,
  headless = true
): Promise<LoginResult> {
  // 1. Launch browser with existing session to see if we're already logged in
  const { browser, context, page } = await launchBrowser({
    headless,
    profileId,
  });

  try {
    console.log(`Navigating to Facebook for profile: ${profileId}`);
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle', timeout: 30000 });

    // Check if we are already logged in
    const searchInput = page.locator('input[placeholder*="Search Facebook"]');
    const isLoggedIn = await searchInput.isVisible().catch(() => false);

    if (isLoggedIn) {
      console.log('Already authenticated. Refreshing session storage state...');
      const state = await context.storageState();
      await saveSessionState(profileId, state);
      await browser.close();
      return { success: true, message: 'Already authenticated. Session updated.' };
    }

    console.log('Not authenticated. Attempting credentials login...');

    // Wait for the email input field to appear
    const emailInput = page.locator('input[name="email"], input#email');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });

    // Enter email with a slight human delay
    await emailInput.fill(email);
    await page.waitForTimeout(200 + Math.random() * 300);

    // Enter password
    const passInput = page.locator('input[name="pass"], input#pass');
    await passInput.fill(password);
    await page.waitForTimeout(200 + Math.random() * 300);

    // Click Login
    const loginButton = page.locator('button[name="login"], button[type="submit"]');
    await loginButton.click();

    console.log('Credentials submitted. Waiting for authentication response...');

    // Race to detect login success, checkpoint, or errors
    const successLocator = page.locator('input[placeholder*="Search Facebook"], [role="feed"], [role="navigation"]');
    const checkpointLocator = page.locator('text="checkpoint", [action*="checkpoint"], text="Approve from another device"');
    const errorLocator = page.locator('[role="alert"], #error_box, text="The email address you entered", text="The password you’ve entered"');

    const result = await Promise.race([
      successLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'success'),
      checkpointLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'checkpoint'),
      errorLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'error'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).then(() => 'navigated'),
    ]).catch(() => 'timeout');

    if (result === 'success') {
      console.log('Authentication successful! Capturing storage state...');
      const state = await context.storageState();
      await saveSessionState(profileId, state);
      await browser.close();
      return { success: true, message: 'Logged in successfully. Session saved.' };
    }

    if (result === 'checkpoint') {
      console.warn('Facebook security checkpoint / 2FA triggered.');
      await browser.close();
      return { success: false, message: 'Security checkpoint triggered. 2FA or identity review is required.' };
    }

    if (result === 'error') {
      const errorText = await errorLocator.innerText().catch(() => 'Incorrect credentials entered.');
      console.warn(`Login failed: ${errorText}`);
      await browser.close();
      return { success: false, message: `Login failed: ${errorText}` };
    }

    // Secondary check: verify URL or search input again
    const finalSearchInput = page.locator('input[placeholder*="Search Facebook"]');
    if (await finalSearchInput.isVisible().catch(() => false)) {
      console.log('Login succeeded (detected search input on fallback check). Saving session...');
      const state = await context.storageState();
      await saveSessionState(profileId, state);
      await browser.close();
      return { success: true, message: 'Logged in successfully. Session saved.' };
    }

    const url = page.url();
    if (url.includes('checkpoint')) {
      await browser.close();
      return { success: false, message: 'Security checkpoint triggered. 2FA or identity review is required.' };
    }

    console.warn(`Login timed out or landed on unrecognized page. Current URL: ${url}`);
    await browser.close();
    return { success: false, message: `Authentication timed out or landed on unrecognized page: ${url}` };

  } catch (err: any) {
    console.error('Automated login encountered an error:', err);
    await browser.close().catch(() => {});
    return { success: false, message: `Automation error: ${err.message || String(err)}` };
  }
}
