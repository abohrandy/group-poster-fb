import fs from 'fs';
import path from 'path';

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

export function hasSessionState(profileId: string): boolean {
  const filePath = getCookiesPath(profileId);
  return fs.existsSync(filePath);
}

export async function saveSessionState(profileId: string, state: any): Promise<void> {
  const filePath = getCookiesPath(profileId);
  await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

export async function loadSessionState(profileId: string): Promise<any | null> {
  const filePath = getCookiesPath(profileId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to parse session state for profile ${profileId}:`, err);
    return null;
  }
}

export async function deleteSessionState(profileId: string): Promise<void> {
  const filePath = getCookiesPath(profileId);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}
