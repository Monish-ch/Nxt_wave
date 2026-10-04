"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  ClipboardList,
  Gift,
  Loader2,
  MapPin,
  PartyPopper,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { BRANCHES, SOURCE_OPTIONS, SOURCE_STYLES, SourceKey, sourceLabel } from "@/lib/constants"
import { registrationSchema, flattenZodErrors, RegistrationInput } from "@/lib/validation"
import { SHARE_VARIANT_MAP, ShareVariantKey } from "@/lib/share-variants"
import { PublicStats } from "@/lib/stats"
import { DemoBadge } from "@/components/site/demo-badge"
import { cn } from "@/lib/utils"

type FieldErrors = Partial<Record<keyof RegistrationInput | "form", string>>

interface CollegeSuggestion {
  college: string
  count: number
}

interface Props {
  stats: PublicStats
  refCode: string
  initialSource?: SourceKey
  initialSourceCode?: string | null
  referrer: { fullName: string; firstName: string; college: string | null; referralCode: string } | null
  shareVariant?: ShareVariantKey | null
}

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030]

export function RegistrationForm({ stats, refCode, initialSource, initialSourceCode, referrer, shareVariant }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  // Source resolution: URL params win, then referral, else blank.
  const resolvedSource: SourceKey | undefined = useMemo(() => {
    if (initialSource) return initialSource
    if (refCode) return "referral"
    return undefined
  }, [initialSource, refCode])

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    college: "",
    branch: "",
    graduationYear: "",
    source: resolvedSource ?? "",
  })

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }))
  }

  // ------------------------- College typeahead -------------------------
  // Canonical spellings from the DB keep the college standings accurate.
  const [collegeIndex, setCollegeIndex] = useState<CollegeSuggestion[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const collegeWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/colleges", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { colleges: [] }))
      .then((d) => {
        if (!cancelled) setCollegeIndex(d.colleges ?? [])
      })
      .catch(() => {
        // Typeahead is an enhancement — the free-text field works without it.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const collegeMatches = useMemo<CollegeSuggestion[]>(() => {
    const q = form.college.trim().toLowerCase()
    if (!q) return collegeIndex.slice(0, 5)
    return collegeIndex
      .filter((c) => c.college.toLowerCase().includes(q) && c.college.toLowerCase() !== q)
      .slice(0, 5)
  }, [form.college, collegeIndex])

  const openSuggestions = collegeMatches.length > 0 && suggestionsOpen

  function pickCollege(c: CollegeSuggestion) {
    set("college", c.college)
    setSuggestionsOpen(false)
    setHighlighted(-1)
  }

  function onCollegeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openSuggestions) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlighted((h) => (h + 1) % collegeMatches.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) => (h <= 0 ? collegeMatches.length - 1 : h - 1))
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault()
      pickCollege(collegeMatches[highlighted])
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false)
      setHighlighted(-1)
    }
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!collegeWrapRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const filledPct = Math.min(stats.percentFilled, 100)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    // Client-side validation (server re-validates authoritatively).
    const candidate = {
      ...form,
      fullName: form.fullName,
      graduationYear: form.graduationYear ? Number(form.graduationYear) : NaN,
      source: form.source,
      sourceCode: initialSourceCode ?? undefined,
      refCode: refCode || undefined,
      shareVariant: shareVariant ?? undefined,
    }
    const parsed = registrationSchema.safeParse(candidate)
    if (!parsed.success) {
      const fieldErrors = flattenZodErrors(parsed.error) as FieldErrors
      setErrors(fieldErrors)
      toast.error("Please fix the highlighted fields.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      })
      const data = await res.json()

      if (res.status === 201 && data.ok) {
        toast.success("You're registered! 🎉", { description: "Setting up your referral dashboard…" })
        router.push(`/success?ref=${encodeURIComponent(data.registration.referralCode)}`)
        return
      }

      if (res.status === 409) {
        setErrors({
          email:
            data.code === "DUPLICATE_EMAIL"
              ? "This email is already registered. Use your referral dashboard instead."
              : undefined,
        })
        if (data.referralCode) {
          toast.error("You're already registered!", {
            description: "Opening your referral dashboard…",
            duration: 6000,
          })
          setTimeout(() => router.push(`/success?ref=${encodeURIComponent(data.referralCode)}`), 1600)
        } else {
          toast.error(data.error ?? "This email is already registered.")
        }
        return
      }

      if (data.fields) setErrors(data.fields as FieldErrors)
      toast.error(data.error ?? "Registration failed. Please try again.")
    } catch {
      toast.error("Network error — check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const err = (key: keyof RegistrationInput) => errors[key] as string | undefined

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        {/* ------------------------------- Form column ------------------------------- */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Reserve your free spot
            </h1>
            <DemoBadge />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
            30 seconds. No payment. Instant confirmation — plus your personal referral link to
            unlock rewards.
          </p>

          {/* Referral invite banner */}
          {refCode && referrer && (
            <div
              className="mt-6 flex items-start gap-3 rounded-xl border border-fuchsia-400/25 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 p-4"
              role="status"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white">
                {referrer.firstName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  <PartyPopper className="mr-1 inline size-4 text-fuchsia-500" aria-hidden />
                  {referrer.firstName} invited you to join!
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  You&apos;re registering with referral code{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-300 ring-1 ring-violet-400/25">
                    {refCode}
                  </code>
                  {referrer.college ? ` · ${referrer.college}` : ""} — it counts toward their rewards
                  automatically.
                </p>
                {shareVariant && (
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300 ring-1 ring-fuchsia-400/25">
                    {SHARE_VARIANT_MAP[shareVariant].emoji} {SHARE_VARIANT_MAP[shareVariant].label} invite
                    — your spot is locked with {referrer.firstName}&apos;s link
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Invalid referral warning */}
          {refCode && !referrer && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-4" role="alert">
              <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-amber-400" aria-hidden />
              <p className="text-sm text-amber-200">
                The referral link you followed looks invalid. You can still register — or ask your
                friend for their correct link.
              </p>
            </div>
          )}

          {/* Campaign source chip */}
          {initialSource && initialSource !== "referral" && (
            <div className="mt-6">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  SOURCE_STYLES[initialSource],
                )}
              >
                <BadgeCheck className="size-3.5" aria-hidden />
                Tracking: {sourceLabel(initialSource)}
                {initialSourceCode ? ` · ${initialSourceCode}` : ""}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName" error={err("fullName")} required>
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="e.g. Monisha Reddy"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  aria-invalid={!!err("fullName")}
                  aria-describedby={err("fullName") ? "fullName-error" : undefined}
                  className="h-11"
                />
              </Field>

              <Field label="Email" htmlFor="email" error={err("email")} required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@college.ac.in"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  aria-invalid={!!err("email")}
                  aria-describedby={err("email") ? "email-error" : undefined}
                  className="h-11"
                />
              </Field>

              <Field label="WhatsApp number" htmlFor="whatsapp" error={err("whatsapp")} required hint="Workshop link sent here">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. 9876543210"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value.replace(/[^0-9+]/g, ""))}
                  aria-invalid={!!err("whatsapp")}
                  aria-describedby={err("whatsapp") ? "whatsapp-error" : undefined}
                  className="h-11"
                />
              </Field>

              <Field label="College" htmlFor="college" error={err("college")} required hint="Pick a match or type your own">
                <div ref={collegeWrapRef} className="relative">
                  <Input
                    id="college"
                    name="college"
                    autoComplete="organization"
                    placeholder="e.g. CBIT Hyderabad"
                    value={form.college}
                    onChange={(e) => {
                      set("college", e.target.value)
                      setSuggestionsOpen(true)
                      setHighlighted(-1)
                    }}
                    onFocus={() => setSuggestionsOpen(true)}
                    onKeyDown={onCollegeKeyDown}
                    role="combobox"
                    aria-expanded={openSuggestions}
                    aria-controls="college-suggestions"
                    aria-autocomplete="list"
                    aria-invalid={!!err("college")}
                    aria-describedby={err("college") ? "college-error" : undefined}
                    className="h-11"
                  />
                  {openSuggestions && (
                    <ul
                      id="college-suggestions"
                      role="listbox"
                      aria-label="College suggestions"
                      className="animate-swap-in absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-popover py-1 shadow-xl shadow-black/40"
                    >
                      {collegeMatches.map((c, i) => (
                        <li key={c.college} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === highlighted}
                            id={`college-suggestion-${i}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickCollege(c)}
                            onMouseEnter={() => setHighlighted(i)}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                              i === highlighted ? "bg-violet-500/15" : "bg-transparent hover:bg-violet-500/15",
                            )}
                          >
                            <Building2
                              className={cn("size-4 shrink-0", i === highlighted ? "text-violet-300" : "text-slate-500")}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{c.college}</span>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ring-1",
                                c.count >= 20
                                  ? "bg-amber-500/10 text-amber-300 ring-amber-400/25"
                                  : "bg-white/[0.06] text-slate-400 ring-white/10",
                              )}
                            >
                              <Users className="size-2.5" aria-hidden />
                              {c.count}
                            </span>
                          </button>
                        </li>
                      ))}
                      <li role="none" className="border-t border-white/10 px-3 py-1.5">
                        <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <MapPin className="size-3" aria-hidden />
                          Pick a match so your campus gets credit on the college board — or keep typing for your own.
                        </p>
                      </li>
                    </ul>
                  )}
                </div>
              </Field>

              <Field label="Branch" htmlFor="branch" error={err("branch")} required>
                <Select value={form.branch} onValueChange={(v) => set("branch", v)}>
                  <SelectTrigger
                    id="branch"
                    aria-invalid={!!err("branch")}
                    aria-describedby={err("branch") ? "branch-error" : undefined}
                    className="h-11 w-full"
                  >
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Graduation year" htmlFor="graduationYear" error={err("graduationYear")} required>
                <Select value={form.graduationYear} onValueChange={(v) => set("graduationYear", v)}>
                  <SelectTrigger
                    id="graduationYear"
                    aria-invalid={!!err("graduationYear")}
                    aria-describedby={err("graduationYear") ? "graduationYear-error" : undefined}
                    className="h-11 w-full"
                  >
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAD_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field
              label="How did you hear about us?"
              htmlFor="source"
              error={err("source")}
              required
              hint={resolvedSource ? "Pre-filled from the link you used" : undefined}
            >
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger
                  id="source"
                  aria-invalid={!!err("source")}
                  aria-describedby={err("source") ? "source-error" : undefined}
                  className="h-11 w-full"
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {errors.form && (
              <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
                <AlertCircle className="size-4" aria-hidden /> {errors.form}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-12 w-full rounded-xl text-base shadow-lg shadow-violet-600/25 sm:min-w-56 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Reserving your spot…
                  </>
                ) : (
                  <>
                    Reserve My Free Spot
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </Button>
              <p className="text-xs leading-relaxed text-slate-400">
                By registering you agree to receive workshop updates on email & WhatsApp.
                <span className="block">100% free. No spam. Unsubscribe anytime.</span>
              </p>
            </div>
          </form>
        </div>

        {/* ------------------------------- Side rail ------------------------------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Registration summary">
          <div className="rounded-2xl border border-violet-400/25 bg-white/[0.04] p-6 shadow-lg shadow-violet-600/20">
            <p className="text-sm font-semibold text-white">
              <CalendarCheck className="mr-1.5 inline size-4 text-violet-400" aria-hidden />
              Live seat tracker
            </p>
            <Progress value={filledPct} className="mt-4 h-2.5" aria-label={`${filledPct}% of target filled`} />
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <span className="tabular-nums">
                <span className="font-bold text-violet-300">{stats.totalRegistrations}</span> / {stats.target} registered
              </span>
              <span className="tabular-nums">{stats.seatsLeft} left</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.06] p-3 text-center">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Today</dt>
                <dd className="text-lg font-bold tabular-nums text-emerald-400">+{stats.todayCount}</dd>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-3 text-center">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Referrals</dt>
                <dd className="text-lg font-bold tabular-nums text-amber-400">{stats.referralSharePercent}%</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <p className="text-sm font-semibold text-white">
              <ClipboardList className="mr-1.5 inline size-4 text-violet-400" aria-hidden />
              What happens after you register
            </p>
            <ol className="mt-4 space-y-3.5 text-sm text-slate-400">
              <li className="flex gap-2.5">
                <span className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300">1</span>
                <span>
                  You&apos;ll get a unique referral code like{" "}
                  <code className="font-mono text-xs font-bold text-violet-300">NXW-YOURNAME42</code>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300">2</span>
                Share it on WhatsApp — friends who register count toward milestones
              </li>
              <li className="flex gap-2.5">
                <span className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300">3</span>
                Unlock rewards at 1, 3, 5 and 10 referrals
              </li>
              <li className="flex gap-2.5">
                <span className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300">4</span>
                Workshop join link lands on your email & WhatsApp
              </li>
            </ol>
            <Link
              href="/#refer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300"
            >
              <Gift className="size-4" aria-hidden />
              See all milestone rewards
            </Link>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/25">
            <Users className="size-4.5 shrink-0" aria-hidden />
            <p>
              Every friend you bring is tracked automatically — your dashboard updates the moment
              they register.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Accessible form field wrapper
// ---------------------------------------------------------------------------
function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-100">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          )}
        </Label>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}
