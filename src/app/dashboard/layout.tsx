import { redirect } from 'next/navigation';
import Link from 'next/link';
import { validateSession } from '@/lib/auth';
import { checkDatabaseConnection } from '@/lib/db';
import { logoutAction } from '@/app/actions/auth';
import { Globe, LayoutDashboard, Settings, LogOut, User, Database, Users, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateSession();
  if (!session) {
    redirect('/login');
  }

  const { connected } = await checkDatabaseConnection();
  const user = session.user;

  return (
    <div className="flex-1 flex bg-[#030305] text-gray-100 font-sans min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800/80 bg-gray-950/40 backdrop-blur-md flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Sidebar Header / Brand */}
          <div className="p-6 border-b border-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Globe className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">SocialDiscovery</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900/60 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" /> Overview
            </Link>
            <Link
              href="/dashboard/groups"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900/60 transition-colors"
            >
              <Users className="h-4 w-4" /> Groups
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900/60 transition-colors"
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900/60 transition-colors"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </nav>
        </div>

        {/* User Account / Sign Out */}
        <div className="p-4 border-t border-gray-900 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name || 'Dashboard User'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors border border-transparent hover:border-rose-500/10"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800/80 bg-gray-950/20 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-white">Discovery Console</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Database Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 bg-gray-900/40 text-xs">
              <Database className="h-3.5 w-3.5 text-gray-500" />
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
              <span className="text-gray-400 hidden sm:inline">{connected ? 'Database Connected' : 'Database Disconnected'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Views */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
