"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Filter,
  FileText,
  Bookmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ApplicationRow, InterviewRow, SavedJobRow } from "@/types/database"

interface DossierDashboardProps {
  applications: ApplicationRow[]
  interviews: InterviewRow[]
  savedJobs: SavedJobRow[]
  candidateName: string
}

export function DossierDashboard({
  applications,
  interviews,
  savedJobs,
  candidateName,
}: DossierDashboardProps) {
  const [funnelFilter, setFunnelFilter] = React.useState<"30" | "90" | "all">("all")
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(new Date())

  // Filter applications by timeframe
  const filteredApps = React.useMemo(() => {
    if (funnelFilter === "all") return applications
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - parseInt(funnelFilter, 10))
    return applications.filter((app) => new Date(app.created_at) >= cutoff)
  }, [applications, funnelFilter])

  // Funnel counts
  const total = filteredApps.length
  const drafts = filteredApps.filter((a) => a.status === "draft").length
  const applied = filteredApps.filter((a) => a.status === "applied" || a.status === "no_reply").length
  const assessments = filteredApps.filter((a) => a.status === "assessment").length
  const inInterview = filteredApps.filter((a) => a.status === "interview").length
  const offers = filteredApps.filter((a) => a.status === "offer" || a.status === "hired").length
  const rejections = filteredApps.filter((a) => a.status === "rejected").length

  // Attention Items
  const attentionDrafts = applications.filter((a) => a.status === "draft").slice(0, 3)
  const upcomingInterviews = interviews
    .filter((i) => !i.completed && new Date(i.interview_date) >= new Date())
    .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
    .slice(0, 4)

  // Calendar month days calculation
  const calendarDays = React.useMemo(() => {
    const year = currentCalendarMonth.getFullYear()
    const month = currentCalendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: Array<{ dayNumber: number | null; hasEvent: boolean; dateStr: string }> = []
    // Leading empty days
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, hasEvent: false, dateStr: "" })
    }
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const hasEvent = interviews.some((i) => i.interview_date.startsWith(dateStr))
      days.push({ dayNumber: d, hasEvent, dateStr })
    }
    return days
  }, [currentCalendarMonth, interviews])

  // Weekly Application Activity (last 6 weeks)
  const weeklyStats = React.useMemo(() => {
    const weeks: Array<{ label: string; count: number }> = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7 + 6))
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - i * 7)

      const count = applications.filter((a) => {
        const d = new Date(a.created_at)
        return d >= weekStart && d <= weekEnd
      }).length

      weeks.push({
        label: i === 0 ? "This Wk" : `W-${i}`,
        count,
      })
    }
    return weeks
  }, [applications])

  const maxWeeklyCount = Math.max(...weeklyStats.map((w) => w.count), 4)

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {candidateName.split(" ")[0] || "Candidate"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your pipeline funnel, interview calendar, and high-priority action items.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/jobs">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Briefcase className="h-4 w-4" /> Find Jobs
            </Button>
          </Link>
          <Link href="/dashboard/applications">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Application Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Application Funnel Cards with Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
              Application Funnel
            </h2>
          </div>
          <div className="flex items-center rounded-lg border border-border/70 bg-muted/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => setFunnelFilter("30")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                funnelFilter === "30" ? "bg-background text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setFunnelFilter("90")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                funnelFilter === "90" ? "bg-background text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              90 Days
            </button>
            <button
              type="button"
              onClick={() => setFunnelFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                funnelFilter === "all" ? "bg-background text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold font-mono text-foreground">{total}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">In Pipeline</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-zinc-400">Drafts</p>
            <p className="mt-1 text-2xl font-bold font-mono text-zinc-300">{drafts}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">To Review</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-blue-400">Applied</p>
            <p className="mt-1 text-2xl font-bold font-mono text-blue-300">{applied}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Submitted</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-amber-400">Assessment</p>
            <p className="mt-1 text-2xl font-bold font-mono text-amber-300">{assessments}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Take-home / OA</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-purple-400">Interviews</p>
            <p className="mt-1 text-2xl font-bold font-mono text-purple-300">{inInterview}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Active Rounds</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-emerald-400">Offers</p>
            <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{offers}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Accepted / Hired</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <p className="text-xs font-medium text-rose-400">Rejected</p>
            <p className="mt-1 text-2xl font-bold font-mono text-rose-300">{rejections}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Closed</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left side (Weekly Activity + Attention) | Right side (Calendar + Interviews) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Application Activity Chart */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" /> Weekly Application Velocity
              </h3>
              <span className="text-xs text-muted-foreground">Last 6 Weeks</span>
            </div>

            <div className="flex items-end justify-between gap-4 h-36 pt-4 px-2">
              {weeklyStats.map((w, idx) => {
                const heightPct = Math.max((w.count / maxWeeklyCount) * 100, 8)
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono font-bold text-foreground">
                      {w.count}
                    </span>
                    <div
                      className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {w.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* What Needs Attention */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" /> What Needs Attention
              </h3>
              <span className="text-xs text-muted-foreground">
                {attentionDrafts.length + (savedJobs.length > 0 ? 1 : 0)} Action items
              </span>
            </div>

            <div className="space-y-3">
              {/* Drafts waiting for review */}
              {attentionDrafts.length > 0 ? (
                attentionDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Draft Application: {draft.job_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {draft.company} · Ready to review and apply
                      </p>
                    </div>
                    <Link href={`/dashboard/applications`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        Review <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : null}

              {/* Saved jobs not yet applied */}
              {savedJobs.length > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {savedJobs.length} Saved Opportunities Pending
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Convert your saved roles into tailored applications
                    </p>
                  </div>
                  <Link href="/dashboard/jobs">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      View Jobs <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}

              {attentionDrafts.length === 0 && savedJobs.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  Your pipeline is completely up to date! Discover new roles in Job Discovery.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Calendar Widget & Upcoming Interviews */}
        <div className="space-y-6">
          {/* Calendar Widget */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {currentCalendarMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentCalendarMonth(
                      new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1)
                    )
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentCalendarMonth(
                      new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1)
                    )
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`h-8 flex flex-col items-center justify-center rounded-md relative ${
                    d.dayNumber ? "hover:bg-muted/40 cursor-default" : ""
                  }`}
                >
                  {d.dayNumber && (
                    <span className="font-mono text-xs text-foreground/80">{d.dayNumber}</span>
                  )}
                  {d.hasEvent && (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-purple-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-400" /> Upcoming Interviews
              </h4>
              <Link href="/dashboard/interviews" className="text-[11px] text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingInterviews.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No upcoming interviews scheduled.
                </p>
              ) : (
                upcomingInterviews.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{item.company}</p>
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                        {item.round_type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.position}</p>
                    <p className="text-[10px] text-purple-400 font-mono">
                      {new Date(item.interview_date).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
