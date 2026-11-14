"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateJobMatchDeterministic } from "@/lib/ai/provider"
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
} from "lucide-react"
import type { DiscoveredJob } from "@/lib/jobs/catalog"
import type { SkillRow } from "@/types/database"

interface JobsClientProps {
  initialJobs: DiscoveredJob[]
  candidateSkills: string[]
  savedJobIds: string[]
  userId: string
}

export function JobsClient({
  initialJobs,
  candidateSkills,
  savedJobIds: initialSaved,
  userId,
}: JobsClientProps) {
  const router = useRouter()
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

  // Filter jobs
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
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
  }, [jobs, query, remoteOnly])

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
        description: `Tailored resume and cover letter generated for ${job.company}. Opening Tracker...`,
        variant: "success",
      })

      router.push("/dashboard/applications")
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
      // First ensure job_posting exists in DB
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
      applyUrl: manualForm.applyUrl.trim() || undefined,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Job Discovery
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore live tech opportunities and instantly calculate your compatibility score.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddManual(!showAddManual)}>
            <Plus className="h-4 w-4 mr-1" /> Add Job Manually
          </Button>
        </div>
      </div>

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
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {remoteOnly ? "Remote Only (Active)" : "Remote Only"}
        </Button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No matching opportunities found. Try adjusting your search query.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isSaved = savedIds.has(job.externalId)
            const match = calculateJobMatchDeterministic(
              candidateSkills,
              job.title,
              job.description,
              job.skillsRequired
            )

            return (
              <div
                key={job.externalId}
                className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs hover:border-foreground/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-base hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{job.company}</span>
                        <span>•</span>
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                      </div>
                    </div>

                    {/* Compatibility Badge */}
                    <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold font-mono text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      {match.score}% Match
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skillsRequired.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.salaryRange && (
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        {job.salaryRange}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    Source: {job.source.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSaveJob(job)}
                      className="h-8 px-2"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-emerald-400 mr-1" />
                      ) : (
                        <Bookmark className="h-4 w-4 mr-1" />
                      )}
                      {isSaved ? "Saved" : "Save"}
                    </Button>

                    <Button
                      size="sm"
                      variant="default"
                      disabled={startingAppId === job.externalId}
                      onClick={() => handleStartApplication(job)}
                      className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {startingAppId === job.externalId ? "Creating..." : "Start Application"}
                    </Button>

                    {job.applyUrl && (
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5">
                          Link <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

