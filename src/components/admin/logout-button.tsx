"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      disabled={loading}
      className="gap-1.5 text-muted-foreground"
      aria-label="Log out of admin console"
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
      <span className="hidden sm:inline">Logout</span>
    </Button>
  )
}
