import { validateSession } from '@/lib/auth';
import prisma, { checkDatabaseConnection } from '@/lib/db';
import AnalyticsSummary from '@/app/components/AnalyticsSummary';
import PostAttemptsList from '@/app/components/PostAttemptsList';
import { BarChart3, Database, ShieldAlert, FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics & Tracking - SocialDiscovery Console',
  description: 'Track publication success rates, browser automation captures, and post engagement analytics.',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await validateSession();
  const { connected, error: dbError } = await checkDatabaseConnection();

  let posts: any[] = [];
  let summary = {
    totalAttempts: 0,
    publishedCount: 0,
    failedCount: 0,
    moderationPendingCount: 0,
    totalLikes: 0,
    totalComments: 0,
  };

  if (connected) {
    try {
      posts = await prisma.groupPost.findMany({
        include: {
          group: {
            select: {
              name: true,
              url: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate aggregates
      summary.totalAttempts = posts.length;
      summary.publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
      summary.failedCount = posts.filter(p => p.status === 'FAILED').length;
      summary.moderationPendingCount = posts.filter(p => p.status === 'MODERATION_PENDING').length;
      
      summary.totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
      summary.totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
    } catch (err) {
      console.error('Failed to query analytics posts:', err);
    }
  } else {
    // Generate realistic simulated mock posts if database is offline
    posts = [
      {
        id: 'mock-post-1',
        groupId: 'mock-group-1',
        group: {
          name: 'Dublin Housing & Rentals Community',
          url: 'https://www.facebook.com/groups/dublinrentals',
        },
        content: 'Hey everyone! Just a reminder that Dublin City Council has approved the new housing development grants for local landlords starting this winter. Applications are open until July 15th. Apply today at dublincity.ie/grants!',
        imagePath: null,
        status: 'PUBLISHED',
        errorDetails: null,
        screenshotPath: null,
        likesCount: 14,
        commentsCount: 5,
        createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      },
      {
        id: 'mock-post-2',
        groupId: 'mock-group-2',
        group: {
          name: 'Waterford Local Exchange',
          url: 'https://www.facebook.com/groups/waterfordexchange',
        },
        content: 'Ireland Clean Energy Initiative meeting starts this Thursday at 7 PM in Waterford City Hall. We will discuss solar energy integrations for residential rooftops. The Mayor and several councillors will attend. Everyone is welcome!',
        imagePath: '/public/images/solar.jpg',
        status: 'MODERATION_PENDING',
        errorDetails: null,
        screenshotPath: null,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      },
      {
        id: 'mock-post-3',
        groupId: 'mock-group-3',
        group: {
          name: 'Cork City Business Networking',
          url: 'https://www.facebook.com/groups/corkbusiness',
        },
        content: 'Excited to announce the new Small Business Grant scheme launching in Cork next month! Up to €5,000 in funding for local startups focusing on circular economy projects. Join our webinar to learn more about eligibility requirements.',
        imagePath: null,
        status: 'FAILED',
        errorDetails: 'Automation error: Could not find the "Write something..." input box. Posting may be restricted. User account might be blocked from posting in this group or requires member validation.',
        screenshotPath: null,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
      },
      {
        id: 'mock-post-4',
        groupId: 'mock-group-4',
        group: {
          name: 'Galway Residents Group',
          url: 'https://www.facebook.com/groups/galwayresidents',
        },
        content: 'Traffic warning: Resurfacing works will take place on Shop Street starting next Monday, causing temporary road closures and detours between 9 AM and 4 PM daily. Plan your journeys accordingly and expect delays.',
        imagePath: null,
        status: 'PUBLISHED',
        screenshotPath: null,
        likesCount: 22,
        commentsCount: 9,
        createdAt: new Date(Date.now() - 1000 * 60 * 600), // 10 hours ago
      },
    ];

    summary = {
      totalAttempts: 4,
      publishedCount: 2,
      failedCount: 1,
      moderationPendingCount: 1,
      totalLikes: 36,
      totalComments: 14,
    };
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            Posting Analytics & Screenshots
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track automated publication attempts, check browser screenshot state captures, and view post engagement.
          </p>
        </div>
      </div>

      {/* Database Offline Warning */}
      {!connected && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex gap-3 items-start backdrop-blur-md">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-rose-300">PostgreSQL Offline (Simulation Data Active)</h4>
            <p className="text-rose-400/80 mt-1">
              The database connection is currently unavailable. A simulated local analytics log is displayed below. Connection Error:
            </p>
            {dbError && (
              <details className="mt-2 text-xs text-rose-400/60 cursor-pointer">
                <summary className="hover:text-rose-400">View Connection Details</summary>
                <pre className="mt-1 p-2 bg-rose-950/30 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">{dbError}</pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards Aggregates */}
      <AnalyticsSummary
        totalAttempts={summary.totalAttempts}
        publishedCount={summary.publishedCount}
        failedCount={summary.failedCount}
        moderationPendingCount={summary.moderationPendingCount}
        totalLikes={summary.totalLikes}
        totalComments={summary.totalComments}
      />

      {/* Attempts log list */}
      <div className="p-6 rounded-2xl border border-gray-800 bg-gray-950/20 backdrop-blur-sm space-y-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-400" />
          Posting Runs & Captured State Log
        </h3>
        <PostAttemptsList posts={posts} />
      </div>
    </div>
  );
}
