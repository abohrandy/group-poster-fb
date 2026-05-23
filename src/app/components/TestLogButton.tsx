'use client';

import { useTransition, useState } from 'react';
import { createTestLogAction } from '@/app/actions/logs';
import { Play, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TestLogButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success?: string; error?: string } | null>(null);

  const handleTestWrite = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await createTestLogAction();
      setStatus(result);
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleTestWrite}
        disabled={isPending}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-600/10"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Writing Log Entry...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-white" /> Trigger DB Write Test
          </>
        )}
      </button>

      {status?.success && (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{status.success}</span>
        </div>
      )}

      {status?.error && (
        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{status.error}</span>
        </div>
      )}
    </div>
  );
}
