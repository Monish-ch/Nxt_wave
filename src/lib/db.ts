import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

/**
 * Zero-config demo database for serverless platforms (e.g. Vercel).
 *
 * Serverless filesystems are read-only except /tmp, and the demo ships a
 * pre-seeded SQLite file (`db/custom.db`, included via outputFileTracing).
 * The fallback activates when:
 *  - no DATABASE_URL is configured at all, or
 *  - DATABASE_URL points at a `file:` path that does not exist in the
 *    deployment (e.g. a leaked local .env with an absolute sandbox path).
 *
 * In both cases the bundled seeded demo database is copied to /tmp so the
 * whole app — landing, registration, referral, admin console — works with
 * zero configuration in demo mode.
 *
 * For production: set DATABASE_URL to PostgreSQL/Supabase (see README); the
 * URL does not start with `file:` and this fallback never triggers.
 */
const existingUrl = process.env.DATABASE_URL
const fileTarget = existingUrl?.startsWith('file:') ? existingUrl.slice(5) : null
const fileUrlIsBroken =
  fileTarget !== null && fileTarget !== '' && !fs.existsSync(fileTarget)

if (!existingUrl || fileUrlIsBroken) {
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
