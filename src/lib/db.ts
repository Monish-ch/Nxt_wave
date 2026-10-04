import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

/**
 * Zero-config demo database for serverless platforms (e.g. Vercel).
 *
 * Serverless filesystems are read-only except /tmp, and the demo ships a
 * pre-seeded SQLite file (`db/custom.db`, included via outputFileTracing).
 * When no DATABASE_URL is configured, the bundled demo database is copied
 * to /tmp on first boot so the whole app — landing, registration, referral,
 * admin console — works out of the box in demo mode.
 *
 * For production: set DATABASE_URL to PostgreSQL/Supabase (see README) and
 * this fallback never triggers.
 */
if (!process.env.DATABASE_URL) {
  const demoTarget = '/tmp/nxtwave-demo.db'
  try {
    if (!fs.existsSync(demoTarget)) {
      const bundled = path.join(process.cwd(), 'db', 'custom.db')
      if (fs.existsSync(bundled)) {
        fs.copyFileSync(bundled, demoTarget)
      }
    }
  } catch {
    // Intentionally silent: Prisma surfaces a clear connection error if the
    // demo file could not be materialised.
  }
  process.env.DATABASE_URL = `file:${demoTarget}`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
