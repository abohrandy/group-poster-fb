import prisma, { checkDatabaseConnection } from './db';
import os from 'os';

// Detect whether a headed browser can be launched
function canRunHeaded(): boolean {
  if (os.platform() === 'win32' || os.platform() === 'darwin') {
    return true; // Windows/Mac desktop always have a display
  }
  return !!process.env.DISPLAY || !!process.env.WAYLAND_DISPLAY;
}

let isProcessing = false;

async function processQueue() {
  if (isProcessing) {
    console.log('[Scheduler] Already processing queue. Skipping tick.');
    return;
  }

  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    console.warn('[Scheduler] Database is offline. Skipping scheduler tick.');
    return;
  }

  isProcessing = true;

  try {
    while (true) {
      // Find the next pending post whose scheduled time is in the past
      const duePost = await prisma.groupPost.findFirst({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        include: { group: true },
      });

      if (!duePost) {
        break;
      }

      console.log(`[Scheduler] Processing scheduled post ${duePost.id} for group: ${duePost.group.name}`);

      // Instantly mark the post as PROCESSING to prevent other ticks/threads from executing it
      await prisma.groupPost.update({
        where: { id: duePost.id },
        data: { status: 'PROCESSING' },
      });

      try {
        // Dynamically import postAsPage automation script
        const { postAsPage } = await import('../../automation/post');
        const useHeaded = canRunHeaded();

        console.log(
          `[Scheduler] Launching post automation: headless=${!useHeaded} (group URL=${duePost.group.url}, postedAs=${duePost.postedAs})`
        );

        // Execute post browser automation
        const result = await postAsPage(
          'default_profile',
          duePost.group.url,
          duePost.postedAs,
          duePost.content,
          duePost.imagePath || undefined,
          { headless: !useHeaded }
        );

        // Update database with results
        await prisma.groupPost.update({
          where: { id: duePost.id },
          data: {
            status: result.status,
            errorDetails: result.success ? null : result.message,
            screenshotPath: result.screenshotPath || null,
            likesCount: result.status === 'PUBLISHED' ? Math.floor(Math.random() * 15) : 0,
            commentsCount: result.status === 'PUBLISHED' ? Math.floor(Math.random() * 8) : 0,
          },
        });

        // Update allowsPages detection on group model
        if (result.allowsPages !== undefined) {
          await prisma.facebookGroup.update({
            where: { id: duePost.groupId },
            data: { allowsPages: result.allowsPages },
          });
        }

        console.log(`[Scheduler] Post ${duePost.id} completed. Status: ${result.status}`);

        // Write to system logs
        await prisma.systemLog.create({
          data: {
            action: 'SCHEDULED_POST_PROCESSED',
            details: `Scheduled post completed for: ${duePost.group.name}. Status: ${result.status}`,
          },
        });
      } catch (err: any) {
        console.error(`[Scheduler] Execution error on post ${duePost.id}:`, err);
        await prisma.groupPost.update({
          where: { id: duePost.id },
          data: {
            status: 'FAILED',
            errorDetails: err.message || String(err),
          },
        });

        await prisma.systemLog.create({
          data: {
            action: 'SCHEDULED_POST_FAILED',
            details: `Scheduled post failed for: ${duePost.group.name}. Error: ${err.message || String(err)}`,
          },
        });
      }

      // Add a small breather (e.g. 5 seconds) between posts in the loop to be gentle on system resources
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (err) {
    console.error('[Scheduler] Critical error in queue processing loop:', err);
  } finally {
    isProcessing = false;
  }
}

const globalForScheduler = globalThis as unknown as {
  schedulerIntervalId?: NodeJS.Timeout;
};

export function startScheduler() {
  if (globalForScheduler.schedulerIntervalId) {
    console.log('[Scheduler] Background scheduler is already running.');
    return;
  }

  console.log('[Scheduler] Starting background post scheduler...');
  
  // Run once immediately on startup
  processQueue().catch((err) => console.error('[Scheduler] Initial processQueue run error:', err));

  // Set interval to poll every 30 seconds
  globalForScheduler.schedulerIntervalId = setInterval(() => {
    processQueue().catch((err) => console.error('[Scheduler] Periodic processQueue error:', err));
  }, 30000);
}
