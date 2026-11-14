"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateJobMatchDeterministic } from "@/lib/ai/provider"
import { AgentClient } from "@/components/agent/agent-client"
import { CURATED_STARTUPS } from "@/lib/jobs/catalog"
import {
  Briefcase,
  Building2,
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Search,
  Sparkles,
  Filter,
  CheckCircle2,
  Plus,
  Rocket,
  Bot,
  Lock,
} from "lucide-react"
import type { DiscoveredJob } from "@/lib/jobs/catalog"
import type { JobSearchRow } from "@/types/database"

interface JobsClientProps {
  initialJobs: DiscoveredJob[]
  candidateSkills: string[]
  savedJobIds: string[]
  userId: string
  savedSearches?: JobSearchRow[]
  isPro?: boolean
  initialTab?: string
}

export function JobsClient({
  initialJobs,
  candidateSkills,
  savedJobIds: initialSaved,
  userId,
  savedSearches = [],
  isPro = false,
  initialTab = "search",
}: JobsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTabParam = searchParams?.get("tab") || initialTab

  const [activeTab, setActiveTab] = React.useState<"search" | "startups" | "agent" | "saved">(
    (currentTabParam as any) || "search"
  )

  React.useEffect(() => {
    const t = searchParams?.get("tab")
    if (t && (t === "search" || t === "startups" || t === "agent" || t === "saved")) {
      setActiveTab(t as any)
    }
  }, [searchParams])

  const [jobs, setJobs] = React.useState<DiscoveredJob[]>(initialJobs)
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set(initialSaved))
  const [query, setQuery] = React.useState("")
  const [remoteOnly, setRemoteOnly] = React.useState(false)
  const [selectedJob, setSelectedJob] = React.useState<DiscoveredJob | null>(null)
  const [showAddManual, setShowAddManual] = React.useState(false)
  const [startingAppId, setStartingAppId] = React.useState<string | null>(null)
  const [manualForm, setManualForm] = React.useState({
    title: "",
    company: "",
    location: "Remote",
    description: "",
    applyUrl: "",
    salaryRange: "",
  })

  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  // Filter jobs based on active tab and search query
  const displayedJobs = React.useMemo(() => {
    let sourceList = jobs
    if (activeTab === "startups") {
      sourceList = isPro ? CURATED_STARTUPS : CURATED_STARTUPS.slice(0, 3)
    } else if (activeTab === "saved") {
      sourceList = jobs.filter((j) => savedIds.has(j.externalId))
    }

    return sourceList.filter((job) => {
      if (remoteOnly && !job.isRemote) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.skillsRequired.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [jobs, query, remoteOnly, activeTab, savedIds, isPro])

  async function handleStartApplication(job: DiscoveredJob) {
    setStartingAppId(job.externalId)
    try {
      const res = await fetch("/api/applications/create-from-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: job.company,
          title: job.title,
          location: job.location,
          description: job.description,
          applyUrl: job.applyUrl,
          skillsRequired: job.skillsRequired,
          salaryRange: job.salaryRange,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to start application.")
      }

      toast({
        title: "Draft application created!",
        description: `Tailored resume and cover letter generated for ${job.company}. Opening application workspace...`,
        variant: "success",
      })

      if (data.applicationId) {
        router.push(`/dashboard/applications/${data.applicationId}`)
      } else {
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error starting application"
      toast({ title: "Application creation failed", description: msg, variant: "error" })
    } finally {
      setStartingAppId(null)
    }
  }

  // Save or unsave job
  async function toggleSaveJob(job: DiscoveredJob) {
    const isSaved = savedIds.has(job.externalId)
    if (isSaved) {
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(job.externalId)
        return next
      })
      toast({ title: "Job removed from saved list", variant: "info" })
    } else {
      const { data: posting } = await supabase
        .from("job_postings")
        .upsert(
          {
            external_id: job.externalId,
            source: job.source,
            title: job.title,
            company: job.company,
            location: job.location,
            is_remote: job.isRemote,
            employment_type: job.employmentType,
            description: job.description,
            apply_url: job.applyUrl,
            salary_range: job.salaryRange,
            skills_required: job.skillsRequired,
            is_startup: job.isStartup,
          },
          { onConflict: "source,external_id" }
        )
        .select()
        .single()

      if (posting) {
        await supabase.from("saved_jobs").upsert(
          {
            user_id: userId,
            job_posting_id: posting.id,
            status: "saved",
          },
          { onConflict: "user_id,job_posting_id" }
        )
      }

      setSavedIds((prev) => new Set([...prev, job.externalId]))
      toast({ title: "Job saved to your pipeline", variant: "success" })
    }
  }

  // Add manual job
  async function handleAddManualJob() {
    if (!manualForm.title || !manualForm.company) return
    const newJob: DiscoveredJob = {
      externalId: `manual-${Date.now()}`,
      source: "manual",
      title: manualForm.title.trim(),
      company: manualForm.company.trim(),
      location: manualForm.location.trim() || "Remote",
      isRemote: manualForm.location.toLowerCase().includes("remote"),
      employmentType: "Full-time",
      experienceLevel: "Mid-Senior",
      description: manualForm.description.trim() || "Directly submitted opportunity.",
      applyUrl: manualForm.applyUrl.trim() || "https://octo.tech",
      salaryRange: manualForm.salaryRange.trim() || undefined,
      skillsRequired: candidateSkills.slice(0, 4),
      isStartup: false,
      postedAt: new Date().toISOString(),
    }

    setJobs((prev) => [newJob, ...prev])
    setShowAddManual(false)
    setManualForm({ title: "", company: "", location: "Remote", description: "", applyUrl: "", salaryRange: "" })
    toast({ title: "Opportunity added to your discovery feed", variant: "success" })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Job Discovery
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore live tech vacancies, venture-backed startups, and automated daily searches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddManual(!showAddManual)}>
            <Plus className="h-4 w-4 mr-1" /> Add Job Manually
          </Button>
        </div>
      </div>

      {/* Workspace Tabs: All Jobs | Startups | Daily Saved Searches | Saved */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "search"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          Job Search
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("startups")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "startups"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Rocket className="h-3.5 w-3.5" />
          Tech Startups
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("agent")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "agent"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          Daily Saved Searches
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "saved"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Saved Opportunities ({savedIds.size})
        </button>
      </div>

      {/* If Tab === agent, render the complete Daily Saved Searches Agent workspace */}
      {activeTab === "agent" && (
        <AgentClient
          initialSearches={savedSearches}
          candidateSkills={candidateSkills}
          userId={userId}
        />
      )}

      {/* Manual Job Modal */}
      {showAddManual && (
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Add Custom Job Posting</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Job Title *" value={manualForm.title} onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })} />
            <Input placeholder="Company Name *" value={manualForm.company} onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })} />
            <Input placeholder="Location (e.g. Remote)" value={manualForm.location} onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })} />
            <Input placeholder="Apply URL" value={manualForm.applyUrl} onChange={(e) => setManualForm({ ...manualForm, applyUrl: e.target.value })} />
            <Input placeholder="Salary Range (e.g. $140k - $170k)" value={manualForm.salaryRange} onChange={(e) => setManualForm({ ...manualForm, salaryRange: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddManual(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddManualJob}>Save Opportunity</Button>
          </div>
        </div>
      )}

      {/* For Job Search, Startups, and Saved Tabs */}
      {activeTab !== "agent" && (
        <>
          {activeTab === "startups" && !isPro && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>
                  Basic plan preview: showing 3 featured startups. Upgrade to Pro for complete founder database and direct outreach contacts.
                </span>
              </div>
              <Link href="/dashboard/subscription" className="underline font-semibold text-primary whitespace-nowrap ml-4">
                Upgrade to Pro
              </Link>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles, companies, or tech stacks (e.g. Next.js, Python, Supabase)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={remoteOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setRemoteOnly(!remoteOnly)}
              className="gap-2 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              {remoteOnly ? "Remote Only (Active)" : "Remote Only"}
            </Button>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {displayedJobs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
                No opportunities found matching your criteria.
              </div>
            ) : (
              displayedJobs.map((job) => {
                const isSaved = savedIds.has(job.externalId)
                const isStarting = startingAppId === job.externalId
                const matchAnalysis = calculateJobMatchDeterministic(
                  candidateSkills,
                  job.title,
                  job.description,
                  job.skillsRequired
                )

                return (
                  <div
                    key={job.externalId}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-foreground/30 hover:shadow-md"
                  >
                    <div>
                      {/* Top Row: Title, Company, and Save Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-foreground text-base hover:underline cursor-pointer" onClick={() => setSelectedJob(job)}>
                              {job.title}
                            </h2>
                            {job.isStartup && (
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                Startup
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 font-medium text-foreground/90">
                              <Building2 className="h-3.5 w-3.5" />
                              {job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSaveJob(job)}
                          title={isSaved ? "Saved" : "Save Job"}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-4 w-4 text-primary fill-primary" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* AI Compatibility Meter */}
                      <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" /> Match Score
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {matchAnalysis.score}%
                          </span>
                        </div>
                        <div className="w-full bg-border/40 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${matchAnalysis.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                          {matchAnalysis.reasoning}
                        </p>
                      </div>

                      {/* Job Description Preview */}
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Required Skills Badges */}
                      {job.skillsRequired.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.skillsRequired.slice(0, 5).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 font-normal"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {job.salaryRange ? <span>{job.salaryRange}</span> : <span className="capitalize">{job.source} feed</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {job.applyUrl && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Post
                          </a>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleStartApplication(job)}
                          disabled={isStarting}
                          className="h-8 text-xs gap-1.5 font-medium"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isStarting ? "Preparing Packet..." : "Start Application"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Selected Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedJob.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedJob.company} · {selectedJob.location}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-3 pt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Opportunity Description</h4>
              <p>{selectedJob.description}</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              {selectedJob.applyUrl && (
                <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Original Posting
                  </Button>
                </a>
              )}
              <Button
                size="sm"
                onClick={() => {
                  handleStartApplication(selectedJob)
                  setSelectedJob(null)
                }}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Start Tailored Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
