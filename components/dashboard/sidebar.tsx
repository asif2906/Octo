"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Compass,
  Bot,
  Zap,
  Mail,
  FileText,
  Sparkles,
  FileEdit,
  BellRing,
  User,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OctoLogo } from "@/components/octo-logo"
import { PLAN_DEFINITIONS, type UsageSummary } from "@/lib/plans"

interface SidebarProps {
  usage: UsageSummary
  mobileOpen: boolean
  onCloseMobile: () => void
}

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

  // Expandable state for Automation & Resume
  const isAutomationRoute = pathname.startsWith("/dashboard/automation")
  const isResumeRoute =
    pathname.startsWith("/dashboard/resumes") ||
    pathname.startsWith("/dashboard/cover-letters")

  const [automationOpen, setAutomationOpen] = React.useState(true)
  const [resumeOpen, setResumeOpen] = React.useState(true)

  React.useEffect(() => {
    if (isAutomationRoute) setAutomationOpen(true)
  }, [isAutomationRoute])

  React.useEffect(() => {
    if (isResumeRoute) setResumeOpen(true)
  }, [isResumeRoute])

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
            {/* 1. Overview */}
            <Link
              href="/dashboard"
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard", true)
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutDashboard className="size-4 shrink-0" />
              <span>Overview</span>
            </Link>

            {/* 2. Job Discovery */}
            <Link
              href="/dashboard/jobs"
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard/jobs")
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Compass className="size-4 shrink-0" />
              <span>Job Discovery</span>
            </Link>

            {/* 3. Automation (Expandable Parent) */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setAutomationOpen(!automationOpen)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isAutomationRoute
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Bot className="size-4 shrink-0 text-primary" />
                  <span>Automation</span>
                </div>
                {automationOpen ? (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                )}
              </button>

              {automationOpen && (
                <div className="ml-4 space-y-1 border-l border-border/60 pl-2">
                  <Link
                    href="/dashboard/automation/auto-apply"
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive("/dashboard/automation/auto-apply")
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Zap className="size-3.5 shrink-0" />
                    <span>Auto Apply</span>
                  </Link>

                  <Link
                    href="/dashboard/automation/cold-approach"
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive("/dashboard/automation/cold-approach")
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span>Cold Approach</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Resume (Expandable Parent) */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setResumeOpen(!resumeOpen)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isResumeRoute
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span>Resume</span>
                </div>
                {resumeOpen ? (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                )}
              </button>

              {resumeOpen && (
                <div className="ml-4 space-y-1 border-l border-border/60 pl-2">
                  <Link
                    href="/dashboard/resumes/tailor"
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive("/dashboard/resumes/tailor")
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Sparkles className="size-3.5 shrink-0" />
                    <span>Tailor</span>
                  </Link>

                  <Link
                    href="/dashboard/cover-letters"
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive("/dashboard/cover-letters")
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FileEdit className="size-3.5 shrink-0" />
                    <span>Cover Letter</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 5. Follow-up */}
            <Link
              href="/dashboard/follow-ups"
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard/follow-ups")
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <BellRing className="size-4 shrink-0" />
              <span>Follow-up</span>
            </Link>
          </div>
        </div>

        {/* Account / Utility Section */}
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Account
          </p>
          <div className="mt-2 space-y-1">
            <Link
              href="/dashboard/profile"
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard/profile")
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <User className="size-4 shrink-0" />
              <span>Career Profile</span>
            </Link>

            <Link
              href="/dashboard/subscription"
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard/subscription")
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <CreditCard className="size-4 shrink-0" />
              <span>Subscription</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard/settings")
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="size-4 shrink-0" />
              <span>Settings</span>
            </Link>
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
            Manage plan & limits →
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
