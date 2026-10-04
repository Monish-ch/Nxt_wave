import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export const dynamic = "force-dynamic"

/**
 * GET /api/qr/link?to=/register?source=ambassador&code=RAHUL01
 * QR code generator for arbitrary *relative* app paths (campaign posters).
 * Only same-origin paths are allowed — `to` must start with "/" and may not
 * be protocol-relative ("//host"), preventing off-site QR generation.
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") ?? ""

  if (!to.startsWith("/") || to.startsWith("//")) {
    return NextResponse.json(
      { error: "Only relative app paths are allowed (must start with a single '/')." },
      { status: 400 },
    )
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const target = `${origin.replace(/\/$/, "")}${to}`

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
      "Cache-Control": "no-store",
    },
  })
}
