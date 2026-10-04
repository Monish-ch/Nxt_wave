"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, MailSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

/**
 * Recover a referral dashboard by email — for students who registered
 * earlier and lost their /success?ref= link.
 */
export function FindDashboardForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (!email.trim() || !email.includes("@")) {
      setError("Enter the email you registered with.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (res.ok && data.ok) {
        toast.success("Welcome back!", { description: `Found your dashboard, ${data.firstName}.` })
        router.push(`/success?ref=${encodeURIComponent(data.referralCode)}`)
        return
      }
      setError(data.error ?? "Couldn't find that email.")
    } catch {
      setError("Network error — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={compact ? "space-y-2.5" : "space-y-3"}>
      <label htmlFor="lookup-email" className="sr-only">
        Email used at registration
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Input
          id="lookup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@college.ac.in"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "lookup-email-error" : undefined}
          className="h-11 flex-1"
        />
        <Button type="submit" disabled={loading} className="h-11 rounded-lg px-5 shadow-md shadow-violet-600/20">
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              <MailSearch className="size-4" aria-hidden />
              Find it
            </>
          )}
        </Button>
      </div>
      {error && (
        <p id="lookup-email-error" className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      {!error && !loading && (
        <p className="text-[11px] text-slate-500">
          We&apos;ll match the email you registered with and take you straight to your referral link.{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="font-semibold text-violet-300 hover:text-violet-200"
          >
            Haven&apos;t registered yet?
          </button>
        </p>
      )}
    </form>
  )
}
