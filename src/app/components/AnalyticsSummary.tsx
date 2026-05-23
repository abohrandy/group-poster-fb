'use client';

import { BarChart3, CheckCircle2, XCircle, Heart, MessageSquare } from 'lucide-react';

interface AnalyticsSummaryProps {
  totalAttempts: number;
  publishedCount: number;
  failedCount: number;
  moderationPendingCount: number;
  totalLikes: number;
  totalComments: number;
}

export default function AnalyticsSummary({
  totalAttempts,
  publishedCount,
  failedCount,
  moderationPendingCount,
  totalLikes,
  totalComments,
}: AnalyticsSummaryProps) {
  const successRate = totalAttempts > 0 ? Math.round((publishedCount / totalAttempts) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Attempts Card */}
      <div className="relative group overflow-hidden p-6 rounded-2xl border border-gray-800 bg-gray-950/20 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-600" />
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Posting Runs</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{totalAttempts}</span>
          <span className="text-xs text-gray-400">attempts</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 font-medium">Includes success, pending moderation & failures</p>
      </div>

      {/* Success Rate Card */}
      <div className="relative group overflow-hidden p-6 rounded-2xl border border-gray-800 bg-gray-950/20 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500" />
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Publish Success Rate</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{successRate}%</span>
          <span className="text-xs text-gray-400">published directly</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 font-medium">
          {publishedCount} direct publishes &bull; {moderationPendingCount} pending admin
        </p>
      </div>

      {/* Engagement Tracking Card */}
      <div className="relative group overflow-hidden p-6 rounded-2xl border border-gray-800 bg-gray-950/20 backdrop-blur-md transition-all duration-300 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/5">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracked Engagement</span>
          <div className="flex gap-1 items-center">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Heart className="h-4 w-4" />
            </div>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{totalLikes + totalComments}</span>
          <span className="text-xs text-gray-400">interactions</span>
        </div>
        <div className="flex gap-3 text-[11px] text-gray-500 mt-2 font-medium">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-400/80" /> {totalLikes} likes</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-sky-400/80" /> {totalComments} comments</span>
        </div>
      </div>

      {/* Failed Posts Card */}
      <div className="relative group overflow-hidden p-6 rounded-2xl border border-gray-800 bg-gray-950/20 backdrop-blur-md transition-all duration-300 hover:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/5">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-red-600" />
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed Runs</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{failedCount}</span>
          <span className="text-xs text-gray-400">runs failed</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 font-medium">Requires identity check or session refresh</p>
      </div>
    </div>
  );
}
