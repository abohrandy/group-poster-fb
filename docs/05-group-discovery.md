# Facebook Group Discovery

This document details the operational mechanics of Facebook groups, platform constraints, and strategies for group discovery (sourcing target communities).

## How Groups Work

Facebook groups are user-driven forums centered around specific topics, locations, or interests. From a marketing and scraping perspective, groups have key attributes that govern access:

1. **Privacy Settings**:
   - **Public Groups**: Content and member lists are visible to anyone on or off Facebook. These can be scraped without logging in (using anonymous sessions) and are the easiest targets.
   - **Private Groups**: Content is only visible to joined members. Scraping requires an authenticated Facebook account that has been approved as a member of the group.
   - **Secret Groups**: Invisible to non-members. Sourcing requires an invitation. These are generally outside the scope of discovery automation.
2. **Posting & Member Restrictions**:
   - **Allows Pages**: Some groups allow Facebook Pages to join and interact, while others restrict membership strictly to personal user profiles.
   - **Post Approval**: Administrators can enable post-approval queues, preventing bots from immediately publishing content.
   - **Admin/Moderator Moderation**: Active moderation restricts spam and flags bot-like account behavior.

## Facebook Limitations

Scraping Facebook data is highly challenging due to Facebook's robust anti-scraping controls. Main limitations include:

- **Rate Limiting**: Facebook restricts the volume of requests or clicks an account can make in a given timeframe. Rapid page refreshes or quick, repeating transitions trigger temporary blocks.
- **Account Flagging & Checkpoints**: Logging in from unrecognized locations, using headless browsers with automation flags, or executing repetitive tasks triggers security "checkpoints" (requiring SMS verification, photo ID verification, or forcing password resets).
- **IP Address Blocking**: High-volume traffic originating from known data center proxy addresses is flagged or blocked with a CAPTCHA gate.
- **Dynamic CSS Classes**: Facebook utilizes highly obfuscated and dynamic HTML class names (e.g. `class="x1lliihq x6ikm8r..."`) that change frequently, rendering static selectors obsolete. scrapers must rely on structural selector patterns (XPaths, aria-roles, text matches) instead of standard Tailwind/bootstrap class names.

## Manual vs. Automated Sourcing

Finding relevant Facebook groups can be done manually or via automated crawlers.

| Sourcing Aspect | Manual Sourcing | Automated Sourcing |
| :--- | :--- | :--- |
| **Speed & Volume** | Slow. Limited to human browsing capacity (e.g. 20-30 groups/hour). | High. Can process hundreds of search queries and index thousands of groups. |
| **Data Quality** | Extremely High. A human operator instantly filters out spam or dead groups. | Medium. May scrape dead groups, needing algorithmic activity filtering. |
| **Security Risk** | Zero. Legitimate browser interactions will not trigger account lockouts. | High. Runs headless browsers which can trigger checkpoints if not stealthed. |
| **Complexity** | Simple. Requires no technical architecture or proxy setup. | Complex. Requires rotating proxies, cookie refreshes, and anti-detection engines. |

### Sourcing Strategy
To maximize discovery efficiency, a hybrid flow is recommended:
1. **Automated Scanning**: The Playwright bot queries keyword phrases, parses search result cards, and scrapes general metadata (group URL, title, privacy, member count).
2. **Manual Vetting**: Operators review the scraped groups in the `SocialDiscovery` control panel, filter by member size and status, add custom notes, and mark verified groups as `"ACTIVE"` or archive bad groups.
