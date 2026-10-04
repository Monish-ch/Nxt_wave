// ---------------------------------------------------------------------------
// Demo dataset generator — deterministic (seeded) realistic seed data.
// ~330 registrations over a 7-day campaign window ending today:
//  - accelerating daily growth curve
//  - multiple colleges (Telangana/AP engineering college flavor)
//  - multiple acquisition sources
//  - a referral network with a few "super referrers"
// ---------------------------------------------------------------------------

import { buildReferralCode } from "@/lib/referral"

// --- Seeded PRNG (mulberry32) ------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- Data pools ---------------------------------------------------------------

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Priya", "Karthik", "Sneha", "Arjun", "Divya",
  "Varun", "Meghana", "Rahul", "Bhavana", "Siddharth", "Keerthi", "Manish",
  "Sravani", "Nikhil", "Harika", "Pranav", "Sirisha", "Aditya", "Chandana",
  "Vineel", "Anusha", "Kalyan", "Lahari", "Srikar", "Nandini", "Ravi Teja",
  "Spandana", "Harshavardhan", "Amulya", "Sandeep", "Vaishnavi", "Naveen",
  "Swapna", "Pavan", "Jyothi", "Tarun", "Bhargavi", "Krishna", "Sahithi",
  "Vishnu", "Ramya", "Akhil", "Tanvi", "Sathwik", "Pravalika", "Ganesh",
  "Manasa", "Yaswanth", "Swathi", "Charan", "Hima Bindu", "Rohith", "Navya",
  "Ajay", "Deepika", "Shiva Kumar", "Monisha", "Abhinav", "Supriya",
  "Dheeraj", "Poojitha", "Mahesh", "Aishwarya", "Goutham", "Sanjana",
]

const LAST_NAMES = [
  "Reddy", "Rao", "Sharma", "Goud", "Naidu", "Kumar", "Verma", "Chowdary",
  "Yadav", "Kulkarni", "Prasad", "Gupta", "Singh", "Patel", "Deshmukh",
  "Rathod", "Mehta", "Joshi", "Das", "Banoth", "Ellappa", "Sunkari",
  "Mekala", "Thota", "Bandi", "Kolla", "Puli", "Gaddam", "Vemula", "Kandula",
]

interface CollegeSpec {
  name: string
  domain: string
  weight: number
}

const COLLEGES: CollegeSpec[] = [
  { name: "Chaitanya Bharathi Institute of Technology (CBIT)", domain: "cbit.ac.in", weight: 10 },
  { name: "Vasavi College of Engineering", domain: "vasavi.ac.in", weight: 8 },
  { name: "Sreenidhi Institute of Science & Technology", domain: "snist.edu.in", weight: 8 },
  { name: "VNR VJIET", domain: "vnrvjiet.in", weight: 8 },
  { name: "Keshav Memorial Institute of Technology (KMIT)", domain: "kmit.in", weight: 7 },
  { name: "Anurag University", domain: "anurag.edu.in", weight: 7 },
  { name: "Gokaraju Rangaraju Institute of Engineering & Technology", domain: "griet.ac.in", weight: 7 },
  { name: "JNTU Hyderabad", domain: "jntuh.ac.in", weight: 6 },
  { name: "MVSR Engineering College", domain: "mvsrec.edu.in", weight: 6 },
  { name: "CMR College of Engineering & Technology", domain: "cmrcet.ac.in", weight: 6 },
  { name: "CVR College of Engineering", domain: "cvr.ac.in", weight: 5 },
  { name: "Vardhaman College of Engineering", domain: "vardhaman.org", weight: 5 },
  { name: "Osmania University College of Engineering", domain: "uceou.edu", weight: 5 },
  { name: "RGUKT Basar", domain: "rgukt.ac.in", weight: 4 },
  { name: "Sri Indu College of Engineering & Technology", domain: "sriindu.ac.in", weight: 4 },
  { name: "Muffakham Jah College of Engineering & Technology", domain: "mjcollege.ac.in", weight: 3 },
]

const BRANCH_DIST: Array<[string, number]> = [
  ["CSE", 34], ["AI & ML", 16], ["IT", 13], ["ECE", 14], ["EEE", 8],
  ["Data Science", 7], ["Mechanical", 5], ["Civil", 2], ["Other", 1],
]

const GRAD_YEARS: Array<[number, number]> = [[2026, 88], [2027, 9], [2025, 3]]

// Daily registration counts for the 7-day campaign (accelerating curve).
const DAILY_COUNTS = [22, 31, 42, 48, 55, 63, 62]
// Share of each day's registrations that arrive via referral links (grows over time).
const DAILY_REFERRAL_SHARE = [0.08, 0.1, 0.12, 0.14, 0.17, 0.19, 0.21]

const SOURCE_DIST: Array<[string, number]> = [
  ["ambassador", 40], ["club", 25], ["whatsapp", 19], ["instagram", 11], ["other", 5],
]

const AMBASSADOR_CODES = ["RAHUL01", "PRIYA07", "KARTHIK12", "SNEHA04", "ARJUN09", "MEGHA15", "VARUN21"]
const CLUB_CODES = ["CSECLUB01", "ECECLUB02", "ITCLUB03", "AICLUB04", "GDSC05"]
const SOURCE_CODE_MAP: Record<string, string[]> = {
  ambassador: AMBASSADOR_CODES,
  club: CLUB_CODES,
  whatsapp: [],
  instagram: ["REELS60", "CAMPUSSTORY"],
  other: [],
}

// --- Output types -------------------------------------------------------------

export interface DemoRegistrationSeed {
  fullName: string
  email: string
  whatsapp: string
  college: string
  branch: string
  graduationYear: number
  source: string
  sourceCode: string | null
  shareVariant: string | null
  referralCode: string
  referredByCode: string | null
  createdAt: Date
}

export interface DemoDataset {
  registrations: DemoRegistrationSeed[]
  campaignSources: Array<{ name: string; code: string; type: string; ownerName: string | null }>
  milestones: Array<{ name: string; referralCount: number; rewardText: string }>
}

// --- Weighted pick helpers ------------------------------------------------------

function weightedPick<T>(rng: () => number, entries: Array<[T, number]>): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = rng() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[entries.length - 1][0]
}

function pickName(rng: () => number): { first: string; last: string } {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
  return { first, last }
}

function hourFor(rng: () => number): number {
  // Students register mostly in the evening; weighted hours 9:00–23:00.
  return weightedPick(rng, [
    [9, 4], [10, 5], [11, 6], [12, 5], [13, 4], [14, 4], [15, 5], [16, 6],
    [17, 8], [18, 12], [19, 14], [20, 13], [21, 10], [22, 6], [23, 2],
  ])
}

// --- Generator ------------------------------------------------------------------

export function generateDemoDataset(seed: number = 20250607): DemoDataset {
  const rng = mulberry32(seed)

  const usedEmails = new Set<string>()
  const usedCodes = new Set<string>()

  const uniqueEmail = (first: string, last: string, college: CollegeSpec): string => {
    for (let i = 0; i < 50; i++) {
      const n = Math.floor(rng() * 900) + 10
      const domain = rng() < 0.75 ? "gmail.com" : college.domain
      const email = `${first.toLowerCase().replace(/\s/g, "")}.${last.toLowerCase().replace(/\s/g, "")}${n}@${domain}`
      if (!usedEmails.has(email)) {
        usedEmails.add(email)
        return email
      }
    }
    const fallback = `student${Math.floor(rng() * 100000)}@gmail.com`
    usedEmails.add(fallback)
    return fallback
  }

  const uniqueCode = (fullName: string): string => {
    for (let i = 0; i < 50; i++) {
      const code = buildReferralCode(fullName, Math.floor(rng() * 90) + 10)
      if (!usedCodes.has(code)) {
        usedCodes.add(code)
        return code
      }
    }
    const code = `${buildReferralCode(fullName, 99)}${Math.floor(rng() * 9)}`
    usedCodes.add(code)
    return code
  }

  const registrations: DemoRegistrationSeed[] = []
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const campaignStart = new Date(todayStart)
  campaignStart.setDate(campaignStart.getDate() - 6) // 7-day window ending today

  // "Share power" per registration — a few early registrants share aggressively.
  const power: number[] = []
  const referralCodeOf: string[] = []

  const makeRegistration = (dayIndex: number): DemoRegistrationSeed => {
    const { first, last } = pickName(rng)
    const fullName = `${first} ${last}`
    const college = weightedPick(
      rng,
      COLLEGES.map((c) => [c, c.weight] as [CollegeSpec, number]),
    )
    const source = weightedPick(rng, SOURCE_DIST)
    const codePool = SOURCE_CODE_MAP[source] ?? []
    const sourceCode =
      codePool.length > 0 && rng() < 0.8 ? codePool[Math.floor(rng() * codePool.length)] : null

    const dayStart = new Date(campaignStart)
    dayStart.setDate(dayStart.getDate() + dayIndex)
    dayStart.setHours(hourFor(rng), Math.floor(rng() * 60), Math.floor(rng() * 60), 0)

    // The final campaign day is "today" — never generate timestamps in the future.
    if (dayStart.getTime() > now.getTime() - 60_000) {
      dayStart.setTime(now.getTime() - Math.floor(rng() * 5 + 1) * 60_000 * 12)
    }

    const whatsapp = `9${Math.floor(rng() * 10)}${String(Math.floor(rng() * 100000000)).padStart(8, "0")}`

    const reg: DemoRegistrationSeed = {
      fullName,
      email: uniqueEmail(first, last, college),
      whatsapp,
      college: college.name,
      branch: weightedPick(rng, BRANCH_DIST),
      graduationYear: weightedPick(rng, GRAD_YEARS),
      source,
      sourceCode,
      shareVariant: null,
      referralCode: uniqueCode(fullName),
      referredByCode: null,
      createdAt: dayStart,
    }
    return reg
  }

  let globalIndex = 0
  DAILY_COUNTS.forEach((count, dayIndex) => {
    const referralCount = Math.round(count * DAILY_REFERRAL_SHARE[dayIndex])
    const directCount = count - referralCount

    for (let i = 0; i < directCount; i++) {
      const reg = makeRegistration(dayIndex)
      registrations.push(reg)
      referralCodeOf.push(reg.referralCode)
      // Some channel owners run the invite-style A/B inside their own channel:
      // their tracking links carry ?v=, so direct signups land with a variant
      // tag. Powers the "invite style mix" cross-tab on channel boards.
      if (reg.sourceCode && rng() < 0.55) {
        reg.shareVariant = weightedPick(rng, [
          ["friendly", 34], ["achievement", 44], ["urgent", 22],
        ])
      }
      // Assign share power: a couple of hyper-active sharers, ~12% actives, rest passive.
      // Ambassador/club-attributed students skew active — they were recruited to share,
      // so their channel board shows a living funnel instead of a flat zero.
      const roll = rng()
      const recruited = reg.sourceCode !== null
      if (roll < 0.006) power.push(150)
      else if (roll < 0.126) power.push(5)
      else if (recruited && rng() < 0.45) power.push(4)
      else power.push(1)
      globalIndex++
    }

    for (let i = 0; i < referralCount; i++) {
      const reg = makeRegistration(dayIndex)
      // Pick a referrer among earlier registrations weighted by share power
      // (everyone is eligible; active sharers win more often).
      const eligible: Array<[number, number]> = []
      for (let j = 0; j < globalIndex; j++) {
        eligible.push([j, power[j] * (0.6 + rng())])
      }
      if (eligible.length > 0) {
        const refIndex = weightedPick(rng, eligible)
        reg.referredByCode = referralCodeOf[refIndex]
      }
      reg.source = "referral"
      reg.sourceCode = reg.referredByCode
      // A/B invite-message variant that landed this signup. Deliberately
      // non-uniform (achievement pulls ahead over time) so the admin A/B
      // board has a realistic story to tell.
      reg.shareVariant = weightedPick(rng, [
        ["friendly", 38], ["achievement", 42], ["urgent", 20],
      ])
      registrations.push(reg)
      referralCodeOf.push(reg.referralCode)
      power.push(1)
      globalIndex++
    }

    // Keep chronological order within a day (referral adds may precede directs).
    const dayCount = directCount + referralCount
    const daySlice = registrations.slice(registrations.length - dayCount)
    daySlice.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  })

  return {
    registrations,
    campaignSources: [
      // Channel-level rows (UTM-style source values).
      { name: "Campus Ambassador Program", code: "ambassador", type: "human", ownerName: "Growth Team" },
      { name: "College Club Partnerships", code: "club", type: "community", ownerName: "Outreach Team" },
      { name: "WhatsApp Community Groups", code: "whatsapp", type: "community", ownerName: "Growth Team" },
      { name: "Friend / Referral Program", code: "referral", type: "viral", ownerName: "Automated" },
      { name: "Instagram Reels & Stories", code: "instagram", type: "social", ownerName: "Marketing" },
      { name: "Other / Organic", code: "other", type: "other", ownerName: null },
      // Per-ambassador codes (offline posters, classroom pitches).
      { name: "Campus Ambassador · Rahul M.", code: "RAHUL01", type: "ambassador", ownerName: "Rahul M. (CBIT)" },
      { name: "Campus Ambassador · Priya S.", code: "PRIYA07", type: "ambassador", ownerName: "Priya S. (JNTU Hyderabad)" },
      { name: "Campus Ambassador · Karthik V.", code: "KARTHIK12", type: "ambassador", ownerName: "Karthik V. (Vasavi)" },
      { name: "Campus Ambassador · Sneha R.", code: "SNEHA04", type: "ambassador", ownerName: "Sneha R. (VNR VJIET)" },
      { name: "Campus Ambassador · Arjun T.", code: "ARJUN09", type: "ambassador", ownerName: "Arjun T. (Sreenidhi)" },
      { name: "Campus Ambassador · Megha K.", code: "MEGHA15", type: "ambassador", ownerName: "Megha K. (KMIT)" },
      { name: "Campus Ambassador · Varun D.", code: "VARUN21", type: "ambassador", ownerName: "Varun D. (CVR)" },
      // Club / community codes.
      { name: "CSE Department Club", code: "CSECLUB01", type: "club", ownerName: "CSE Club Committee" },
      { name: "ECE Department Club", code: "ECECLUB02", type: "club", ownerName: "ECE Club Committee" },
      { name: "IT Department Club", code: "ITCLUB03", type: "club", ownerName: "IT Club Committee" },
      { name: "AI/ML Student Chapter", code: "AICLUB04", type: "club", ownerName: "AI-ML Chapter Lead" },
      { name: "GDSC Campus Chapter", code: "GDSC05", type: "club", ownerName: "GDSC Organizers" },
      // Instagram campaign codes.
      { name: "Reels Campaign · 60s Build", code: "REELS60", type: "social", ownerName: "Marketing" },
      { name: "Campus Story Countdown", code: "CAMPUSSTORY", type: "social", ownerName: "Marketing" },
    ],
    milestones: [
      { name: "First Share", referralCount: 1, rewardText: "You're officially part of the growth squad. Welcome!" },
      { name: "Momentum", referralCount: 3, rewardText: "Bonus AI project resources unlocked." },
      { name: "Campus Influencer", referralCount: 5, rewardText: "Growth Contributor certificate + advanced AI toolkit unlocked." },
      { name: "Growth Champion", referralCount: 10, rewardText: "Internship fast-track spotlight + 1:1 mentorship session." },
    ],
  }
}
