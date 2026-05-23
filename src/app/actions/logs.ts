'use server';

import prisma from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createTestLogAction() {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  try {
    await prisma.systemLog.create({
      data: {
        action: 'TEST_ACTION',
        details: `Operator ${session.user.email} triggered a test database write action.`,
      },
    });
    revalidatePath('/dashboard');
    return { success: 'Database write successful! A new system log has been recorded.' };
  } catch (err: any) {
    console.error('Test log write error:', err);
    return { error: err.message || 'Failed to write log to PostgreSQL database.' };
  }
}
