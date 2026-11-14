"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Mail,
  BellRing,
  User,
  CreditCard,
  Settings,
  X,
  Compass,
  Rocket,
  FileEdit,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OctoLogo } from "@/components/octo-logo"
import { PLAN_DEFINITIONS, type UsageSummary } from "@/lib/plans"

interface SidebarProps {
  usage: UsageSummary
  mobileOpen: boolean
  onCloseMobile: () => void
}

const WORKSPACE_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/jobs", label: "Job Discovery", icon: Compass },
  { href: "/dashboard/startups", label: "Startups", icon: Rocket },
  { href: "/dashboard/resumes", label: "My Resumes", icon: FileText },
  { href: "/dashboard/cover-letters", label: "Cover Letters", icon: FileEdit },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/interviews", label: "Interviews", icon: Calendar },
  { href: "/dashboard/outreach", label: "Cold Outreach", icon: Mail },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: BellRing },
]

const ACCOUNT_LINKS = [
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar({
  usage,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname()
  const planDef = PLAN_DEFINITIONS[usage.plan]
  const appsRemaining = Math.max(
    0,
    usage.applicationsDailyLimit - usage.applicationsUsedToday
  )

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const navContent = (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <OctoLogo href="/dashboard" />
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            {WORKSPACE_LINKS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Account
          </p>
          <div className="mt-2 space-y-1">
            {ACCOUNT_LINKS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border bg-muted/40 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">{planDef.name} Plan</span>
            <span className="text-muted-foreground">
              {appsRemaining}/{usage.applicationsDailyLimit} apps left
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {usage.aiTailoringEnabled
              ? `AI tailoring: ${usage.aiTailoringUsedToday}/${usage.aiTailoringDailyLimit} today`
              : "Upgrade to unlock AI tailoring"}
          </p>
          <Link
            href="/dashboard/subscription"
            onClick={onCloseMobile}
            className="mt-2.5 inline-flex text-xs font-medium text-primary hover:underline"
          >
            View plan limits →
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block print:hidden">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-background shadow-xl">
            {navContent}
          </aside>
        </div>
      ) : null}
    </>
  )
}

