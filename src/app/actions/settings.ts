'use server';

import prisma from '@/lib/db';
import { validateSession, hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
