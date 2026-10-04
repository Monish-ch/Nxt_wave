import Link from "next/link"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Brand logo. `tone="dark"` is for dark backgrounds (e.g. the footer).
 */
export function Logo({
  className,
  href = "/",
  tone = "light",
}: {
  className?: string
  href?: string
  tone?: "light" | "dark"
}) {
  const dark = tone === "dark"
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 group", className)}
      aria-label="NxtWave Growth Engine home"
    >
      <span className="relative inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-600/25 transition-transform group-hover:scale-105">
        <Sparkles className="size-4.5" aria-hidden />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("whitespace-nowrap text-[15px] font-bold tracking-tight", dark ? "text-white" : "text-foreground")}>
          NxtWave <span className="font-semibold text-violet-500">Growth Engine</span>
        </span>
        <span className={cn("whitespace-nowrap text-[10.5px] font-medium uppercase tracking-[0.14em]", dark ? "text-slate-400" : "text-muted-foreground")}>
          AI Workshop · 500 Students
        </span>
      </span>
    </Link>
  )
}
