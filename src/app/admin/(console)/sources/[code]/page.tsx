import type { Metadata } from "next"
import { SourceDetail } from "@/components/admin/source-detail"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Channel analytics · Growth Console",
  robots: { index: false, follow: false },
}

export default async function AdminSourceDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <SourceDetail code={code} />
}
