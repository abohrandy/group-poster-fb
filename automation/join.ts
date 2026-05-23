import { launchBrowser } from './browser';
import { hasSessionState } from './session';

export async function joinFacebookGroup(
  profileId: string,
  groupUrl: string,
  options: { headless?: boolean } = {}
): Promise<{ success: boolean; status: 'JOINED' | 'JOIN_PENDING' | 'FAILED'; message: string }> {
  
  if (!hasSessionState(profileId)) {
    return {
      success: false,
      status: 'FAILED',
      message: `Profile cookies for "${profileId}" are missing. Please authenticate first.`,
    };
  }

  // Force headless: false by default for semi-assisted joining so operator can see questions
  const headless = options.headless === true;

  console.log(`Launching browser to join group: ${groupUrl}`);
  const { browser, context, page } = await launchBrowser({
    headless,
    profileId,
  });

  try {
    await page.goto(groupUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Verify if we are logged in
    const isLoginRequired = page.url().includes('login') || (await page.locator('input[name="email"]').isVisible().catch(() => false));
    if (isLoginRequired) {
      await browser.close();
      return {
        success: false,
        status: 'FAILED',
        message: 'Facebook session has expired. Please log in again to refresh cookies.',
      };
    }

    // Check if already joined or requested
    const joinedButton = page.locator('button:has-text("Joined"), button:has-text("Leave Group"), button:has-text("Manage Group")');
    const pendingButton = page.locator('button:has-text("Cancel Request"), button:has-text("Requested")');
    const joinButton = page.locator('button:has-text("Join Group"), [role="button"]:has-text("Join Group")');

    if (await joinedButton.isVisible().catch(() => false)) {
      console.log('Already joined this group.');
      await browser.close();
      return { success: true, status: 'JOINED', message: 'Already a member of this group.' };
    }

    if (await pendingButton.isVisible().catch(() => false)) {
      console.log('Join request is already pending admin approval.');
      await browser.close();
      return { success: true, status: 'JOIN_PENDING', message: 'Join request is already pending.' };
    }

    if (!(await joinButton.isVisible().catch(() => false))) {
      await browser.close();
      return {
        success: false,
        status: 'FAILED',
        message: 'Could not find a valid "Join Group" button on the page. Private/restricted group?',
      };
    }

    console.log('Clicking "Join Group" button...');
    await joinButton.click();
    await page.waitForTimeout(2000); // Wait for modal triggers

    // Check if questions modal appeared
    const modalLocator = page.locator('text="Answer questions", text="Group rules", text="rules from the admins", [role="dialog"]');
    const isModalVisible = await modalLocator.isVisible().catch(() => false);

    let finalJoined = false;
    let finalPending = false;

    if (isModalVisible) {
      console.log('Membership questions modal detected! Pausing for manual operator assistance...');
      
      // Loop and poll for up to 120 seconds (60 iterations of 2s)
      let verified = false;
      let iterations = 0;

      while (iterations < 60) {
        await page.waitForTimeout(2000);
        iterations++;

        // Check if browser was closed manually by user
        if (browser.contexts().length === 0) {
          return {
            success: false,
            status: 'FAILED',
            message: 'Browser window was closed by the operator before completing join.',
          };
        }

        // Check if modal is still visible
        const modalStillOpen = await modalLocator.isVisible().catch(() => false);
        
        // Check if button text changed to Joined or Requested
        const isJoined = await page.locator('button:has-text("Joined"), button:has-text("Leave Group")').isVisible().catch(() => false);
        const isPending = await page.locator('button:has-text("Cancel Request"), button:has-text("Requested")').isVisible().catch(() => false);

        if (isJoined) {
          console.log('Manual join verified: Joined!');
          finalJoined = true;
          verified = true;
          break;
        }

        if (isPending) {
          console.log('Manual join verified: Request Pending!');
          finalPending = true;
          verified = true;
          break;
        }

        if (!modalStillOpen && !isJoined && !isPending) {
          console.warn('Operator closed the questions modal without submitting.');
          await browser.close();
          return {
            success: false,
            status: 'FAILED',
            message: 'Join modal was closed without submission.',
          };
        }
      }

      if (!verified) {
        await browser.close();
        return {
          success: false,
          status: 'FAILED',
          message: 'Timed out waiting for operator to answer membership questions.',
        };
      }
    } else {
      console.log('No membership questions triggered. Checking if request went through...');
      await page.waitForTimeout(3000);
      const isJoined = await page.locator('button:has-text("Joined"), button:has-text("Leave Group")').isVisible().catch(() => false);
      const isPending = await page.locator('button:has-text("Cancel Request"), button:has-text("Requested")').isVisible().catch(() => false);

      if (isJoined) {
        finalJoined = true;
        console.log('Successfully joined group directly.');
      } else if (isPending) {
        finalPending = true;
        console.log('Join request submitted. Awaiting admin approval.');
      } else {
        console.warn('Failed to verify join request state change.');
        await browser.close();
        return {
          success: false,
          status: 'FAILED',
          message: 'Clicked Join but button state did not transition. Verification failed.',
        };
      }
    }

    // Save context state in case cookies updated
    await browser.close();

    return {
      success: true,
      status: finalJoined ? 'JOINED' : 'JOIN_PENDING',
      message: finalJoined ? 'Successfully joined the group.' : 'Join request submitted. Awaiting approval.',
    };

  } catch (err: any) {
    console.error('Join group automation error:', err);
    await browser.close().catch(() => {});
    return {
      success: false,
      status: 'FAILED',
      message: `Automation error: ${err.message || String(err)}`,
    };
  }
}
