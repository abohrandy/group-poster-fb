'use server';

import prisma, { checkDatabaseConnection } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { generateCaptionVariations } from '@/lib/ai';
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

export async function updateGroupStatusAction(groupId: string, status: string): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    return { error: 'Database is offline.' };
  }

  try {
    const group = await prisma.facebookGroup.update({
      where: { id: groupId },
      data: { status },
    });

    await prisma.systemLog.create({
      data: {
        action: 'GROUP_STATUS_UPDATED',
        details: `Manually updated status of: ${group.name} to ${status}`,
      },
    });

    revalidatePath('/dashboard/groups');
    return { success: `Successfully updated status of ${group.name} to ${status}` };
  } catch (err: any) {
    console.error('Update group status error:', err);
    return { error: err.message || 'Failed to update group status.' };
  }
}

export async function createCampaignAction(
  groupIds: string[],
  baseContent: string,
  delayMinutes: number,
  rotateVariations: boolean,
  imagePath?: string
): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  if (!groupIds || groupIds.length === 0) {
    return { error: 'No groups selected for the campaign.' };
  }

  if (!baseContent) {
    return { error: 'Post content body is required.' };
  }

  const { connected } = await checkDatabaseConnection();

  // Setup text variations
  let textOptions = [baseContent];
  if (rotateVariations && connected) {
    try {
      const variations = await generateCaptionVariations(baseContent);
      if (variations && variations.length > 0) {
        textOptions = variations.map((v) => v.caption);
      }
    } catch (aiErr) {
      console.warn('AI variation generation failed during campaign creation, falling back to base content:', aiErr);
    }
  }

  if (!connected) {
    // Simulated Campaign Setup for offline mode
    console.log(`Running simulated campaign scheduler for ${groupIds.length} groups with ${delayMinutes}m delay`);
    return {
      success: `Campaign successfully created (SIMULATION MODE). ${groupIds.length} posts queued with ${delayMinutes}m intervals.`,
    };
  }

  try {
    const postedAs = session.user.facebookPageName || "Mayor's Page";
    
    // Fetch all groups to ensure they exist
    const targetGroups = await prisma.facebookGroup.findMany({
      where: { id: { in: groupIds } }
    });

    const now = Date.now();
    const postsData = targetGroups.map((group, index) => {
      const scheduledAt = new Date(now + index * delayMinutes * 60 * 1000);
      const content = textOptions[index % textOptions.length];
      return {
        groupId: group.id,
        content,
        imagePath: imagePath || null,
        status: 'PENDING',
        scheduledAt,
        postedAs,
      };
    });

    // Create all the scheduled posts
    await prisma.groupPost.createMany({
      data: postsData,
    });

    await prisma.systemLog.create({
      data: {
        action: 'CAMPAIGN_CREATED',
        details: `Created post campaign for ${targetGroups.length} groups with ${delayMinutes} min delay. Total posts queued: ${postsData.length}`,
      },
    });

    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/analytics');

    return {
      success: `Campaign created successfully! ${postsData.length} posts have been scheduled with a ${delayMinutes}-minute delay.`,
    };
  } catch (err: any) {
    console.error('Campaign creation action error:', err);
    return { error: err.message || 'Failed to create campaign schedule.' };
  }
}

export async function deleteGroupsAction(groupIds: string[]): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  if (!groupIds || groupIds.length === 0) {
    return { error: 'No groups selected for deletion.' };
  }

  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    return { error: 'Database is offline. Unable to delete groups.' };
  }

  try {
    const result = await prisma.facebookGroup.deleteMany({
      where: { id: { in: groupIds } },
    });

    await prisma.systemLog.create({
      data: {
        action: 'GROUPS_BULK_DELETED',
        details: `Deleted ${result.count} Facebook groups via bulk action.`,
      },
    });

    revalidatePath('/dashboard/groups');
    return { success: `Successfully deleted ${result.count} groups.` };
  } catch (err: any) {
    console.error('Bulk delete groups error:', err);
    return { error: err.message || 'Failed to delete groups.' };
  }
}

export async function scanGroupPostsAction(groupId: string): Promise<{ error?: string; success?: string; postsCount?: number }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const { connected } = await checkDatabaseConnection();

  if (!connected) {
    // Simulated scan for offline mode
    console.log(`Running simulated post scan for group ID: "${groupId}"`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      success: 'Scan completed successfully (SIMULATED). No new manual posts found.',
      postsCount: 0,
    };
  }

  try {
    const group = await prisma.facebookGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { error: 'Group not found.' };
    }

    const { scanGroupPosts } = await import('../../../automation/scan');
    const useHeaded = canRunHeaded();
    console.log(`Scan automation: headless=${!useHeaded} (platform=${os.platform()}, display=${process.env.DISPLAY || 'none'})`);
    
    const result = await scanGroupPosts('default_profile', group.url, 'Yerima', { headless: !useHeaded });

    if (!result.success || !result.posts) {
      return { error: result.message };
    }

    let newPostsCount = 0;
    for (const post of result.posts) {
      // Check if a post with similar content already exists
      const existing = await prisma.groupPost.findFirst({
        where: {
          groupId,
          content: post.content,
        },
      });

      if (!existing) {
        await prisma.groupPost.create({
          data: {
            groupId,
            content: post.content,
            status: 'PUBLISHED',
            postedAs: post.author,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            scheduledAt: new Date(),
            createdAt: new Date(),
          },
        });
        newPostsCount++;
      } else {
        // Update engagement metrics if already exists
        await prisma.groupPost.update({
          where: { id: existing.id },
          data: {
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
          },
        });
      }
    }

    const scanNotes = `Last scan on ${new Date().toLocaleString()}: found ${result.posts.length} posts by campaign accounts (${newPostsCount} new).`;
    
    await prisma.facebookGroup.update({
      where: { id: groupId },
      data: {
        notes: scanNotes.substring(0, 500),
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'GROUP_POSTS_SCANNED',
        details: `Scanned group ${group.name}. Found ${result.posts.length} matching posts (${newPostsCount} new saved).`,
      },
    });

    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/analytics');

    return {
      success: `Scan complete! Scraped ${result.posts.length} posts (${newPostsCount} new imported to database).`,
      postsCount: result.posts.length,
    };
  } catch (err: any) {
    console.error('Scan group posts action error:', err);
    return { error: err.message || 'Posts scanning runner failed.' };
  }
}
