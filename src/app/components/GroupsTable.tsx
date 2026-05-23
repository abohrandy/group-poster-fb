'use client';

import { useTransition, useState } from 'react';
import { deleteGroupAction, joinGroupAutomationAction } from '@/app/actions/groups';
import { Trash2, Loader2, ExternalLink, ShieldCheck, ShieldAlert, UserPlus, PenSquare, ArrowUpDown, ArrowUp, ArrowDown, Flame, Activity } from 'lucide-react';
import CreatePostForm from './CreatePostForm';

interface Group {
  id: string;
  name: string;
  url: string;
  membersCount: number;
  dailyPosts: number;
  areaCouncil: string | null;
  allowsPages: boolean;
  status: string;
  category: string | null;
  notes: string | null;
  createdAt: Date;
}

interface GroupsTableProps {
  groups: Group[];
  facebookPageName?: string;
}

export default function GroupsTable({ groups, facebookPageName }: GroupsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Post modal states
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [postGroupId, setPostGroupId] = useState('');
  const [postGroupName, setPostGroupName] = useState('');

  // Sort states
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedGroups = [...groups].sort((a, b) => {
    if (!sortKey) return 0;
    
    let aVal = a[sortKey as keyof Group];
    let bVal = b[sortKey as keyof Group];
    
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return sortDirection === 'asc'
        ? (aVal ? 1 : 0) - (bVal ? 1 : 0)
        : (bVal ? 1 : 0) - (aVal ? 1 : 0);
    }
    
    return 0;
  });

  const renderSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-gray-500 opacity-40 hover:opacity-100 transition-opacity shrink-0" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-indigo-400 shrink-0" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-indigo-400 shrink-0" />
    );
  };

  const renderHeader = (label: string, key: string) => {
    return (
      <th className="p-4 select-none">
        <button
          type="button"
          onClick={() => handleSort(key)}
          className="flex items-center gap-0.5 hover:text-white transition-colors uppercase font-semibold text-xs tracking-wider outline-none focus:outline-none"
        >
          {label}
          {renderSortIcon(key)}
        </button>
      </th>
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this group? This will permanently delete its tracking metrics.')) {
      setActiveId(id);
      startTransition(async () => {
        const result = await deleteGroupAction(id);
        if (result?.error) {
          alert(result.error);
        }
        setActiveId(null);
      });
    }
  };

  const handleJoin = (id: string) => {
    setActiveId(id);
    startTransition(async () => {
      const result = await joinGroupAutomationAction(id);
      if (result?.error) {
        alert(result.error);
      } else if (result?.success) {
        alert(result.success);
      }
      setActiveId(null);
    });
  };

  const openPostModal = (id: string, name: string) => {
    setPostGroupId(id);
    setPostGroupName(name);
    setIsPostOpen(true);
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-950/10">
        <p className="text-gray-500 text-sm">No Facebook groups matching your filter criteria were found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/20 backdrop-blur-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-800/80 bg-gray-900/30 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {renderHeader('Group Name & URL', 'name')}
            {renderHeader('Category', 'category')}
            {renderHeader('Members', 'membersCount')}
            {renderHeader('Daily Posts', 'dailyPosts')}
            {renderHeader('Location', 'areaCouncil')}
            {renderHeader('Allows Pages', 'allowsPages')}
            {renderHeader('Status', 'status')}
            {renderHeader('Notes', 'notes')}
            <th className="p-4 text-right select-none">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-900">
          {sortedGroups.map((group) => (
            <tr key={group.id} className="hover:bg-gray-900/20 transition-colors">
              <td className="p-4">
                <div className="font-bold text-white max-w-[200px] truncate">{group.name}</div>
                <a
                  href={group.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 mt-0.5"
                >
                  Visit Group <ExternalLink className="h-3 w-3" />
                </a>
              </td>
              <td className="p-4">
                {group.category ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-800/60 text-gray-300 text-[10px] font-medium border border-gray-700/60">
                    {group.category}
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">—</span>
                )}
              </td>
              <td className="p-4 font-mono font-medium text-gray-200">
                {new Intl.NumberFormat().format(group.membersCount)}
              </td>
              <td className="p-4">
                {group.dailyPosts > 0 ? (
                  <span className={`inline-flex items-center gap-1.5 font-mono font-medium text-sm ${
                    group.dailyPosts >= 10
                      ? 'text-orange-400'
                      : group.dailyPosts >= 3
                      ? 'text-amber-400'
                      : 'text-gray-400'
                  }`}>
                    {group.dailyPosts >= 10 ? (
                      <Flame className="h-3.5 w-3.5 shrink-0" />
                    ) : group.dailyPosts >= 3 ? (
                      <Activity className="h-3.5 w-3.5 shrink-0" />
                    ) : null}
                    {group.dailyPosts}/day
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">—</span>
                )}
              </td>
              <td className="p-4 text-gray-300">
                {group.areaCouncil || <span className="text-gray-600">—</span>}
              </td>
              <td className="p-4">
                {group.allowsPages ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                    <ShieldCheck className="h-4 w-4 shrink-0" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0" /> No
                  </span>
                )}
              </td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase inline-block border ${
                  group.status === 'ACTIVE'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : group.status === 'JOINED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : group.status === 'JOIN_PENDING'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : group.status === 'BLACKLISTED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                }`}>
                  {group.status}
                </span>
              </td>
              <td className="p-4 text-gray-400 text-xs max-w-[150px] truncate" title={group.notes || ''}>
                {group.notes || <span className="text-gray-600">—</span>}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {group.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleJoin(group.id)}
                      disabled={isPending}
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                      title="Automate Group Join"
                    >
                      {isPending && activeId === group.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  {group.status === 'JOINED' && (
                    <button
                      onClick={() => openPostModal(group.id, group.name)}
                      disabled={isPending}
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                      title="Write Page Post"
                    >
                      <PenSquare className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(group.id)}
                    disabled={isPending}
                    className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                    title="Delete Group"
                  >
                    {isPending && activeId === group.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Write Post Modal */}
      <CreatePostForm
        groupId={postGroupId}
        groupName={postGroupName}
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        facebookPageName={facebookPageName}
      />
    </div>
  );
}
