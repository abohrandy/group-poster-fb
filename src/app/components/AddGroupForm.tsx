'use client';

import { useActionState, useState } from 'react';
import { createGroupAction } from '@/app/actions/groups';
import { Plus, X, Loader2, Link2, Users, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

const initialState = {
  error: '',
  success: '',
};

export default function AddGroupForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createGroupAction, initialState);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:scale-[1.01]"
      >
        <Plus className="h-4 w-4" /> Add Group Manually
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">Add Facebook Group</h3>
                <p className="text-gray-400 text-xs mt-1">Register a group manually for tracking and scraping</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="p-6 space-y-4">
              {state?.error && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              {state?.success && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{state.success}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-[11px]"
                  >
                    Close Modal
                  </button>
                </div>
              )}

              {/* Group Name & URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Group Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. London Tech Jobs"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Group URL *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Link2 className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      name="url"
                      required
                      placeholder="https://facebook.com/groups/..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="e.g. Technology, Real Estate"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    name="status"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  >
                    <option value="ACTIVE" className="bg-gray-900">Active</option>
                    <option value="ARCHIVED" className="bg-gray-900">Archived</option>
                    <option value="BLACKLISTED" className="bg-gray-900">Blacklisted</option>
                  </select>
                </div>
              </div>

              {/* Members Count & Area Council */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Member Count</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Users className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      name="membersCount"
                      placeholder="e.g. 1500"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Area Council / Location</label>
                  <input
                    type="text"
                    name="areaCouncil"
                    placeholder="e.g. Greater London"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Allows Pages Checkbox */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="allowsPages"
                  name="allowsPages"
                  value="true"
                  className="h-4 w-4 rounded border-gray-800 bg-gray-950/50 text-indigo-600 focus:ring-indigo-500/20"
                />
                <label htmlFor="allowsPages" className="text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none">
                  Allows Facebook Pages to Join/Post
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes / Description</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-gray-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Provide details about the group membership rules, proxy requirements, or scrapers targets..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 flex items-center gap-2 hover:scale-[1.01]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving Group...
                    </>
                  ) : (
                    'Add Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
