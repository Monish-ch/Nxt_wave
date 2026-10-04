import { NextRequest, NextResponse } from "next/server"
import { getReferralInfo } from "@/lib/referral-info"

export const dynamic = "force-dynamic"

/**
 * GET /api/referral/[code]
 * Public referral lookup: validates a referral code and returns the referrer's
 * display info + live referral stats (used by /r/[code] and /success).
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params
  const info = await getReferralInfo(code)

  if (!info.valid) {
    return NextResponse.json(
      { valid: false, error: "This referral link is invalid or expired.", reason: info.reason },
      { status: 404 },
    )
  }

  return NextResponse.json(info)
}
