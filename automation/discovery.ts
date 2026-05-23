import { launchBrowser } from './browser';
import { hasSessionState } from './session';
import prisma from '../src/lib/db';

interface DiscoveredGroupResult {
  name: string;
  url: string;
  membersCount: number;
  dailyPosts: number;
}

// Helper to parse member count text like "12.4K members" or "835 members" into a clean integer
function parseMemberCount(text: string): number {
  if (!text) return 0;
  // Match a number optionally followed by K or M, but NOT followed by 'e' (to avoid matching 'm' in 'members')
  const match = text.match(/([0-9.,]+)\s*([KM])(?!e)/i);
  if (match) {
    let num = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2].toUpperCase();
    if (multiplier === 'K') num *= 1000;
    else if (multiplier === 'M') num *= 1000000;
    return Math.round(num);
  }
  
  // No K/M suffix — just a plain number like "835 members"
  const plainMatch = text.match(/([0-9.,]+)/);
  if (plainMatch) {
    return Math.round(parseFloat(plainMatch[1].replace(/,/g, '')));
  }
  return 0;
}

// Helper to parse daily post count text like "3 posts a day" or "10+ posts/day"
function parseDailyPosts(text: string): number {
  if (!text) return 0;
  // Match patterns like "X posts a day", "X+ posts a day", "X new posts a day", "X posts/day"
  const match = text.match(/([0-9.,]+)\+?\s*(?:new\s+)?posts?\s*(?:a|per|\/|each)\s*day/i);
  if (!match) return 0;
  return Math.round(parseFloat(match[1].replace(/,/g, '')));
}

export async function discoverGroups(
  profileId: string,
  keyword: string,
  options: { maxScrolls?: number; headless?: boolean } = {}
): Promise<{ success: boolean; message: string; groups?: DiscoveredGroupResult[] }> {
  // 1. Verify that profile session cookies exist
  if (!await hasSessionState(profileId)) {
    return {
      success: false,
      message: `Profile cookies for "${profileId}" are missing. Please authenticate via the login manager first.`,
    };
  }

  const maxScrolls = options.maxScrolls ?? 3; // Default 3 scrolls to start slow
  const headless = options.headless !== false;

  console.log(`Launching browser for keyword discovery: "${keyword}"...`);
  const { browser, context, page } = await launchBrowser({
    headless,
    profileId,
  });

  try {
    // 2. Navigate to Facebook Group Search
    const searchUrl = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(keyword)}`;
    console.log(`Navigating to search page: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait for client-side React cards to render

    // Check if we are logged in by checking the current URL or search inputs
    const isLoginRequired = page.url().includes('login') || (await page.locator('input[name="email"]').isVisible().catch(() => false));
    if (isLoginRequired) {
      await browser.close();
      return {
        success: false,
        message: 'Facebook session has expired or is invalid. Please log in again to refresh cookies.',
      };
    }

    // 3. Human-like slow scrolling
    console.log(`Scrolling search page slowly (scroll count: ${maxScrolls})...`);
    for (let i = 0; i < maxScrolls; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 0.85);
      });
      // Wait between 2.0s and 3.5s (jittered)
      const waitTime = 2000 + Math.random() * 1500;
      await page.waitForTimeout(waitTime);
      console.log(`Scroll ${i + 1}/${maxScrolls} finished. Waiting ${Math.round(waitTime)}ms...`);
    }

    // 4. Parse group search results from DOM
    console.log('Extracting group result cards...');
    const rawGroups = await page.evaluate(() => {
      const results: Array<{ name: string; url: string; memberText: string; postsText: string }> = [];
      const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));

      for (const link of links) {
        const href = (link as HTMLAnchorElement).href;
        if (!href) continue;

        const cleanUrl = href.split('?')[0].split('&')[0];
        const parts = cleanUrl.split('/groups/');
        if (parts.length !== 2) continue;

        const groupId = parts[1].replace(/\//g, '');
        if (!groupId || groupId === 'feed' || groupId === 'discover') continue;

        // Traverse up to find card container containing members metadata
        let parent: HTMLElement | null = link.parentElement;
        let card: HTMLElement | null = null;
        for (let i = 0; i < 10; i++) {
          if (!parent) break;
          if (parent.textContent && parent.textContent.toLowerCase().includes('members')) {
            card = parent;
          }
          parent = parent.parentElement;
        }

        if (card) {
          const name = link.textContent?.trim() || '';
          const text = card.textContent || '';
          const memberMatch = text.match(/([0-9.,]+\s*[KM]?)\s*members/i);
          const memberText = memberMatch ? memberMatch[0] : '';
          
          // Extract daily post count (e.g. "3 posts a day", "10+ new posts a day")
          const postsMatch = text.match(/[0-9.,]+\+?\s*(?:new\s+)?posts?\s*(?:a|per|\/|each)\s*day/i);
          const postsText = postsMatch ? postsMatch[0] : '';

          if (name && cleanUrl && !results.some((r) => r.url === cleanUrl)) {
            results.push({ name, url: cleanUrl, memberText, postsText });
          }
        }
      }
      return results;
    });

    console.log(`Discovered ${rawGroups.length} raw groups. Formatting and saving to database...`);
    const parsedGroups: DiscoveredGroupResult[] = [];

    // 5. Save to database with sequential rate-limiting delays
    for (const raw of rawGroups) {
      const membersCount = parseMemberCount(raw.memberText);
      const dailyPosts = parseDailyPosts(raw.postsText);
      const groupData = {
        name: raw.name,
        url: raw.url,
        membersCount,
        dailyPosts,
      };

      try {
        // Upsert into database
        await prisma.facebookGroup.upsert({
          where: { url: raw.url },
          update: {
            name: raw.name,
            membersCount,
            dailyPosts,
          },
          create: {
            name: raw.name,
            url: raw.url,
            membersCount,
            dailyPosts,
            status: 'ACTIVE',
          },
        });

        parsedGroups.push(groupData);
        console.log(`Database sync: ${raw.name} (${membersCount} members, ~${dailyPosts} posts/day)`);
      } catch (dbErr) {
        console.error(`Failed to upsert group ${raw.name} in DB:`, dbErr);
      }

      // Start slow: delay between DB writes (500ms - 1000ms)
      await page.waitForTimeout(500 + Math.random() * 500);
    }

    // Log the automated run to the system auditor
    await prisma.systemLog.create({
      data: {
        action: 'AUTOMATED_DISCOVERY',
        details: `Automated group discovery run for "${keyword}". Discovered ${parsedGroups.length} groups.`,
      },
    });

    await browser.close();
    return {
      success: true,
      message: `Discovered and synchronized ${parsedGroups.length} groups in database.`,
      groups: parsedGroups,
    };
  } catch (err: any) {
    console.error('Group discovery scraper encountered an error:', err);
    await browser.close().catch(() => {});
    return {
      success: false,
      message: `Scraper error: ${err.message || String(err)}`,
    };
  }
}
