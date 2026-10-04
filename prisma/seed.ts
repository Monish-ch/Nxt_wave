// Seed script: populates the demo dataset. Run with `bun prisma/seed.ts`.
import { seedDemoData } from "../src/lib/demo/seed"

async function main() {
  console.log("Seeding demo dataset...")
  const result = await seedDemoData()
  console.log(`Seeded ${result.registrations} registrations and ${result.referrals} referral records.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const { db } = await import("../src/lib/db")
    await db.$disconnect()
  })
