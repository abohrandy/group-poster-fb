import { validateSession } from '@/lib/auth';
import prisma, { checkDatabaseConnection } from '@/lib/db';
import TestLogButton from '@/app/components/TestLogButton';
import { Database, ShieldAlert, FileText, Bot, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = await validateSession();
  const user = session?.user;

  const { connected, error: dbError } = await checkDatabaseConnection();

  let logs: any[] = [];
  let logCount = 0;

  if (connected) {
    try {
      logs = await prisma.systemLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      logCount = await prisma.systemLog.count();
    } catch (err) {
      console.error("Failed to query database logs:", err);
    }
  } else {
    // Simulated fallback logs for offline mode
    logs = [
      {
        id: 'mock-1',
        action: 'SYSTEM_START',
        details: 'SocialDiscovery system initialized in offline/simulation mode.',
        createdAt: new Date(),
      },
      {
        id: 'mock-2',
        action: 'DB_CONNECTION_FAIL',
        details: 'Failed to connect to PostgreSQL. Please check your DATABASE_URL in .env.',
        createdAt: new Date(Date.now() - 5000),
      },
    ];
    logCount = 2;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Operator'}</h2>
          <p className="text-gray-400 text-sm mt-1">Configure and manage your automated group searches and scraper runners.</p>
        </div>
        <div className="text-xs text-gray-500 font-mono bg-gray-950/60 px-3 py-1.5 rounded-lg border border-gray-900">
          User ID: {user?.id}
        </div>
      </div>

      {/* Database Offline Warning */}
      {!connected && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex gap-3 items-start backdrop-blur-md">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-rose-300">PostgreSQL Offline (Simulation Mode)</h4>
            <p className="text-rose-400/80 mt-1">
              The database connection is currently unavailable. A simulated local environment is active so you can inspect the dashboard layout. Database write operations will fail.
            </p>
            {dbError && (
              <details className="mt-2 text-xs text-rose-400/60 cursor-pointer">
                <summary className="hover:text-rose-400">View Connection Error</summary>
                <pre className="mt-1 p-2 bg-rose-950/30 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">{dbError}</pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat 1 */}
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-950/20 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Discovered Groups</span>
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{connected ? '0' : 'Simulated: 42'}</span>
            <span className="text-xs text-gray-500 ml-1">groups total</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-950/20 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Scraper Bots</span>
            <Bot className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">0</span>
            <span className="text-xs text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium ml-2">Ready</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-950/20 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Logs</span>
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{logCount}</span>
            <span className="text-xs text-gray-500 ml-1">audit events</span>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Logs */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-gray-800 bg-gray-950/20 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Recent System Logs
            </h3>
            <span className="text-xs text-gray-500">Showing last 10 events</span>
          </div>

          <div className="divide-y divide-gray-900 border-t border-gray-900">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex justify-between gap-4 items-start text-xs">
                <div className="min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase inline-block mb-1.5 ${
                    log.action.includes('ERROR') || log.action.includes('FAIL') || log.action.includes('OFFLINE')
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {log.action}
                  </span>
                  <p className="text-gray-300 font-medium break-all">{log.details}</p>
                </div>
                <span className="text-gray-500 font-mono shrink-0 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Database Diagnostics */}
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-950/20 backdrop-blur-sm space-y-6">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-violet-400" />
            Database Diagnostics
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Verify that Next.js Server Actions can write new records to your PostgreSQL database.
          </p>

          <TestLogButton />
        </div>
      </div>
    </div>
  );
}
