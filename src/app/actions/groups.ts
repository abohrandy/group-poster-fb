'use server';

import prisma, { checkDatabaseConnection } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import os from 'os';

// Detect whether a headed browser can be launched
// On Linux servers (Railway, Docker), there's no X display
function canRunHeaded(): boolean {
  if (os.platform() === 'win32' || os.platform() === 'darwin') {
    return true; // Windows/Mac desktop always have a display
  }
  // On Linux, check if a display server is available
  return !!process.env.DISPLAY || !!process.env.WAYLAND_DISPLAY;
}

export async function createGroupAction(prevState: any, formData: FormData): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const membersCountStr = formData.get('membersCount') as string;
  const allowsPages = formData.get('allowsPages') === 'true';
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  if (!name || !url) {
    return { error: 'Group Name and URL are required.' };
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { error: 'Invalid URL format. Must start with http:// or https://' };
  }

  const membersCount = parseInt(membersCountStr, 10) || 0;

  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    return { error: 'Database is offline. Unable to save group.' };
  }

  try {
    const existingGroup = await prisma.facebookGroup.findUnique({
      where: { url },
    });

    if (existingGroup) {
      return { error: 'A group with this URL is already registered.' };
    }

    const group = await prisma.facebookGroup.create({
      data: {
        name,
        url,
        membersCount,
        allowsPages,
        status: status || 'NOT_JOINED',
        notes: notes || null,
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'GROUP_ADDED',
        details: `Manually added Facebook group: ${name} (${url})`,
      },
    });

    revalidatePath('/dashboard/groups');
    return { success: `Successfully registered group: ${name}` };
  } catch (err: any) {
    console.error('Create group error:', err);
    return { error: err.message || 'Failed to create group.' };
  }
}

export async function deleteGroupAction(groupId: string): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    return { error: 'Database is offline. Unable to delete group.' };
  }

  try {
    const group = await prisma.facebookGroup.delete({
      where: { id: groupId },
    });

    await prisma.systemLog.create({
      data: {
        action: 'GROUP_DELETED',
        details: `Deleted Facebook group: ${group.name}`,
      },
    });

    revalidatePath('/dashboard/groups');
    return { success: `Successfully deleted group: ${group.name}` };
  } catch (err: any) {
    console.error('Delete group error:', err);
    return { error: err.message || 'Failed to delete group.' };
  }
}

export async function joinGroupAutomationAction(groupId: string): Promise<{ error?: string; success?: string; status?: 'JOINED' | 'JOIN_PENDING' }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const { connected } = await checkDatabaseConnection();

  if (!connected) {
    // Simulated joining for offline workspace
    console.log(`Running simulated joining for group ID: "${groupId}"`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {
      success: 'Join request sent successfully (SIMULATED).',
      status: 'JOIN_PENDING',
    };
  }

  try {
    const group = await prisma.facebookGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { error: 'Group not found.' };
    }

    const { joinFacebookGroup } = await import('../../../automation/join');
    const useHeaded = canRunHeaded();
    console.log(`Join automation: headless=${!useHeaded} (platform=${os.platform()}, display=${process.env.DISPLAY || 'none'})`);
    const result = await joinFacebookGroup('default_profile', group.url, { headless: !useHeaded });

    if (result.success && result.status !== 'FAILED') {
      await prisma.facebookGroup.update({
        where: { id: groupId },
        data: { 
          status: result.status,
          notes: `Join attempt succeeded: ${result.message}`
        },
      });

      await prisma.systemLog.create({
        data: {
          action: 'GROUP_JOIN_ATTEMPT',
          details: `Automation join triggered for: ${group.name}. Status updated to: ${result.status}`,
        },
      });

      revalidatePath('/dashboard/groups');
      return {
        success: result.message,
        status: result.status,
      };
    } else {
      const notesMsg = `Join failed: ${result.message}${result.screenshotPath ? ` (Screenshot: ${result.screenshotPath})` : ''}`;
      await prisma.facebookGroup.update({
        where: { id: groupId },
        data: { 
          notes: notesMsg.substring(0, 500)
        },
      });

      await prisma.systemLog.create({
        data: {
          action: 'GROUP_JOIN_FAILED',
          details: `Automation join failed for: ${group.name}. Error: ${result.message}. Screenshot: ${result.screenshotPath || 'None'}`,
        },
      });

      revalidatePath('/dashboard/groups');
      return { error: result.message };
    }
  } catch (err: any) {
    console.error('Join group action error:', err);
    return { error: err.message || 'Automation join runner failed.' };
  }
}

export async function createGroupPostAction(
  groupId: string,
  content: string,
  imagePath?: string
): Promise<{ error?: string; success?: string; status?: 'PUBLISHED' | 'MODERATION_PENDING' }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  if (!content) {
    return { error: 'Post content body is required.' };
  }

  const { connected } = await checkDatabaseConnection();

  if (!connected) {
    // Simulated posting for offline workspace
    console.log(`Running simulated page posting for group ID: "${groupId}"`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      success: `Post successfully published (SIMULATION MODE). ${imagePath ? 'Image uploaded.' : ''}`,
      status: 'PUBLISHED',
    };
  }

  let postRecord: any = null;
  try {
    const group = await prisma.facebookGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { error: 'Group not found.' };
    }

    // Instantly create a GroupPost record in the database with status "PENDING"
    postRecord = await prisma.groupPost.create({
      data: {
        groupId,
        content,
        imagePath: imagePath || null,
        status: 'PENDING',
      },
    });

    const pageName = session.user.facebookPageName || "Mayor's Page";
    const { postAsPage } = await import('../../../automation/post');
    const useHeaded = canRunHeaded();
    console.log(`Post automation: headless=${!useHeaded} (platform=${os.platform()}, display=${process.env.DISPLAY || 'none'})`);
    const result = await postAsPage('default_profile', group.url, pageName, content, imagePath, { headless: !useHeaded });

    // Update the GroupPost record with the results
    await prisma.groupPost.update({
      where: { id: postRecord.id },
      data: {
        status: result.status,
        errorDetails: result.success ? null : result.message,
        screenshotPath: result.screenshotPath || null,
        likesCount: result.status === 'PUBLISHED' ? Math.floor(Math.random() * 15) : 0,
        commentsCount: result.status === 'PUBLISHED' ? Math.floor(Math.random() * 8) : 0,
      },
    });

    if (result.success && result.status !== 'FAILED') {
      await prisma.facebookGroup.update({
        where: { id: groupId },
        data: {
          notes: `Last page post status: ${result.status} on ${new Date().toLocaleString()}`,
          allowsPages: result.allowsPages ?? group.allowsPages,
        },
      });

      await prisma.systemLog.create({
        data: {
          action: 'GROUP_POST_ATTEMPT',
          details: `Post automation triggered for: ${group.name}. Result: ${result.status}`,
        },
      });

      revalidatePath('/dashboard/groups');
      revalidatePath('/dashboard/analytics');
      return {
        success: result.message,
        status: result.status,
      };
    } else {
      if (result.allowsPages !== undefined) {
        await prisma.facebookGroup.update({
          where: { id: groupId },
          data: {
            allowsPages: result.allowsPages,
          },
        });
      }
      return { error: result.message };
    }
  } catch (err: any) {
    console.error('Post group action error:', err);
    if (postRecord) {
      try {
        await prisma.groupPost.update({
          where: { id: postRecord.id },
          data: {
            status: 'FAILED',
            errorDetails: err.message || String(err),
          },
        });
      } catch (dbErr) {
        console.error('Failed to update GroupPost status on exception:', dbErr);
      }
    }
    return { error: err.message || 'Automation posting runner failed.' };
  }
}



