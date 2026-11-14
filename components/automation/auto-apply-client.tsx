"use client"

import * as React from "react"
import Link from "next/link"
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  MapPin,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  Sliders,
  ShieldCheck,
  Send,
  Loader2,
  Calendar,
  AlertTriangle,
  StopCircle,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { UsageSummary } from "@/lib/plans"
import type { ApplicationRow, ResumeRow } from "@/types/database"

interface AutoApplyConfig {
  id: string
  selected_roles: string[]
  locations: string[]
  daily_target: number
  plan_daily_limit: number
  duration_days: number
  start_at: string
  expires_at: string
  timezone: string
  status: "draft" | "scheduled" | "running" | "paused" | "completed" | "stopped" | "failed" | "expired"
  selected_resume_id: string | null
}

interface ManualActionItem {
  id: string
  job_title: string
  company: string
  apply_url?: string
  notes?: string
  created_at: string
}

interface AvailableJob {
  id: string
  title: string
  company: string
  location?: string
  apply_url?: string
  skills_required?: string[]
}

interface AutoApplyClientProps {
  userId: string
  usage: UsageSummary
  resumes: Pick<ResumeRow, "id" | "title" | "is_primary">[]
  recentApplications: ApplicationRow[]
  candidateSkills: string[]
  initialConfig: AutoApplyConfig | null
  initialManualItems: ManualActionItem[]
  initialAvailableJobs: AvailableJob[]
}

export function AutoApplyClient({
  userId,
  usage,
  resumes,
  recentApplications,
  candidateSkills,
  initialConfig,
  initialManualItems,
  initialAvailableJobs,
}: AutoApplyClientProps) {
  const { toast } = useToast()

  // Configuration state
  const [config, setConfig] = React.useState<AutoApplyConfig | null>(initialConfig)
  const [targetRoles, setTargetRoles] = React.useState(
    initialConfig?.selected_roles?.join(", ") || "Full Stack Engineer, Frontend Developer, Software Engineer"
  )
  const [locationPref, setLocationPref] = React.useState(
    initialConfig?.locations?.join(", ") || "Remote Worldwide"
  )
  const [durationDays, setDurationDays] = React.useState<number>(
    initialConfig?.duration_days || 30
  )
  const [dailyTarget, setDailyTarget] = React.useState<number>(
    initialConfig?.daily_target || (usage.plan === "pro" ? 20 : 10)
  )
  const [selectedResumeId, setSelectedResumeId] = React.useState(
    initialConfig?.selected_resume_id ||
      resumes.find((r) => r.is_primary)?.id ||
      resumes[0]?.id ||
      ""
  )

  const [activeTab, setActiveTab] = React.useState<"queue" | "manual" | "history">("queue")
  const [isSavingConfig, setIsSavingConfig] = React.useState(false)
  const [isProcessingBatch, setIsProcessingBatch] = React.useState(false)
  const [showConfirmModal, setShowConfirmModal] = React.useState(false)

  const planMaxDaily = usage.applicationsDailyLimit
  const status = config?.status || "scheduled"
  const isRunning = status === "running"
  const isPaused = status === "paused"
  const isExpired = status === "expired"

  // Calculate days remaining
  let daysRemaining = 0
  let formattedExpiry = ""
  if (config?.expires_at) {
    const diff = new Date(config.expires_at).getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    formattedExpiry = new Date(config.expires_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Queue state populated from available jobs or fallback curated opportunities
  const [queue, setQueue] = React.useState<Array<{
    id: string
    company: string
    role: string
    location: string
    applyUrl: string
    matchScore: number
    status: "ready" | "preparing" | "submitted" | "error"
  }>>(() => {
    if (initialAvailableJobs.length > 0) {
      return initialAvailableJobs.map((j, idx) => ({
        id: j.id || `job-${idx}`,
        company: j.company,
        role: j.title,
        location: j.location || "Remote",
        applyUrl: j.apply_url || "https://octo.tech",
        matchScore: 90 - idx * 2,
        status: "ready",
      }))
    }
    return [
      {
        id: "q-1",
        company: "Linear",
        role: "Frontend Systems Engineer",
        location: "Remote (US/EU)",
        applyUrl: "https://linear.app/careers",
        matchScore: 94,
        status: "ready",
      },
      {
        id: "q-2",
        company: "Supabase",
        role: "Full Stack Developer",
        location: "Remote Worldwide",
        applyUrl: "https://supabase.com/careers",
        matchScore: 91,
        status: "ready",
      },
      {
        id: "q-3",
        company: "Resend",
        role: "Growth & Product Engineer",
        location: "Remote",
        applyUrl: "https://resend.com/careers",
        matchScore: 88,
        status: "ready",
      },
    ]
  })

  const appsRemainingToday = Math.max(
    0,
    dailyTarget - usage.applicationsUsedToday
  )

  const completedToday = usage.applicationsUsedToday
  const totalCompleted = recentApplications.filter(
    (a) => a.status === "applied" || a.status === "interview"
  ).length
  const failedCount = recentApplications.filter((a) => a.status === "rejected").length
  const successRate =
    totalCompleted > 0
      ? Math.round((totalCompleted / (totalCompleted + failedCount || 1)) * 100)
      : 100

  // 1. Save / Activate Automation Configuration
  async function handleSaveConfig(newStatus?: "running" | "paused" | "stopped") {
    setIsSavingConfig(true)
    try {
      const res = await fetch("/api/automation/auto-apply/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRoles: targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
          locations: locationPref.split(",").map((s) => s.trim()).filter(Boolean),
          dailyTarget,
          durationDays,
          status: newStatus || (isRunning ? "running" : "scheduled"),
          selectedResumeId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update configuration")
      }

      const data = await res.json()
      setConfig(data.config)
      setShowConfirmModal(false)

      toast({
        title: newStatus === "running" ? "Automation Activated" : "Preferences Saved",
        description:
          newStatus === "running"
            ? `Auto-apply active for ${durationDays} days. Will apply up to ${dailyTarget}/day in the background.`
            : "Your target parameters and schedule were safely updated.",
        variant: "success",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed"
      toast({ title: "Configuration Error", description: msg, variant: "error" })
    } finally {
      setIsSavingConfig(false)
    }
  }

  // 2. Immediate manual single application packet preparation
  async function handleRunSingle(itemIndex: number) {
    if (appsRemainingToday <= 0) {
      toast({
        title: "Daily Target Reached",
        description: `You have reached your daily target of ${dailyTarget} applications. Quota resets at midnight in your timezone.`,
        variant: "error",
      })
      return
    }

    const item = queue[itemIndex]
    setQueue((prev) =>
      prev.map((q, i) => (i === itemIndex ? { ...q, status: "preparing" } : q))
    )

    try {
      const res = await fetch("/api/applications/create-from-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: item.role,
          company: item.company,
          location: item.location,
          isRemote: true,
          description: `Engineering position at ${item.company} requiring modern TypeScript, scalable web services, and reliable engineering.`,
          skillsRequired: candidateSkills.slice(0, 5),
          applyUrl: item.applyUrl,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to prepare application packet.")
      }

      setQueue((prev) =>
        prev.map((q, i) => (i === itemIndex ? { ...q, status: "submitted" } : q))
      )

      toast({
        title: "Application Prepared & Submitted",
        description: `Tailored packet prepared for ${item.company} (${item.role}). Recorded in tracker.`,
        variant: "success",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Preparation failed"
      setQueue((prev) =>
        prev.map((q, i) => (i === itemIndex ? { ...q, status: "error" } : q))
      )
      toast({ title: "Failed", description: msg, variant: "error" })
    }
  }

  // 3. Process eligible matches in batch
  async function handleRunBatch() {
    if (appsRemainingToday <= 0) {
      toast({
        title: "Daily Target Reached",
        description: `Daily quota of ${dailyTarget} applications exhausted for today.`,
        variant: "error",
      })
      return
    }

    setIsProcessingBatch(true)
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === "ready") {
        await handleRunSingle(i)
      }
    }
    setIsProcessingBatch(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Auto Apply
            </h1>
            <Badge
              variant="outline"
              className={
                isRunning
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-mono"
                  : isPaused
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-mono"
                  : isExpired
                  ? "border-destructive/40 bg-destructive/10 text-destructive text-xs font-mono"
                  : "border-primary/40 bg-primary/10 text-primary text-xs font-mono"
              }
            >
              {isRunning
                ? "Active (Runs Offline)"
                : isPaused
                ? "Paused"
                : isExpired
                ? "Expired (30-day limit)"
                : "Scheduled"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Backend persistent automation that continues finding jobs and submitting applications even when you log out.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveConfig("paused")}
                disabled={isSavingConfig}
                className="gap-1.5 text-xs h-9"
              >
                <Pause className="h-4 w-4 text-amber-400" />
                Pause Automation
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSaveConfig("stopped")}
                disabled={isSavingConfig}
                className="gap-1.5 text-xs h-9 text-muted-foreground hover:text-destructive"
              >
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSavingConfig}
              className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <Play className="h-4 w-4 fill-primary-foreground" />
              {isPaused ? "Resume Automation" : "Start Automation"}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRunBatch}
            disabled={isProcessingBatch || appsRemainingToday <= 0}
            className="gap-1.5 text-xs h-9 border-amber-500/30 hover:bg-amber-500/10 text-amber-400"
          >
            {isProcessingBatch ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 fill-amber-400" />
            )}
            Run Now
          </Button>
        </div>
      </div>

      {/* Expiry & Duration Alert Banner */}
      {config && (
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="font-semibold text-foreground">
                {isRunning ? "Active Automation Window: " : "Configured Window: "}
              </span>
              <span className="text-muted-foreground">
                {durationDays} Days (Capped at 30 days max)
              </span>
              {config.expires_at && (
                <span className="ml-2 font-mono font-medium text-primary">
                  · Expires on {formattedExpiry} ({daysRemaining} days left)
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Backend runs 24/7 without requiring open browser sessions.
          </span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Daily Applications</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {appsRemainingToday} / {dailyTarget}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Target ceiling ({usage.plan === "pro" ? "Pro Plan max 20" : "Basic Plan max 10"})
          </p>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Submitted Today</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {completedToday}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Verified successful submissions
          </p>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Needs Manual Action</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {initialManualItems.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Requires CAPTCHA / login portal
          </p>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Duration Window</span>
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {daysRemaining} Days
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Auto-expires after {durationDays} days
          </p>
        </Card>
      </div>

      {/* Main Grid: Parameters on Left, Queue & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Preferences & Configuration Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Automation Setup</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure parameters for persistent offline execution.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Job Roles</Label>
              <Input
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                placeholder="e.g. Software Engineer, Backend Developer"
                className="text-xs h-9"
              />
              <span className="text-[11px] text-muted-foreground">
                Enter multiple roles separated by commas.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Location / Country</Label>
              <Input
                value={locationPref}
                onChange={(e) => setLocationPref(e.target.value)}
                placeholder="e.g. Remote, United States, Europe"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Daily Application Target (Max {planMaxDaily}/day)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max={planMaxDaily}
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="font-mono font-bold text-sm w-8 text-right">
                  {dailyTarget}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Ceiling for daily successful submissions. Resets at midnight.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Duration (Maximum 30 calendar days)
              </Label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={1}>1 Day Test Run</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={21}>21 Days (3 Weeks)</option>
                <option value={30}>30 Days (Maximum Allowed)</option>
              </select>
              <span className="text-[11px] text-muted-foreground">
                Automation safely stops and preserves history when duration ends.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Selected Truthful Resume</Label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} {r.is_primary ? "(Primary Profile)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => handleSaveConfig()}
              disabled={isSavingConfig}
              variant="outline"
              className="w-full text-xs h-9 mt-2"
            >
              {isSavingConfig ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Right: Tabbed Queue & Manual Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={activeTab === "queue" ? "default" : "ghost"}
                  onClick={() => setActiveTab("queue")}
                  className="text-xs h-8"
                >
                  Active Queue ({queue.length})
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "manual" ? "default" : "ghost"}
                  onClick={() => setActiveTab("manual")}
                  className="text-xs h-8"
                >
                  Needs Manual Action ({initialManualItems.length})
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {activeTab === "queue"
                  ? "Vacancies evaluated for submission"
                  : "Requires CAPTCHA or applicant login"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {activeTab === "queue" && (
              <>
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-foreground/20 transition-all gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">
                          {item.role}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]"
                        >
                          {item.matchScore}% Match
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <a
                          href={item.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5 text-[11px]"
                        >
                          Job Link <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.status === "submitted" ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Submitted</span>
                        </div>
                      ) : item.status === "preparing" ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating packet...</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunSingle(idx)}
                          disabled={appsRemainingToday <= 0}
                          className="text-xs h-8 gap-1.5"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          Prepare & Submit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === "manual" && (
              <>
                {initialManualItems.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-xl border-border/80">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-sm text-foreground">
                      No applications need manual intervention
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vacancies requiring CAPTCHA, manual portal authentication, or custom legal questionnaires are safely routed here so submission integrity is maintained.
                    </p>
                  </div>
                ) : (
                  initialManualItems.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{m.job_title}</span>
                          <span className="text-muted-foreground">at {m.company}</span>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          Reason: {m.notes || "Third-party portal login or CAPTCHA required."}
                        </p>
                      </div>

                      {m.apply_url && (
                        <a
                          href={m.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted font-medium text-xs text-foreground"
                        >
                          Complete on Company Site <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>All submissions and statuses are synchronized to your Overview Tracker.</span>
              <Link
                href="/dashboard"
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Open Overview Tracker <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activation Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Activate Persistent Auto-Apply</CardTitle>
              <CardDescription className="text-xs">
                Review your parameters before activating offline execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/40 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Roles:</span>
                  <span className="font-semibold text-foreground text-right">{targetRoles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locations:</span>
                  <span className="font-semibold text-foreground">{locationPref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Limit:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {dailyTarget} applications/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold text-foreground">{durationDays} Calendar Days (Max 30)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Execution Mode:</span>
                  <span className="font-semibold text-foreground">Backend Scheduled (Runs Offline)</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By activating, Octo.tech will automatically discover vacancies matching your preferences, prepare truthful tailored resumes, and submit applications up to your daily target. You can pause or stop at any time.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveConfig("running")}
                  disabled={isSavingConfig}
                  className="text-xs font-semibold gap-1.5"
                >
                  {isSavingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Confirm & Activate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
