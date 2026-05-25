'use client';

import { useActionState } from 'react';
import { runDiscoveryAction } from '@/app/actions/discovery';
import { Search, Loader2, CheckCircle2, AlertTriangle, Shield, Globe, ChevronDown } from 'lucide-react';

const initialState = {
  error: '',
  success: '',
  groups: [] as Array<{ name: string; url: string; membersCount: number; dailyPosts: number }>,
};

export default function AutomatedSearchForm() {
  const [state, formAction, isPending] = useActionState(runDiscoveryAction, initialState);

  return (
    <div className="bg-gray-950/20 border border-gray-800 rounded-xl p-6 backdrop-blur-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-400" />
          Automated Group Discovery Search
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Triggers a headless Playwright instance to scrape Facebook group search results for a keyword.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{state.success}</span>
            </div>
            
            {/* Show results list if any */}
            {state.groups && state.groups.length > 0 && (
              <div className="border border-gray-800 rounded-lg p-3 bg-gray-950/40 text-xs space-y-2">
                <div className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] pb-2 border-b border-gray-900">
                  Groups Synchronized:
                </div>
                {state.groups.map((group, index) => (
                  <div key={index} className="flex justify-between items-center text-gray-200">
                    <span className="truncate max-w-[200px] font-medium" title={group.name}>{group.name}</span>
                    <span className="text-indigo-400 font-mono text-[10px] whitespace-nowrap">
                      {group.membersCount.toLocaleString()} members
                      {group.dailyPosts > 0 && ` · ${group.dailyPosts}/day`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Search Keyword *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="keyword"
                required
                placeholder="e.g. London Real Estate, Gardening UK"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Search Depth</label>
            <div className="relative">
              <select
                name="maxScrolls"
                defaultValue="3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans appearance-none cursor-pointer pr-10"
              >
                <option value="3" className="bg-gray-900 text-white">Quick Scan (~30 groups)</option>
                <option value="10" className="bg-gray-900 text-white">Balanced (~80 groups)</option>
                <option value="25" className="bg-gray-900 text-white">Deep Scan (~200 groups)</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Scraper Profile</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Shield className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="profileId"
                defaultValue="default_profile"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 flex items-center gap-2 hover:scale-[1.01]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Crawling Facebook (Slow Scan)...
            </>
          ) : (
            'Start Discovery Scraper'
          )}
        </button>
      </form>
    </div>
  );
}
