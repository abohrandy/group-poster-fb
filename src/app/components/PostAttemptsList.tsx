'use client';

import { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Image as ImageIcon, 
  X,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface GroupPost {
  id: string;
  groupId: string;
  group: {
    name: string;
    url: string;
  };
  content: string;
  imagePath: string | null;
  status: string; // PENDING, PUBLISHED, FAILED, MODERATION_PENDING
  errorDetails: string | null;
  screenshotPath: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

interface PostAttemptsListProps {
  posts: GroupPost[];
}

export default function PostAttemptsList({ posts }: PostAttemptsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [selectedPostText, setSelectedPostText] = useState<string | null>(null);

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.errorDetails && post.errorDetails.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = 
      statusFilter === 'ALL' || 
      post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-950/40 p-4 rounded-xl border border-gray-800">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search posts, groups, errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900/60 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['ALL', 'PUBLISHED', 'MODERATION_PENDING', 'FAILED', 'PENDING'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === status
                  ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                  : 'bg-gray-900/30 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900/60'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Attempts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl bg-gray-950/10">
          <AlertCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No posting attempts found</p>
          <p className="text-gray-500 text-xs mt-1">Try adjusting your filters or publish a new post.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <div 
              key={post.id} 
              className="p-5 rounded-2xl border border-gray-800 bg-gray-950/20 hover:border-gray-700/50 transition-all duration-300 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center relative overflow-hidden"
            >
              {/* Main Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-base truncate">{post.group.name}</span>
                  <a
                    href={post.group.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 hover:text-indigo-400 transition-colors p-1"
                    title="Visit Facebook Group"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <span className="text-[10px] text-gray-500 font-mono bg-gray-900/50 px-2 py-0.5 rounded border border-gray-900/80">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Content snippet */}
                <p 
                  onClick={() => setSelectedPostText(post.content)}
                  className="text-gray-300 text-sm line-clamp-2 cursor-pointer hover:text-white transition-colors leading-relaxed"
                  title="Click to view full post content"
                >
                  {post.content}
                </p>

                {/* Error message if failed */}
                {post.status === 'FAILED' && post.errorDetails && (
                  <div className="p-3 rounded-lg border border-rose-500/10 bg-rose-500/5 text-rose-400 text-xs font-mono max-w-2xl overflow-x-auto whitespace-pre-wrap mt-2">
                    <span className="font-semibold uppercase tracking-wider block mb-1 text-[10px]">Error Details:</span>
                    {post.errorDetails}
                  </div>
                )}

                {/* Footer specs */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    {post.status === 'PUBLISHED' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    {post.status === 'FAILED' && <XCircle className="h-4 w-4 text-rose-400" />}
                    {post.status === 'MODERATION_PENDING' && <Clock className="h-4 w-4 text-amber-400" />}
                    {post.status === 'PENDING' && <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />}
                    <span className={`font-semibold uppercase tracking-wider text-[10px] ${
                      post.status === 'PUBLISHED' ? 'text-emerald-400/90' :
                      post.status === 'FAILED' ? 'text-rose-400/90' :
                      post.status === 'MODERATION_PENDING' ? 'text-amber-400/90' :
                      'text-indigo-400/90'
                    }`}>
                      {post.status.replace('_', ' ')}
                    </span>
                  </span>

                  {post.imagePath && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <ImageIcon className="h-3.5 w-3.5" /> Media Included
                    </span>
                  )}

                  {/* Engagement Metrics */}
                  {post.status === 'PUBLISHED' && (
                    <div className="flex gap-3 border-l border-gray-800 pl-4">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="h-3.5 w-3.5 fill-rose-500/10" /> {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1 text-sky-400">
                        <MessageSquare className="h-3.5 w-3.5 fill-sky-500/10" /> {post.commentsCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action area: Screenshot or details */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {post.screenshotPath ? (
                  <button
                    onClick={() => setSelectedScreenshot(post.screenshotPath)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-xs font-semibold text-gray-300 hover:text-white rounded-lg transition-all"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-400" />
                    View Screenshot
                  </button>
                ) : (
                  post.status !== 'PENDING' && (
                    <span className="text-xs text-gray-600 font-medium italic select-none">No screenshot available</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-900 flex justify-between items-center">
              <h3 className="font-bold text-white">Browser Capture State</h3>
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 bg-gray-900/30 flex items-center justify-center min-h-[300px]">
              <img 
                src={selectedScreenshot} 
                alt="Facebook automation screenshot" 
                className="max-h-[70vh] rounded-lg border border-gray-800 shadow-xl object-contain"
              />
            </div>
            <div className="p-4 bg-gray-950 border-t border-gray-900 flex justify-between items-center text-xs text-gray-500 font-mono">
              <span>Path: {selectedScreenshot}</span>
              <a 
                href={selectedScreenshot} 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                Open in New Tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Post Text Modal */}
      {selectedPostText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-xl w-full bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-900 flex justify-between items-center">
              <h3 className="font-bold text-white">Full Post Content</h3>
              <button 
                onClick={() => setSelectedPostText(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedPostText}</p>
            </div>
            <div className="p-4 bg-gray-950 border-t border-gray-900 flex justify-end">
              <button 
                onClick={() => setSelectedPostText(null)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
