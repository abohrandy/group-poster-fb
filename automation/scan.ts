import { launchBrowser } from './browser';
import { hasSessionState } from './session';
import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedPost {
  author: string;
  content: string;
  timeText: string;
  postUrl: string;
  likesCount: number;
  commentsCount: number;
}

export async function scanGroupPosts(
  profileId: string,
  groupUrl: string,
  searchKeyword: string,
  options: { headless?: boolean } = {}
): Promise<{ success: boolean; message: string; posts?: ScrapedPost[] }> {
  if (!await hasSessionState(profileId)) {
    return {
      success: false,
      message: `Profile cookies for "${profileId}" are missing. Please authenticate first.`,
    };
  }

  const headless = options.headless !== false;
  console.log(`Launching browser to scan posts in: ${groupUrl}`);
  const { browser, context, page } = await launchBrowser({
    headless,
    profileId,
  });

  try {
    const searchUrl = `${groupUrl.endsWith('/') ? groupUrl : groupUrl + '/' }search/?q=${encodeURIComponent(searchKeyword)}`;
    console.log(`Navigating to group search URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000); // Wait for results to load

    // Scroll down once to trigger client-side React load of more elements
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 0.8);
    });
    await page.waitForTimeout(2000);

    // Extract posts
    const matchedPosts = await page.evaluate((keyword) => {
      // Clean target aliases to search for
      const authorNames = ['Hon. Paul Yerima', 'Yerima Paul', 'Paul Yerima', 'SRHC Hon. Paul Yerima', 'SRHC Hon. Yerima Paul'];
      
      // Select article cards or feed elements
      const articles = Array.from(document.querySelectorAll('[role="feed"] [role="article"], [role="article"]'));
      const results: any[] = [];

      for (const article of articles) {
        const textContent = article.textContent || '';
        
        // Match any of the author name variations in the text
        const hasAuthor = authorNames.some(name => textContent.toLowerCase().includes(name.toLowerCase()));
        if (!hasAuthor) continue;

        const matchedName = authorNames.find(name => textContent.toLowerCase().includes(name.toLowerCase())) || 'Yerima';

        // Extract timestamp/time text
        let timeText = 'Unknown';
        const timeLinks = Array.from(article.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], span[id*="jsc_"]'));
        for (const tl of timeLinks) {
          const txt = tl.textContent?.trim();
          if (txt && (txt.includes('hr') || txt.includes('min') || txt.includes('Yesterday') || txt.includes('Just now') || /[A-Z][a-z]+ \d+/.test(txt))) {
            timeText = txt;
            break;
          }
        }

        // Extract post body content
        let contentText = '';
        const contentDivs = Array.from(article.querySelectorAll('[data-ad-comet-preview="x_msg"], [data-ad-preview="message"]'));
        if (contentDivs.length > 0) {
          contentText = contentDivs.map(d => d.textContent?.trim()).join('\n');
        } else {
          contentText = textContent.substring(0, 300) + '...';
        }

        // Extract post permalink
        let postUrl = '';
        const linkElements = Array.from(article.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"]'));
        if (linkElements.length > 0) {
          postUrl = (linkElements[0] as HTMLAnchorElement).href;
        }

        // Try to parse basic engagement counts
        // Facebook shows counts in elements with aria-label containing likes/comments
        let likesCount = 0;
        let commentsCount = 0;

        const textLower = textContent.toLowerCase();
        
        // Simple text-based regex fallback for likes/comments
        const likeMatch = textLower.match(/(\d+)\s*(?:like|reaction|care|love)/);
        if (likeMatch) {
          likesCount = parseInt(likeMatch[1], 10);
        }
        const commentMatch = textLower.match(/(\d+)\s*(?:comment|repl)/);
        if (commentMatch) {
          commentsCount = parseInt(commentMatch[1], 10);
        }

        results.push({
          author: matchedName,
          content: contentText.trim(),
          timeText,
          postUrl,
          likesCount,
          commentsCount
        });
      }

      return results;
    }, searchKeyword);

    await browser.close();
    return {
      success: true,
      message: `Scanned search page. Found ${matchedPosts.length} posts.`,
      posts: matchedPosts
    };

  } catch (err: any) {
    console.error('Scan group posts automation error:', err);
    await browser.close().catch(() => {});
    return {
      success: false,
      message: `Automation error: ${err.message || String(err)}`
    };
  }
}
