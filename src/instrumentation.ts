export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server-side boot sequence...');
    const { startScheduler } = await import('@/lib/scheduler');
    startScheduler();
  }
}
