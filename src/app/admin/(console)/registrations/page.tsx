import { Suspense } from "react"
import { RegistrationsTable } from "@/components/admin/registrations-table"

export const dynamic = "force-dynamic"

export default function AdminRegistrationsPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationsTable />
    </Suspense>
  )
}
