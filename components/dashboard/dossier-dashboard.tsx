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
  LayoutGrid,
  List,
  Search,
  Building2,
  MapPin,
  ExternalLink,
  Plus,
  Compass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import type { ApplicationRow, ApplicationStatus, InterviewRow, SavedJobRow, ResumeRow } from "@/types/database"

interface DossierDashboardProps {
  applications: ApplicationRow[]
  interviews: InterviewRow[]
  savedJobs: SavedJobRow[]
  candidateName: string
  userId: string
  resumes?: Pick<ResumeRow, "id" | "title" | "is_primary">[]
}

const KANBAN_STAGES: Array<{ id: ApplicationStatus; label: string; color: string }> = [
  { id: "draft", label: "Draft", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  { id: "applied", label: "Applied", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "assessment", label: "Assessment", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "interview", label: "Interview", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "offer", label: "Offer", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "rejected", label: "Rejected", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
]

export function DossierDashboard({
  applications: initialApplications,
  interviews,
  savedJobs,
  candidateName,
  userId,
  resumes = [],
}: DossierDashboardProps) {
  const [applications, setApplications] = React.useState<ApplicationRow[]>(initialApplications)
  const [funnelFilter, setFunnelFilter] = React.useState<"30" | "90" | "all">("all")
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(new Date())

  // Applications Tracker state inside Overview
  const [viewMode, setViewMode] = React.useState<"board" | "table">("board")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [stageFilter, setStageFilter] = React.useState<string>("all")

  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

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
  const responseRate = total > 0 ? Math.round(((inInterview + offers) / total) * 100) : 0

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
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, hasEvent: false, dateStr: "" })
    }
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

  // Filtered applications for Tracker section
  const trackerApps = React.useMemo(() => {
    return applications.filter((app) => {
      if (stageFilter !== "all" && app.status !== stageFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        app.company.toLowerCase().includes(q) ||
        app.job_title.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q))
      )
    })
  }, [applications, stageFilter, searchQuery])

  async function handleMoveStage(appId: string, newStatus: ApplicationStatus) {
    const original = [...applications]
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    )

    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", appId)

    if (error) {
      setApplications(original)
      toast({ title: "Failed to update status", description: error.message, variant: "error" })
    } else {
      toast({
        title: "Stage Updated",
        description: `Application moved to ${newStatus}.`,
        variant: "success",
      })
    }
  }

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
              <Compass className="h-4 w-4" /> Discover Jobs
            </Button>
          </Link>
          <Link href="/dashboard/resumes/tailor">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Tailor Resume
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

      {/* Middle Grid: Weekly Activity + Attention | Calendar + Interviews */}
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
                    <Link href={`/dashboard/applications/${draft.id}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        Open Workspace <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : null}

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
                <div className="py-6 text-center text-xs text-muted-foreground">
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

            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

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

      {/* FULL APPLICATION MANAGEMENT WORKSPACE SECTION */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Application Tracking Pipeline
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your candidate pipeline across all stages. Click any application to open its tailored documents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "board"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Board view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Link href="/dashboard/jobs">
              <Button size="sm" className="gap-1.5 text-xs h-9">
                <Plus className="h-3.5 w-3.5" /> Start New Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role, or location..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 rounded-lg border border-border/80 bg-background px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-44"
          >
            <option value="all">All Stages ({applications.length})</option>
            <option value="draft">Drafts ({drafts})</option>
            <option value="applied">Applied ({applied})</option>
            <option value="assessment">Assessment ({assessments})</option>
            <option value="interview">Interview ({inInterview})</option>
            <option value="offer">Offer ({offers})</option>
            <option value="rejected">Rejected ({rejections})</option>
          </select>
        </div>

        {/* VIEW MODE: KANBAN BOARD */}
        {viewMode === "board" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
            {KANBAN_STAGES.map((col) => {
              const colApps = trackerApps.filter((app) => {
                if (col.id === "applied") return app.status === "applied" || app.status === "no_reply"
                if (col.id === "offer") return app.status === "offer" || app.status === "hired"
                return app.status === col.id
              })

              return (
                <div
                  key={col.id}
                  className="rounded-xl border border-border/70 bg-card/40 p-3 min-h-[420px] flex flex-col space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      {colApps.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {colApps.length === 0 ? (
                      <div className="h-24 flex items-center justify-center border border-dashed border-border/50 rounded-lg text-[11px] text-muted-foreground/60 italic">
                        Empty
                      </div>
                    ) : (
                      colApps.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-lg border border-border/80 bg-card p-3 shadow-xs hover:border-foreground/30 transition-all space-y-2 group"
                        >
                          <Link href={`/dashboard/applications/${app.id}`} className="block hover:opacity-90">
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                {app.job_title}
                              </p>
                              <ExternalLink className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{app.company}</span>
                            </p>
                            {app.location && (
                              <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{app.location}</span>
                              </p>
                            )}
                          </Link>

                          <div className="pt-1.5 flex items-center justify-between border-t border-border/40 text-[10px]">
                            <select
                              value={app.status === "no_reply" ? "applied" : app.status === "hired" ? "offer" : app.status}
                              onChange={(e) => handleMoveStage(app.id, e.target.value as ApplicationStatus)}
                              className="bg-muted/40 border border-border/60 rounded px-1.5 py-0.5 text-[10px] text-foreground font-medium"
                            >
                              <option value="draft">Draft</option>
                              <option value="applied">Applied</option>
                              <option value="assessment">Assessment</option>
                              <option value="interview">Interview</option>
                              <option value="offer">Offer</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            <Link
                              href={`/dashboard/applications/${app.id}`}
                              className="text-primary hover:underline font-medium text-[10px]"
                            >
                              Workspace →
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* VIEW MODE: TABLE VIEW */}
        {viewMode === "table" && (
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Company & Role</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Date Applied</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-foreground">
                  {trackerApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                        No applications found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    trackerApps.map((app) => (
                      <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/applications/${app.id}`} className="hover:underline">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {app.job_title}
                              <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
                            </div>
                            <div className="text-muted-foreground text-[11px]">{app.company}</div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={app.status === "no_reply" ? "applied" : app.status === "hired" ? "offer" : app.status}
                            onChange={(e) => handleMoveStage(app.id, e.target.value as ApplicationStatus)}
                            className="bg-muted/40 border border-border/60 rounded px-2 py-1 text-xs text-foreground font-medium capitalize"
                          >
                            <option value="draft">Draft</option>
                            <option value="applied">Applied</option>
                            <option value="assessment">Assessment</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {app.location || "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {app.application_date || new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/dashboard/applications/${app.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                              Open Workspace
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
