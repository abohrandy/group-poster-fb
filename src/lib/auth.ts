import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './db';

const COOKIE_NAME = 'session_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const session = await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expiresAt,
    },
  });

  await setSessionCookie(token, expiresAt);
  return session;
}

export async function validateSession() {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      await deleteSessionCookie();
      return null;
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      await deleteSessionCookie();
      return null;
    }

    // Sliding window: extend session lifetime if less than 3 days left
    const remaining = session.expiresAt.getTime() - new Date().getTime();
    if (remaining < 1000 * 60 * 60 * 24 * 3) {
      const newExpires = new Date();
      newExpires.setDate(newExpires.getDate() + 7);
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpires },
      });
      await setSessionCookie(token, newExpires);
    }

    return session;
  } catch (err) {
    // If DB fails, return null but don't crash
    console.error("Session verification error:", err);
    return null;
  }
}

export async function logout() {
  const token = await getSessionToken();
  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { sessionToken: token },
      });
    } catch (err) {
      console.error("Session delete error:", err);
    }
  }
  await deleteSessionCookie();
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}
