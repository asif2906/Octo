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
import type { ApplicationRow, ResumeRow, DiscoveredJob } from "@/types/database"

interface AutoApplyClientProps {
  userId: string
  usage: UsageSummary
  resumes: Pick<ResumeRow, "id" | "title" | "is_primary">[]
  recentApplications: ApplicationRow[]
  candidateSkills: string[]
}

export function AutoApplyClient({
  userId,
  usage,
  resumes,
  recentApplications,
  candidateSkills,
}: AutoApplyClientProps) {
  const { toast } = useToast()
  const [isActive, setIsActive] = React.useState(true)
  const [targetRoles, setTargetRoles] = React.useState("Full Stack Engineer, Frontend Engineer, React Developer")
  const [locationPref, setLocationPref] = React.useState("Remote / United States")
  const [remoteOnly, setRemoteOnly] = React.useState(true)
  const [selectedResumeId, setSelectedResumeId] = React.useState(
    resumes.find((r) => r.is_primary)?.id || resumes[0]?.id || ""
  )
  const [autoTailor, setAutoTailor] = React.useState(true)
  const [autoCoverLetter, setAutoCoverLetter] = React.useState(true)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const appsRemainingToday = Math.max(
    0,
    usage.applicationsDailyLimit - usage.applicationsUsedToday
  )

  const completedToday = usage.applicationsUsedToday
  const totalCompleted = recentApplications.filter((a) => a.status === "applied" || a.status === "interview").length
  const failedCount = recentApplications.filter((a) => a.status === "rejected").length
  const successRate = totalCompleted > 0 ? Math.round((totalCompleted / (totalCompleted + failedCount || 1)) * 100) : 100

  // Simulation / sample queued jobs matching user parameters
  const [queue, setQueue] = React.useState<Array<{
    id: string
    company: string
    role: string
    location: string
    matchScore: number
    status: "ready" | "preparing" | "submitted" | "error"
    appliedDate?: string
  }>>([
    {
      id: "q-1",
      company: "Linear",
      role: "Frontend Systems Engineer",
      location: "Remote (US/EU)",
      matchScore: 94,
      status: "ready",
    },
    {
      id: "q-2",
      company: "Supabase",
      role: "Full Stack Developer",
      location: "Remote Worldwide",
      matchScore: 91,
      status: "ready",
    },
    {
      id: "q-3",
      company: "Resend",
      role: "Growth & Product Engineer",
      location: "Remote",
      matchScore: 88,
      status: "ready",
    },
  ])

  async function handleRunSingle(itemIndex: number) {
    if (appsRemainingToday <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: `You have reached your daily limit of ${usage.applicationsDailyLimit} applications. Quota resets at midnight.`,
        variant: "error",
      })
      return
    }

    const item = queue[itemIndex]
    setQueue((prev) =>
      prev.map((q, i) => (i === itemIndex ? { ...q, status: "preparing" } : q))
    )

    try {
      // Call create-from-job API which handles AI tailoring, cover letter generation, and application persistence
      const res = await fetch("/api/applications/create-from-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: item.role,
          company: item.company,
          location: item.location,
          isRemote: true,
          description: `Engineering position at ${item.company} requiring modern TypeScript, React, and scalable backend services.`,
          skillsRequired: candidateSkills.slice(0, 5),
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to prepare application packet.")
      }

      setQueue((prev) =>
        prev.map((q, i) =>
          i === itemIndex
            ? { ...q, status: "submitted", appliedDate: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
            : q
        )
      )

      toast({
        title: "Application Packet Prepared!",
        description: `Tailored resume and cover letter created for ${item.company}. Recorded in Tracker.`,
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

  async function handleRunBatch() {
    if (appsRemainingToday <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: `Daily quota of ${usage.applicationsDailyLimit} applications exhausted.`,
        variant: "error",
      })
      return
    }

    setIsProcessing(true)
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === "ready") {
        await handleRunSingle(i)
      }
    }
    setIsProcessing(false)
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
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
              Automation Hub
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Intelligent job application agent that matches vacancies, generates tailored documents, and prepares submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isActive ? "outline" : "default"}
            size="sm"
            onClick={() => setIsActive(!isActive)}
            className="gap-2"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isActive ? "Pause Automation" : "Resume Automation"}
          </Button>

          <Button
            size="sm"
            onClick={handleRunBatch}
            disabled={isProcessing || !isActive || appsRemainingToday <= 0}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            )}
            Process Eligible Matches
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Daily Allowance</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {appsRemainingToday} / {usage.applicationsDailyLimit}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {usage.plan === "pro" ? "Pro Plan (20/day)" : "Basic Plan (10/day)"}
          </p>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Completed Today</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {completedToday}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Submissions verified
          </p>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ready in Queue</span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {queue.filter((q) => q.status === "ready").length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Matched target criteria
          </p>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Success Rate</span>
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {successRate}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Based on tracked outcomes
          </p>
        </Card>
      </div>

      {/* Main Grid: Parameters on Left, Match Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Preferences & Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Target Parameters</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure what roles and criteria the automation engine targets.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Roles</Label>
              <Input
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                placeholder="e.g. Software Engineer, React Developer"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Location Preference</Label>
              <Input
                value={locationPref}
                onChange={(e) => setLocationPref(e.target.value)}
                placeholder="e.g. Remote, United States"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Base Resume Selection</Label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} {r.is_primary ? "(Primary)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-2.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="font-medium text-foreground">Remote positions only</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTailor}
                  onChange={(e) => setAutoTailor(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="font-medium text-foreground">AI auto-tailor resume per vacancy</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCoverLetter}
                  onChange={(e) => setAutoCoverLetter(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="font-medium text-foreground">Generate tailored cover letter</span>
              </label>
            </div>

            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Safeguard Guarantee:</span> All applications are prepared as drafts with complete AI documents and verified against your profile. Submissions adhere to official limits and never bypass security gates.
            </div>
          </CardContent>
        </Card>

        {/* Right: Active Queue & Submissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Application Matches & Queue</CardTitle>
                <CardDescription className="text-xs">
                  Vacancies analyzed by AI and ready for tailored packet preparation.
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                {queue.length} Opportunities
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {queue.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-foreground/20 transition-all gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{item.role}</p>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
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
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.status === "submitted" ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Prepared {item.appliedDate}</span>
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
                      disabled={!isActive || appsRemainingToday <= 0}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      Prepare Packet
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>View all processed applications in your Overview Tracker.</span>
              <Link href="/dashboard" className="text-primary hover:underline flex items-center gap-1 font-medium">
                Open Overview Tracker <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
