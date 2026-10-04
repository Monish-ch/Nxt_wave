import { FlaskConical } from "lucide-react"
import { DEMO_MODE } from "@/lib/constants"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * "Demo Mode" pill — clearly labels the simulated dataset so demo data is
 * never confused with production data.
 */
export function DemoBadge({ className }: { className?: string }) {
  if (!DEMO_MODE) return null
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400",
              className,
            )}
            role="status"
          >
            <FlaskConical className="size-3" aria-hidden />
            Demo Mode
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-56 text-xs">
          Simulated campaign dataset for demonstration. All metrics are computed live from demo
          registrations — not hardcoded.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
