'use server';

import prisma from '@/lib/db';
import { validateSession, hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

import { authenticateFacebookProfile } from '../../../automation/login';

export async function updateSettingsAction(prevState: any, formData: FormData): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const name = formData.get('name') as string;
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { error: 'User not found.' };
    }

    const updateData: { name?: string | null; passwordHash?: string } = {};

    if (name !== undefined) {
      updateData.name = name || null;
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return { error: 'Both current password and new password are required to change password.' };
      }

      if (newPassword.length < 6) {
        return { error: 'New password must be at least 6 characters long.' };
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return { error: 'Incorrect current password.' };
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await prisma.systemLog.create({
      data: {
        action: 'USER_SETTINGS_UPDATE',
        details: `Updated settings for user: ${user.email}`,
      },
    });

    revalidatePath('/dashboard/settings');
    return { success: 'Profile settings updated successfully.' };
  } catch (err: any) {
    console.error('Settings update error:', err);
    return { error: err.message || 'Failed to update settings.' };
  }
}

export async function authenticateFacebookAction(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const profileId = (formData.get('profileId') as string) || 'default_profile';
  const email = formData.get('fbEmail') as string;
  const password = formData.get('fbPassword') as string;

  if (!email || !password) {
    return { error: 'Facebook Email and Password are required.' };
  }

  try {
    const result = await authenticateFacebookProfile(profileId, email, password, true);

    if (result.success) {
      await prisma.systemLog.create({
        data: {
          action: 'FACEBOOK_AUTH_SUCCESS',
          details: `Facebook profile "${profileId}" authenticated successfully.`,
        },
      });
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard/groups');
      return { success: result.message };
    } else {
      await prisma.systemLog.create({
        data: {
          action: 'FACEBOOK_AUTH_FAIL',
          details: `Facebook profile "${profileId}" auth failed: ${result.message}`,
        },
      });
      const errorMsg = result.message + (result.screenshotPath ? ` (A screenshot of the page was saved. View it at: ${result.screenshotPath})` : '');
      return { error: errorMsg };
    }
  } catch (err: any) {
    console.error('Facebook auth action error:', err);
    return { error: err.message || 'Automation login runner failed.' };
  }
}

