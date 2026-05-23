'use client';

import { useActionState } from 'react';
import { updateSettingsAction, authenticateFacebookAction } from '@/app/actions/settings';
import { 
  User, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  Mail, 
  Fingerprint,
  Info
} from 'lucide-react';

interface SettingsFormProps {
  initialName: string | null;
  email: string;
  hasFacebookSession: boolean;
}

const initialSettingsState: { error?: string; success?: string } = {};
const initialAuthState: { error?: string; success?: string } = {};

export default function SettingsForm({ initialName, email, hasFacebookSession }: SettingsFormProps) {
  const [settingsState, settingsFormAction, settingsPending] = useActionState(updateSettingsAction, initialSettingsState);
  const [authState, authFormAction, authPending] = useActionState(authenticateFacebookAction, initialAuthState);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      {/* Panel 1: Operator Account Settings */}
      <div className="bg-gray-950/20 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            Operator Profile Settings
          </h3>
          <p className="text-gray-400 text-sm mt-1">Manage your console operator account credentials and name</p>
        </div>

        <form action={settingsFormAction} className="space-y-6">
          {settingsState?.error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{settingsState.error}</span>
            </div>
          )}

          {settingsState?.success && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{settingsState.success}</span>
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

          {/* Password Reset Section */}
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
            disabled={settingsPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
          >
            {settingsPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* Panel 2: Facebook Profile Authentication Manager */}
      <div className="bg-gray-950/20 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-violet-400" />
              Facebook Browser Profiles
            </h3>
            <p className="text-gray-400 text-sm mt-1">Authenticate crawler agents and update Playwright browser cookies</p>
          </div>

          {/* Cookie Status Badge */}
          {hasFacebookSession ? (
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-full border border-rose-500/20 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" />
              Missing
            </span>
          )}
        </div>

        {/* Warning instructions info block */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex gap-3 items-start">
          <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-300/80 leading-relaxed">
            <span className="font-semibold text-indigo-300 block mb-1">Stealth Session Authentication</span>
            This form launches a headless, fully-stealthed Playwright browser on the server, inputs the credentials, bypasses browser detection, and saves your cookies payload to disk. 
            <span className="block mt-2 font-medium text-indigo-200">
              Note: If Facebook displays a 2FA checkpoint or mobile device authorization gate, please approve the login prompt immediately on your phone when starting.
            </span>
          </div>
        </div>

        <form action={authFormAction} className="space-y-4">
          {authState?.error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{authState.error}</span>
            </div>
          )}

          {authState?.success && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{authState.success}</span>
            </div>
          )}

          {/* Profile Selector ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Scraper Profile Identifier</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Fingerprint className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="profileId"
                defaultValue="default_profile"
                placeholder="default_profile"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Keep as default_profile to sync with group crawler queries</p>
          </div>

          {/* Facebook Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Facebook Account Email / Phone</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="fbEmail"
                required
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
          </div>

          {/* Facebook Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Facebook Account Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                name="fbPassword"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authPending}
            className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {authPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Running Playwright Auth...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" /> Authenticate Profile
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
