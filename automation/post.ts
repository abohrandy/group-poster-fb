import { launchBrowser } from './browser';
import { hasSessionState } from './session';
import * as fs from 'fs';
import * as path from 'path';

interface PostResult {
  success: boolean;
  status: 'PUBLISHED' | 'MODERATION_PENDING' | 'FAILED';
  message: string;
  screenshotPath?: string;
  allowsPages?: boolean;
}

// Simulates human-like typing with randomized delays and punctuation pauses
async function typeHumanLike(page: any, locator: any, text: string) {
  await locator.focus();
  await page.waitForTimeout(500 + Math.random() * 500); // Pause before typing

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    await locator.press(char);
    
    // Default typing delay between 50ms and 150ms
    let delay = 50 + Math.random() * 100;

    // Longer pause on punctuation marks
    if (char === '.' || char === ',' || char === '!' || char === '?') {
      delay = 600 + Math.random() * 800;
    } else if (char === ' ') {
      delay = 100 + Math.random() * 150; // Pause at spaces
    }

    await page.waitForTimeout(delay);
  }

  await page.waitForTimeout(1000 + Math.random() * 1000); // Pause after typing
}

// Safely capture a screenshot of the current page and save it to public/screenshots/
async function takeScreenshotSafe(page: any): Promise<string | undefined> {
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const screenshotName = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
    const screenshotFilePath = path.join(screenshotsDir, screenshotName);
    await page.screenshot({ path: screenshotFilePath, timeout: 5000 });
    return `/api/screenshots/${screenshotName}`;
  } catch (err) {
    console.error('Failed to take screenshot:', err);
    return undefined;
  }
}

export async function postAsPage(
  profileId: string,
  groupUrl: string,
  pageName: string,
  content: string,
  imagePath?: string,
  options: { headless?: boolean } = {}
): Promise<PostResult> {
  if (!await hasSessionState(profileId)) {
    return {
      success: false,
      status: 'FAILED',
      message: `Profile cookies for "${profileId}" are missing. Please authenticate first.`,
    };
  }

  const headless = options.headless === true;

  console.log(`Launching browser for group posting: ${groupUrl}`);
  const { browser, context, page } = await launchBrowser({
    headless,
    profileId,
  });

  try {
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 1. Verify if we are logged in
    const isLoginRequired = page.url().includes('login') || (await page.locator('input[name="email"]').isVisible().catch(() => false));
    if (isLoginRequired) {
      const screenshotPath = await takeScreenshotSafe(page);
      await browser.close();
      return {
        success: false,
        status: 'FAILED',
        message: 'Facebook session has expired. Please log in again to refresh cookies.',
        screenshotPath,
      };
    }

    // 2. Identity Switcher Checks
    console.log('Locating identity selector...');
    // Look for the interact selector button (displays current user/page avatar)
    const identitySelector = page.locator('[aria-label*="Interacting as"], [aria-label*="Choose how to interact"], [aria-label*="Interaction selector"]');
    const hasSelector = await identitySelector.isVisible().catch(() => false);
    let allowsPagesDetected = false;

    if (hasSelector) {
      console.log('Identity selector found. Clicking to switch profile...');
      allowsPagesDetected = true;
      await identitySelector.click();
      await page.waitForTimeout(2000); // Wait for popup menu to load

      // Look for the target page name in the list
      const targetPageOption = page.locator(`[role="menuitem"]:has-text("${pageName}"), [role="radio"]:has-text("${pageName}"), text="${pageName}"`);
      if (await targetPageOption.isVisible().catch(() => false)) {
        console.log(`Selecting page identity: "${pageName}"`);
        await targetPageOption.click();
        await page.waitForTimeout(5000); // Wait for page to reload with new context
      } else {
        console.warn(`Target page "${pageName}" was not found in interaction selector. Using default profile.`);
      }
    } else {
      console.warn('No identity selector found on page. Facebook page interaction may not be allowed in this group.');
    }

    console.log('Locating create post block...');
    const createPostTrigger = page.locator('text="Write something...", text="Create a public post...", text="Create a post...", text="Write a post...", [role="button"]:has-text("Write something..."), [role="button"]:has-text("Create a public post..."), [role="button"]:has-text("Create a post..."), [role="button"]:has-text("Write a post...")');
    if (!(await createPostTrigger.isVisible().catch(() => false))) {
      const screenshotPath = await takeScreenshotSafe(page);
      await browser.close();
      return {
        success: false,
        status: 'FAILED',
        message: 'Could not find the "Write something..." input box. Posting may be restricted.',
        screenshotPath,
      };
    }

    console.log('Opening post creation dialog...');
    await createPostTrigger.click();
    await page.waitForTimeout(3000); // Wait for modal load

    const textbox = page.locator('[role="textbox"], [aria-label*="Write something"], [aria-label*="Create a public post"]');
    await textbox.waitFor({ state: 'visible', timeout: 5000 });

    // 4. Simulate human-typing content
    console.log('Entering post content with human-typing simulation...');
    await typeHumanLike(page, textbox, content);

    // 5. Manage Image Uploads
    if (imagePath) {
      console.log(`Image path provided: "${imagePath}". Locating file inputs...`);
      const fileChooserPromise = page.waitForEvent('filechooser');
      const addMediaButton = page.locator('[aria-label="Photo/video"], [aria-label*="Add to your post"] :has-text("Photo/video")');
      
      if (await addMediaButton.isVisible().catch(() => false)) {
        await addMediaButton.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(imagePath);
        console.log('Image file selected and uploaded.');
        await page.waitForTimeout(4000); // Wait for image rendering
      } else {
        console.warn('Could not locate "Photo/video" button inside dialog. Submitting text-only.');
      }
    }

    // 6. Submit Post
    console.log('Submitting post...');
    const postSubmitButton = page.locator('button[type="submit"]:has-text("Post"), [role="button"]:has-text("Post")');
    await postSubmitButton.waitFor({ state: 'visible', timeout: 5000 });
    await postSubmitButton.click();

    console.log('Post submitted. Wait for feedback response...');
    // Race to detect immediate publish vs. admin approval alert
    const feedLocator = page.locator(`text="${content.substring(0, 20)}"`);
    const moderationLocator = page.locator('text="Submitted to admins", text="pending approval", text="Pending posts"');

    const result = await Promise.race([
      feedLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'published'),
      moderationLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'moderation'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).then(() => 'navigated'),
    ]).catch(() => 'timeout');

    if (result === 'published') {
      console.log('Successfully published group post directly.');
      const screenshotPath = await takeScreenshotSafe(page);
      await browser.close();
      return { success: true, status: 'PUBLISHED', message: 'Post successfully published directly.', screenshotPath, allowsPages: allowsPagesDetected };
    }

    if (result === 'moderation') {
      console.log('Post submitted successfully. Awaiting admin moderation approval.');
      const screenshotPath = await takeScreenshotSafe(page);
      await browser.close();
      return { success: true, status: 'MODERATION_PENDING', message: 'Post submitted to admin queue.', screenshotPath, allowsPages: allowsPagesDetected };
    }

    console.log('Post submission completed (verification timeout). Checking feed URL...');
    const screenshotPath = await takeScreenshotSafe(page);
    await browser.close();
    return {
      success: true,
      status: 'PUBLISHED',
      message: 'Post submitted. Check group feed directly to confirm execution.',
      screenshotPath,
      allowsPages: allowsPagesDetected,
    };

  } catch (err: any) {
    console.error('Post group automation error:', err);
    let screenshotPath;
    try {
      screenshotPath = await takeScreenshotSafe(page);
    } catch (_) {}
    await browser.close().catch(() => {});
    return {
      success: false,
      status: 'FAILED',
      message: `Automation error: ${err.message || String(err)}`,
      screenshotPath,
    };
  }
}

