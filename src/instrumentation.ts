let isRunning = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !isRunning) {
    isRunning = true;
    const { startCron } = await import('./lib/cron');
    startCron();
  }
}
