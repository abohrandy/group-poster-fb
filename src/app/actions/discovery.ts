'use server';

import prisma, { checkDatabaseConnection } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { discoverGroups } from '../../../automation/discovery';
import { revalidatePath } from 'next/cache';

export async function runDiscoveryAction(prevState: any, formData: FormData): Promise<{ error?: string; success?: string; groups?: any[] }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  const keyword = formData.get('keyword') as string;
  const profileId = (formData.get('profileId') as string) || 'default_profile';

  if (!keyword) {
    return { error: 'Search keyword is required.' };
  }

  const { connected } = await checkDatabaseConnection();

  if (!connected) {
    // Simulated search results for offline workspace developer testing
    console.log(`Running simulated discovery search for keyword: "${keyword}"`);
    
    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const cleanedKeyword = keyword.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const simulatedGroups = [
      {
        name: `Automated Discovery: ${keyword} Community`,
        url: `https://facebook.com/groups/auto_${cleanedKeyword}`,
        membersCount: Math.round(1500 + Math.random() * 8000),
        dailyPosts: Math.round(1 + Math.random() * 12),
      },
      {
        name: `Global ${keyword} Networking Forum`,
        url: `https://facebook.com/groups/global_${cleanedKeyword}`,
        membersCount: Math.round(5000 + Math.random() * 15000),
        dailyPosts: Math.round(2 + Math.random() * 20),
      },
    ];

    return {
      success: `Automated discovery completed (SIMULATION MODE). Discovered and synchronized ${simulatedGroups.length} groups.`,
      groups: simulatedGroups,
    };
  }

  try {
    const result = await discoverGroups(profileId, keyword, {
      maxScrolls: 3,
      headless: true,
    });

    if (result.success) {
      revalidatePath('/dashboard/groups');
      return {
        success: result.message,
        groups: result.groups,
      };
    } else {
      return { error: result.message };
    }
  } catch (err: any) {
    console.error('Run discovery action error:', err);
    return { error: err.message || 'Scraper run failed.' };
  }
}
