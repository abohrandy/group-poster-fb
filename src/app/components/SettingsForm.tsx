'use client';

import { useActionState } from 'react';
import { updateSettingsAction } from '@/app/actions/settings';
import { User, Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SettingsFormProps {
  initialName: string | null;
  email: string;
}

const initialState: { error?: string; success?: string } = {};

export default function SettingsForm({ initialName, email }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);

  return (
    <div className="max-w-2xl bg-gray-950/20 border border-gray-800 rounded-xl p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Profile Settings</h3>
        <p className="text-gray-400 text-sm mt-1">Manage your console operator account credentials and name</p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{state.success}</span>
          </div>
        )}

        {/* Read-only Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2.5 rounded-lg border border-gray-800/80 bg-gray-950/30 text-gray-500 text-sm cursor-not-allowed"
          />
          <p className="text-[10px] text-gray-500 mt-1">Contact system admin to change email address</p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Display Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              name="name"
              defaultValue={initialName || ''}
              placeholder="e.g. John Doe"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
            />
          </div>
        </div>

        {/* Password Reset Divider */}
        <div className="border-t border-gray-900 pt-6">
          <h4 className="text-sm font-semibold text-white mb-4">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}
