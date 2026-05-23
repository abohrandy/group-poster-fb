'use server';

import { redirect } from 'next/navigation';
import prisma, { checkDatabaseConnection } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, logout } from '@/lib/auth';

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  // Check database connection first
  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    return { error: 'Database is offline. Setup DATABASE_URL in .env and run migrations.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'An account with this email already exists' };
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    // Create session audit log
    await prisma.systemLog.create({
      data: {
        action: 'USER_SIGNUP',
        details: `User registered: ${email}`,
      },
    });

    await createSession(user.id);
  } catch (err: any) {
    console.error('Signup error:', err);
    return { error: err.message || 'Failed to register account' };
  }

  redirect('/dashboard');
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { connected } = await checkDatabaseConnection();
  if (!connected) {
    return { error: 'Database is offline. Setup DATABASE_URL in .env and run migrations.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    await prisma.systemLog.create({
      data: {
        action: 'USER_LOGIN',
        details: `User logged in: ${email}`,
      },
    });

    await createSession(user.id);
  } catch (err: any) {
    console.error('Login error:', err);
    return { error: err.message || 'Failed to authenticate user' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}
