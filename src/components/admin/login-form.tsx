"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") ?? "/admin"

  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (!password.trim()) {
      setError("Please enter the admin password.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (res.ok && data.ok) {
        toast.success("Welcome back 👋", { description: "Opening the growth console…" })
        router.push(nextPath.startsWith("/admin") ? nextPath : "/admin")
        router.refresh()
        return
      }
      setError(data.error ?? "Login failed.")
    } catch {
      setError("Network error — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="admin-password" className="text-slate-300">
          Admin password
        </Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "admin-password-error" : undefined}
            className="h-11 border-slate-700 bg-slate-800/60 pr-11 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/40"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        {error && (
          <p id="admin-password-error" className="text-xs font-medium text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-violet-600/25">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Signing in…
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden /> Enter Growth Console
          </>
        )}
      </Button>
    </form>
  )
}
