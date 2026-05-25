import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

// Auto-boot background scheduler in Node.js server environment
if (typeof window === 'undefined') {
  import('./scheduler').then(({ startScheduler }) => {
    startScheduler();
  }).catch((err) => {
    console.error('[DB] Failed to auto-start background scheduler:', err);
  });
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Attempt a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message || String(err) };
  }
}
