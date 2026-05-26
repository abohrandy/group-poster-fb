import fs from 'fs';
import path from 'path';
import prisma, { checkDatabaseConnection } from '../src/lib/db';

const COOKIES_DIR = path.join(process.cwd(), 'automation', 'cookies');

// Ensure directory exists
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR, { recursive: true });
}

export function getCookiesPath(profileId: string): string {
  // Sanitize profile name to prevent directory traversal
  const safeName = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(COOKIES_DIR, `${safeName}.json`);
}

// Check database and restore to disk if missing
async function syncSessionFromDb(profileId: string): Promise<boolean> {
  const filePath = getCookiesPath(profileId);
  if (fs.existsSync(filePath)) {
    return true;
  }

  // If local file is missing, try loading from DB
  const { connected } = await checkDatabaseConnection();
  if (!connected) return false;

  try {
    const sessionRecord = await prisma.facebookSession.findUnique({
      where: { profileId },
    });

    if (sessionRecord) {
      console.log(`Restoring session state for profile "${profileId}" from database...`);
      await fs.promises.writeFile(filePath, sessionRecord.stateJson, 'utf-8');
      return true;
    }
  } catch (err) {
    console.error(`Failed to sync session from DB for profile ${profileId}:`, err);
  }

  return false;
}

export async function hasSessionState(profileId: string): Promise<boolean> {
  // Try restoring from DB first if not on disk
  await syncSessionFromDb(profileId);
  
  const filePath = getCookiesPath(profileId);
  return fs.existsSync(filePath);
}

function sanitizeState(state: any): any {
  if (!state || !Array.isArray(state.cookies)) {
    return state;
  }

  const cleanCookies = state.cookies.map((cookie: any) => {
    let sameSite = cookie.sameSite;
    if (typeof sameSite === 'string') {
      const lower = sameSite.toLowerCase();
      if (lower === 'no_restriction' || lower === 'none') {
        sameSite = 'None';
      } else if (lower === 'lax') {
        sameSite = 'Lax';
      } else if (lower === 'strict') {
        sameSite = 'Strict';
      } else {
        sameSite = 'Lax';
      }
    } else {
      sameSite = 'Lax';
    }
    return {
      ...cookie,
      sameSite,
    };
  });

  return {
    ...state,
    cookies: cleanCookies,
  };
}

export async function saveSessionState(profileId: string, state: any): Promise<void> {
  const sanitized = sanitizeState(state);
  const filePath = getCookiesPath(profileId);
  const jsonString = JSON.stringify(sanitized, null, 2);
  
  // 1. Save to local disk
  await fs.promises.writeFile(filePath, jsonString, 'utf-8');

  // 2. Save to database
  const { connected } = await checkDatabaseConnection();
  if (connected) {
    try {
      await prisma.facebookSession.upsert({
        where: { profileId },
        update: { stateJson: jsonString },
        create: { profileId, stateJson: jsonString },
      });
      console.log(`Session state for profile "${profileId}" successfully backed up to database.`);
    } catch (err) {
      console.error(`Failed to back up session to DB for profile ${profileId}:`, err);
    }
  }
}

export async function loadSessionState(profileId: string): Promise<any | null> {
  // Ensure we've synced from DB first if file is missing
  await syncSessionFromDb(profileId);

  const filePath = getCookiesPath(profileId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return sanitizeState(parsed);
  } catch (err) {
    console.error(`Failed to parse session state for profile ${profileId}:`, err);
    return null;
  }
}

export async function deleteSessionState(profileId: string): Promise<void> {
  // 1. Delete from local disk
  const filePath = getCookiesPath(profileId);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }

  // 2. Delete from database
  const { connected } = await checkDatabaseConnection();
  if (connected) {
    try {
      await prisma.facebookSession.delete({
        where: { profileId },
      }).catch(() => {}); // Ignore if record doesn't exist
    } catch (err) {
      console.error(`Failed to delete session from DB for profile ${profileId}:`, err);
    }
  }
}
