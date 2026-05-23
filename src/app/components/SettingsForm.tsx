'use client';

import { useActionState, useState, useRef } from 'react';
import { updateSettingsAction, authenticateFacebookAction, uploadFacebookCookiesAction } from '@/app/actions/settings';
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
  Info,
  Upload,
  FileJson,
  Key
} from 'lucide-react';

interface SettingsFormProps {
  initialName: string | null;
  initialFacebookPageName: string;
  email: string;
  hasFacebookSession: boolean;
}

const initialSettingsState: { error?: string; success?: string } = {};
const initialAuthState: { error?: string; success?: string } = {};
const initialUploadState: { error?: string; success?: string } = {};

export default function SettingsForm({ initialName, initialFacebookPageName, email, hasFacebookSession }: SettingsFormProps) {
  const [settingsState, settingsFormAction, settingsPending] = useActionState(updateSettingsAction, initialSettingsState);
  const [authState, authFormAction, authPending] = useActionState(authenticateFacebookAction, initialAuthState);
  const [uploadState, uploadFormAction, uploadPending] = useActionState(uploadFacebookCookiesAction, initialUploadState);

  // Toggle between automated login and manual upload
  const [authMode, setAuthMode] = useState<'CREDENTIALS' | 'UPLOAD'>('CREDENTIALS');
  const [pastedJson, setPastedJson] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPastedJson(content);
    };
    reader.readAsText(file);
  };

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

          {/* Facebook Page Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Facebook Page Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Globe className="h-4 w-4 text-violet-400" />
              </span>
              <input
                type="text"
                name="facebookPageName"
                defaultValue={initialFacebookPageName}
                placeholder="e.g. Mayor's Page"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              The exact name of the Facebook Page you want the bot to interact and post as inside groups.
            </p>
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

        {/* Tab Controls */}
        <div className="flex border-b border-gray-900">
          <button
            onClick={() => setAuthMode('CREDENTIALS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              authMode === 'CREDENTIALS'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Automated Login
          </button>
          <button
            onClick={() => setAuthMode('UPLOAD')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              authMode === 'UPLOAD'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Cookie JSON
          </button>
        </div>

        {authMode === 'CREDENTIALS' ? (
          /* Sub-panel A: Automated credentials login */
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex gap-3 items-start">
              <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-300/80 leading-relaxed">
                <span className="font-semibold text-indigo-300 block mb-1">Stealth Session Authentication</span>
                This form launches a headless browser on the Railway server, inputs the credentials, bypasses browser detection, and saves your cookies payload.
                <span className="block mt-2 font-medium text-indigo-200">
                  If this times out due to Facebook security validations, use the "Upload Cookie JSON" tab to log in headed locally on your computer and upload the session file.
                </span>
              </div>
            </div>

            <form action={authFormAction} className="space-y-4">
              {authState?.error && (
                <div className="flex flex-col gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-medium break-all">{authState.error}</span>
                  </div>
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
        ) : (
          /* Sub-panel B: Manual Cookie JSON File Upload */
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex gap-3 items-start">
              <Upload className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-300/80 leading-relaxed">
                <span className="font-semibold text-indigo-300 block mb-1">Headed Local Login Bypass</span>
                1. Open a local terminal in the project directory: `c:\Work\SHRC\Faecbook App - Copy`.
                <br />
                2. Run `node scripts/login-local.js` to open a headed browser, log in manually, and save the session.
                <br />
                3. Select the generated `automation/cookies/default_profile.json` file below to upload and activate it.
              </div>
            </div>

            <form action={uploadFormAction} className="space-y-4">
              {uploadState?.error && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{uploadState.error}</span>
                </div>
              )}

              {uploadState?.success && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadState.success}</span>
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
              </div>

              {/* File Upload Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Session Cookie File (.json)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 hover:border-indigo-500/50 rounded-lg text-sm text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer border-dashed"
                >
                  <FileJson className="h-4 w-4 text-indigo-400" />
                  {fileName ? `Selected: ${fileName}` : 'Choose cookies JSON file...'}
                </button>
              </div>

              {/* Hidden text area to submit JSON text */}
              <input type="hidden" name="cookiesJson" value={pastedJson} />

              {/* Text Area JSON visual preview */}
              {pastedJson && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">JSON Content Preview</label>
                  <div className="w-full h-24 p-3 bg-gray-950/80 border border-gray-900 rounded-lg text-[10px] font-mono text-gray-400 overflow-y-auto select-none">
                    {pastedJson.substring(0, 1000)}...
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadPending || !pastedJson}
                className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploadPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading Session...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload Cookies
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
