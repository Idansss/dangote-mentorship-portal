import { PrismaClient } from '@prisma/client';

// Single PrismaClient across hot-reloads in dev (CLAUDE.md §3: data layer behind
// a thin module so the Postgres provider stays swappable).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
