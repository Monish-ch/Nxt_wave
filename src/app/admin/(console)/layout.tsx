import type { Metadata } from "next"
import Link from "next/link"
import { LayoutDashboard, Table2 } from "lucide-react"
import { Logo } from "@/components/site/logo"
import { DemoBadge } from "@/components/site/demo-badge"
import { AdminLogoutButton } from "@/components/admin/logout-button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Growth Console",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-light flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo href="/admin" />
            <nav aria-label="Admin" className="hidden items-center gap-1 sm:flex">
              <AdminNavLink href="/admin" icon={<LayoutDashboard className="size-4" />}>
                Dashboard
              </AdminNavLink>
              <AdminNavLink href="/admin/registrations" icon={<Table2 className="size-4" />}>
                Registrations
              </AdminNavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            <DemoBadge />
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <nav aria-label="Admin mobile" className="border-b border-slate-200 bg-white sm:hidden">
        <div className="flex">
          <AdminNavLink href="/admin" icon={<LayoutDashboard className="size-4" />}>
            Dashboard
          </AdminNavLink>
          <AdminNavLink href="/admin/registrations" icon={<Table2 className="size-4" />}>
            Registrations
          </AdminNavLink>
        </div>
      </nav>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1.5 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>NxtWave Growth Console — internal tooling for the 500-registration challenge.</p>
          <p>Protected by session auth · Demo dataset</p>
        </div>
      </footer>
    </div>
  )
}

function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:rounded-md",
        "flex-1 justify-center py-3 sm:flex-none sm:justify-start sm:py-2",
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
