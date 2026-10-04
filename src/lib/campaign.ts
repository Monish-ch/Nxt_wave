import { CAMPAIGN_DURATION_DAYS } from "./constants"

// ---------------------------------------------------------------------------
// Campaign window helpers. The campaign defaults to a rolling 7-day window
// ending today (so the demo always looks "live"). Set CAMPAIGN_START_DATE
// (ISO date) to pin real campaign dates in production.
// ---------------------------------------------------------------------------

export interface CampaignWindow {
  start: Date
  end: Date
  currentDay: number // 1-based
  totalDays: number
  campaignOver: boolean
}

export function getCampaignWindow(now: Date = new Date()): CampaignWindow {
  const pinned = process.env.CAMPAIGN_START_DATE
  let start: Date

  if (pinned) {
    start = new Date(`${pinned}T00:00:00`)
  } else {
    start = new Date(now)
    start.setDate(start.getDate() - (CAMPAIGN_DURATION_DAYS - 1))
    start.setHours(0, 0, 0, 0)
  }

  const end = new Date(start)
  end.setDate(end.getDate() + CAMPAIGN_DURATION_DAYS)
  end.setHours(23, 59, 59, 999)

  const msPerDay = 24 * 60 * 60 * 1000
  const dayIndex = Math.floor((now.getTime() - start.getTime()) / msPerDay)
  const currentDay = Math.min(Math.max(dayIndex + 1, 1), CAMPAIGN_DURATION_DAYS)

  return {
    start,
    end,
    currentDay,
    totalDays: CAMPAIGN_DURATION_DAYS,
    campaignOver: now > end,
  }
}

/** Returns the campaign days as an array of day-start Dates (local midnight). */
export function getCampaignDays(window: CampaignWindow): Date[] {
  const days: Date[] = []
  for (let i = 0; i < window.totalDays; i++) {
    const d = new Date(window.start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}
