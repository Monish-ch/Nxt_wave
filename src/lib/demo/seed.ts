import { db } from "@/lib/db"
import { generateDemoDataset } from "./generate"
import { v4 as uuidv4 } from "uuid"

/**
 * Wipes and reseeds demo data. Used by `prisma/seed.ts` and the admin
 * "Reset demo data" API. Never touches production data (guarded by demo mode).
 */
export async function seedDemoData() {
  const dataset = generateDemoDataset()

  // Wipe in FK-safe order.
  await db.digestLog.deleteMany()
  await db.nudge.deleteMany()
  await db.referral.deleteMany()
  await db.registration.deleteMany()
  await db.campaignSource.deleteMany()
  await db.milestone.deleteMany()

  await db.campaignSource.createMany({ data: dataset.campaignSources })
  await db.milestone.createMany({ data: dataset.milestones })

  // Pre-generate IDs so referral links can be built in one pass.
  const codeToId = new Map<string, string>()
  const rows = dataset.registrations.map((reg) => {
    const id = uuidv4()
    codeToId.set(reg.referralCode, id)
    return {
      id,
      fullName: reg.fullName,
      email: reg.email,
      whatsapp: reg.whatsapp,
      college: reg.college,
      branch: reg.branch,
      graduationYear: reg.graduationYear,
      source: reg.source,
      sourceCode: reg.sourceCode,
      shareVariant: reg.shareVariant,
      referralCode: reg.referralCode,
      referredById: null as string | null,
      createdAt: reg.createdAt,
    }
  })

  // Resolve referral links (referrers are always defined before their referrals).
  for (const row of rows) {
    const seedReg = dataset.registrations.find((r) => r.referralCode === row.referralCode)
    if (seedReg?.referredByCode) {
      row.referredById = codeToId.get(seedReg.referredByCode) ?? null
    }
  }

  // Batched inserts.
  for (let i = 0; i < rows.length; i += 100) {
    await db.registration.createMany({ data: rows.slice(i, i + 100) })
  }

  const referralsData = rows
    .filter((r) => r.referredById)
    .map((r) => ({
      referrerId: r.referredById!,
      referredId: r.id,
      referralCode: dataset.registrations.find((x) => x.referralCode === r.referralCode)!.referredByCode!,
      status: "completed",
      createdAt: r.createdAt,
    }))

  for (let i = 0; i < referralsData.length; i += 100) {
    await db.referral.createMany({ data: referralsData.slice(i, i + 100) })
  }

  return {
    registrations: rows.length,
    referrals: referralsData.length,
  }
}
