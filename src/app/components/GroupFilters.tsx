'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface GroupFiltersProps {
  categories: string[];
  statuses: string[];
}

export default function GroupFilters({ categories, statuses }: GroupFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.push(`/dashboard/groups?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-gray-950/20 border border-gray-800 p-4 rounded-xl backdrop-blur-sm">
      {/* Search Input */}
      <div className="flex-1 min-w-[240px] relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search groups by name or URL..."
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="relative min-w-[150px]">
        <select
          defaultValue={searchParams.get('category') || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-gray-950/50 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="relative min-w-[150px]">
        <select
          defaultValue={searchParams.get('status') || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-gray-950/50 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Allows Pages Filter */}
      <div className="relative min-w-[150px]">
        <select
          defaultValue={searchParams.get('allowsPages') || ''}
          onChange={(e) => handleFilterChange('allowsPages', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-gray-950/50 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm cursor-pointer"
        >
          <option value="">Allows Pages: Any</option>
          <option value="true">Allows Pages: Yes</option>
          <option value="false">Allows Pages: No</option>
        </select>
      </div>

      {/* Loading Indicator */}
      {isPending && (
        <div className="text-indigo-400 flex items-center gap-1.5 text-xs font-medium animate-pulse ml-auto">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Filtering...
        </div>
      )}
    </div>
  );
}
