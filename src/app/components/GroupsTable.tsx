'use client';

import { useTransition, useState } from 'react';
import { deleteGroupAction, joinGroupAutomationAction, updateGroupStatusAction } from '@/app/actions/groups';
import { Trash2, Loader2, ExternalLink, ShieldCheck, ShieldAlert, UserPlus, UserCheck, UserMinus, PenSquare, ArrowUpDown, ArrowUp, ArrowDown, Flame, Activity, Clock, Sparkles } from 'lucide-react';
import CreatePostForm from './CreatePostForm';
import CampaignPostModal from './CampaignPostModal';

interface Group {
  id: string;
  name: string;
  url: string;
  membersCount: number;
  dailyPosts: number;
  allowsPages: boolean;
  status: string;
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
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);

  const joinedGroups = groups.filter((g) => g.status === 'JOINED');

  const handleSelectAll = () => {
    if (selectedIds.length === joinedGroups.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(joinedGroups.map((g) => g.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'JOINED' ? 'NOT_JOINED' : 'JOINED';
    setActiveId(id);
    startTransition(async () => {
      const result = await updateGroupStatusAction(id, nextStatus);
      if (result?.error) {
        alert(result.error);
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
            <th className="p-4 w-12 text-center select-none">
              <input
                type="checkbox"
                checked={joinedGroups.length > 0 && selectedIds.length === joinedGroups.length}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-gray-800 bg-gray-950 text-indigo-600 focus:ring-indigo-500 transition-colors cursor-pointer"
                title="Select all joined groups"
              />
            </th>
            {renderHeader('Group Name & URL', 'name')}
            {renderHeader('Members', 'membersCount')}
            {renderHeader('Daily Posts', 'dailyPosts')}
            {renderHeader('Allows Pages', 'allowsPages')}
            {renderHeader('Status', 'status')}
            {renderHeader('Notes', 'notes')}
            <th className="p-4 text-right select-none">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-900">
          {sortedGroups.map((group) => (
            <tr key={group.id} className="hover:bg-gray-900/20 transition-colors">
              <td className="p-4 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(group.id)}
                  disabled={group.status !== 'JOINED'}
                  onChange={() => handleSelectRow(group.id)}
                  className="h-4 w-4 rounded border-gray-800 bg-gray-950 text-indigo-600 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title={group.status === 'JOINED' ? 'Select for campaign' : 'Must join group to post'}
                />
              </td>
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
                  group.status === 'JOINED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : group.status === 'JOIN_PENDING'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : group.status === 'BLACKLISTED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {group.status === 'JOINED'
                    ? 'Joined'
                    : group.status === 'JOIN_PENDING'
                    ? 'Pending Approval'
                    : group.status === 'BLACKLISTED'
                    ? 'Blacklisted'
                    : 'Not Joined'}
                </span>
              </td>
              <td className="p-4 text-gray-400 text-xs max-w-[200px]" title={group.notes || ''}>
                {group.notes ? (
                  (() => {
                    const match = group.notes.match(/(.*)\(Screenshot: ([^\)]+)\)/);
                    if (match) {
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate block max-w-[180px]">{match[1].trim()}</span>
                          <a
                            href={match[2]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-[10px] inline-flex items-center gap-0.5"
                          >
                            View Screenshot
                          </a>
                        </div>
                      );
                    }
                    return <span className="truncate block max-w-[180px]">{group.notes}</span>;
                  })()
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {(group.status === 'NOT_JOINED' || group.status === 'ACTIVE') && (
                    <>
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
                      <button
                        onClick={() => handleStatusToggle(group.id, group.status)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                        title="Manually Mark as Joined"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {group.status === 'JOINED' && (
                    <>
                      <button
                        onClick={() => openPostModal(group.id, group.name)}
                        disabled={isPending}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                        title="Write Page Post"
                      >
                        <PenSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusToggle(group.id, group.status)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                        title="Manually Mark as Not Joined"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </>
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

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 border border-gray-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-8 z-40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-2 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Campaign Ready</div>
              <div className="text-[11px] text-gray-400 font-sans mt-0.5">
                Selected <span className="text-indigo-400 font-semibold">{selectedIds.length} groups</span> for staggered posting.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCampaignOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/15"
            >
              <Clock className="h-3.5 w-3.5" /> Staggered Post
            </button>
          </div>
        </div>
      )}

      {/* Write Post Modal */}
      <CreatePostForm
        groupId={postGroupId}
        groupName={postGroupName}
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        facebookPageName={facebookPageName}
      />

      {/* Campaign Post Modal */}
      {isCampaignOpen && (
        <CampaignPostModal
          selectedGroups={groups
            .filter((g) => selectedIds.includes(g.id))
            .map((g) => ({ id: g.id, name: g.name }))}
          isOpen={isCampaignOpen}
          onClose={() => setIsCampaignOpen(false)}
          facebookPageName={facebookPageName}
          onSuccess={() => {
            setSelectedIds([]);
            setIsCampaignOpen(false);
          }}
        />
      )}
    </div>
  );
}
