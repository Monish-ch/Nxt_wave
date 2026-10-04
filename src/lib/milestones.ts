// ---------------------------------------------------------------------------
// Milestone gamification logic — computed from live referral counts.
// ---------------------------------------------------------------------------

export interface MilestoneTier {
  name: string
  referralCount: number
  rewardText: string
}

export const MILESTONE_TIERS: MilestoneTier[] = [
  {
    name: "First Share",
    referralCount: 1,
    rewardText: "You're officially part of the growth squad. Welcome!",
  },
  {
    name: "Momentum",
    referralCount: 3,
    rewardText: "Bonus AI project resources unlocked.",
  },
  {
    name: "Campus Influencer",
    referralCount: 5,
    rewardText: "Growth Contributor certificate + advanced AI toolkit unlocked.",
  },
  {
    name: "Growth Champion",
    referralCount: 10,
    rewardText: "Internship fast-track spotlight + 1:1 mentorship session.",
  },
]

export interface MilestoneProgress {
  count: number
  nextMilestone: MilestoneTier | null
  nextMilestoneRemaining: number
  progressPercent: number // progress toward next milestone (0-100)
  unlocked: MilestoneTier[]
  highestUnlocked: MilestoneTier | null
}

export function getMilestoneProgress(count: number): MilestoneProgress {
  const unlocked = MILESTONE_TIERS.filter((m) => count >= m.referralCount)
  const nextMilestone = MILESTONE_TIERS.find((m) => count < m.referralCount) ?? null
  const previousThreshold = unlocked.length > 0 ? unlocked[unlocked.length - 1].referralCount : 0

  const progressPercent = nextMilestone
    ? Math.min(
        100,
        Math.round(((count - previousThreshold) / (nextMilestone.referralCount - previousThreshold)) * 100),
      )
    : 100

  return {
    count,
    nextMilestone,
    nextMilestoneRemaining: nextMilestone ? nextMilestone.referralCount - count : 0,
    progressPercent,
    unlocked,
    highestUnlocked: unlocked.length ? unlocked[unlocked.length - 1] : null,
  }
}
