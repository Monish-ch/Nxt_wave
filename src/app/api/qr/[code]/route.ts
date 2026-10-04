import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { isValidReferralCodeFormat } from "@/lib/referral"

export const dynamic = "force-dynamic"

/**
 * GET /api/qr/[code]
 * Returns a branded SVG QR code that points at the referral landing page
 * `/r/<code>`. Pure server-side generation — no client JS needed, works
 * offline on campus posters / WhatsApp status images.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  if (!isValidReferralCodeFormat(code)) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const target = `${origin.replace(/\/$/, "")}/r/${encodeURIComponent(code.toUpperCase())}`

  const svg = await QRCode.toString(target, {
    type: "svg",
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#1e1044", light: "#ffffff" },
  })

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}
