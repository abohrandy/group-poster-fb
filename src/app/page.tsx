import Link from 'next/link';
import { checkDatabaseConnection } from '@/lib/db';
import { Database, Shield, Globe, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { getSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { connected, error } = await checkDatabaseConnection();
  const token = await getSessionToken();
  const isLoggedIn = !!token;

  return (
    <div className="flex-1 flex flex-col bg-[#050508] text-gray-100 font-sans relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <header className="border-b border-gray-800/60 backdrop-blur-md bg-[#050508]/75 sticky top-0 z-50 px-6 py-4 flex items-center justify-between w-full">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight">SocialDiscovery</span>
              <span className="text-xs text-indigo-400 font-medium block">Facebook Automation</span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/50 text-xs">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
              <span className="text-gray-400 font-medium">{connected ? 'DB Connected' : 'DB Offline'}</span>
            </div>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-500/10"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-gray-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
                >
                  <LogIn className="h-4 w-4" /> Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-gray-700"
                >
                  <UserPlus className="h-4 w-4" /> Create Account
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-6 py-16 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          🚀 Next-Gen Group Scraping & Automation
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight text-white">
          Locate, Track & Orchestrate
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-500 block mt-2">
            Facebook Groups Effortlessly
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          An isolated, modern, and high-performance framework powered by Playwright and PostgreSQL. Set your criteria, let the bots extract the communities, and drive traffic intelligently.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-300 shadow-xl shadow-indigo-500/20 hover:scale-[1.02]"
          >
            Launch Console <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors border border-gray-800"
          >
            Get Started
          </Link>
        </div>

        {/* Database Warning Block */}
        {!connected && (
          <div className="w-full max-w-3xl mb-12 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-left text-sm flex gap-3 items-start backdrop-blur-md">
            <span className="h-5 w-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold shrink-0 mt-0.5">!</span>
            <div>
              <h4 className="font-semibold text-rose-300">Database Connection Warning</h4>
              <p className="text-rose-400/80 mt-1">
                The application could not establish a connection to your PostgreSQL database. Verify that your <code className="bg-rose-950/40 px-1 py-0.5 rounded text-rose-300 font-mono">DATABASE_URL</code> in <code className="bg-rose-950/40 px-1 py-0.5 rounded text-rose-300 font-mono">.env</code> is configured correctly.
              </p>
              {error && (
                <details className="mt-2 text-xs text-rose-400/60 cursor-pointer">
                  <summary className="hover:text-rose-400">View Connection Error Details</summary>
                  <pre className="mt-2 p-2 bg-rose-950/30 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">{error}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-4">
          <div className="p-6 rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-sm hover:border-gray-700/80 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">Discovery Heuristics</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Find target Facebook groups by scraping adjacent members, recommended suggestions, and deep search keywords automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-sm hover:border-gray-700/80 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 border border-violet-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">Isolated Playwright Workers</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Scraping occurs on isolated runner threads that mimic real-browser interactions, preventing primary platform outages.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-sm hover:border-gray-700/80 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">Prisma / PostgreSQL</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Robust data modeling and transactional queues to execute runs, record membership lists, and capture profile session cookie payloads.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-950 bg-gray-950/40 text-center py-8 text-gray-500 text-xs mt-16 z-10">
        &copy; {new Date().getFullYear()} SocialDiscovery System. Built with Next.js 15, Tailwind, Prisma and PostgreSQL. All rights reserved.
      </footer>
    </div>
  );
}
