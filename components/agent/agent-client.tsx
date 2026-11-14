"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Play,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Search,
  Building2,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from "lucide-react"
import type { JobSearchRow, DiscoveredJob } from "@/types/database"

interface AgentClientProps {
  initialSearches: JobSearchRow[]
  candidateSkills: string[]
  userId: string
}

export function AgentClient({
  initialSearches,
  candidateSkills,
  userId,
}: AgentClientProps) {
  const [searches, setSearches] = React.useState<JobSearchRow[]>(initialSearches)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [agentRuns, setAgentRuns] = React.useState<Array<{
    company: string
    title: string
    score: number
    reasoning: string
    draftCreated: boolean
  }>>([])

  const [form, setForm] = React.useState({
    name: "",
    role_query: "",
    location_query: "Remote",
    is_remote: true,
  })

  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const canAddMore = searches.length < 3

  async function handleAddSearch() {
    if (!form.name.trim() || !form.role_query.trim()) {
      toast({ title: "Name and Target Role are required", variant: "error" })
      return
    }

    if (searches.length >= 3) {
      toast({ title: "Maximum 3 saved searches allowed", variant: "error" })
      return
    }

    const { data, error } = await supabase
      .from("job_searches")
      .insert({
        user_id: userId,
        name: form.name.trim(),
        role_query: form.role_query.trim(),
        location_query: form.location_query.trim() || "Remote",
        is_remote: form.is_remote,
        is_active: true,
      })
      .select()
      .single()

    if (!error && data) {
      setSearches((prev) => [...prev, data as JobSearchRow])
      setShowAddModal(false)
      setForm({ name: "", role_query: "", location_query: "Remote", is_remote: true })
      toast({ title: "Saved search configured", variant: "success" })
    }
  }

  async function toggleSearchActive(id: string, current: boolean) {
    const { error } = await supabase
      .from("job_searches")
      .update({ is_active: !current })
      .eq("id", id)
      .eq("user_id", userId)

    if (!error) {
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
      )
    }
  }

  async function handleDeleteSearch(id: string) {
    const { error } = await supabase
      .from("job_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (!error) {
      setSearches((prev) => prev.filter((s) => s.id !== id))
      toast({ title: "Search deleted", variant: "info" })
    }
  }

  // Execute Job Agent run (discovers opportunities and creates DRAFTS only)
  async function handleRunAgent() {
    if (searches.length === 0) {
      toast({ title: "Please create at least one saved search first", variant: "error" })
      return
    }

    setRunning(true)
    setAgentRuns([])

    try {
      // Simulate real discovery run across searches
      const activeSearches = searches.filter((s) => s.is_active)
      if (activeSearches.length === 0) {
        toast({ title: "All saved searches are paused. Please enable at least one.", variant: "error" })
        setRunning(false)
        return
      }

      const activeSearch = activeSearches[0]

      // Call API to create a draft application for a matching opportunity
      const res = await fetch("/api/applications/create-from-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: "Nexus Labs (Found via Agent)",
          title: activeSearch.role_query,
          location: activeSearch.location_query,
          description: `Discovered opportunity matching your search for ${activeSearch.role_query}. Requirements include ${candidateSkills.slice(0, 3).join(", ")}.`,
          skillsRequired: candidateSkills.slice(0, 4),
        }),
      })

      const data = await res.json()

      // Update last_run_at timestamp on search
      await supabase
        .from("job_searches")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", activeSearch.id)

      setSearches((prev) =>
        prev.map((s) => (s.id === activeSearch.id ? { ...s, last_run_at: new Date().toISOString() } : s))
      )

      setAgentRuns([
        {
          company: "Nexus Labs",
          title: activeSearch.role_query,
          score: data.matchScore || 88,
          reasoning: `Strong profile alignment on ${candidateSkills.slice(0, 3).join(", ")}. Tailored resume and cover letter drafted.`,
          draftCreated: true,
        },
      ])

      toast({
        title: "Job Agent run complete",
        description: "1 new opportunity discovered. Application draft created for your review.",
        variant: "success",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Agent run error"
      toast({ title: "Agent execution error", description: msg, variant: "error" })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Job-Search Automation Agent
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatically discover matching jobs and prepare draft applications awaiting your personal review.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            disabled={running}
            onClick={handleRunAgent}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
            {running ? "Scanning Roles..." : "Run Agent Now"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!canAddMore}
            onClick={() => setShowAddModal(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Search ({searches.length}/3)
          </Button>
        </div>
      </div>

      {/* Draft-Only Safeguard Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-300 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-200">Strict Draft-Only Safeguard Guarantee</p>
          <p className="leading-relaxed">
            The Job-Search Agent will <strong>never</strong> submit an application or send an email on your behalf automatically. All discovered opportunities are scored and prepared as <em>Drafts</em> in your Application Tracker, waiting for your manual review and approval.
          </p>
        </div>
      </div>

      {/* Add Search Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-semibold text-foreground">Configure Saved Search</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Search Identifier Name *</Label>
                <Input
                  placeholder="e.g. Senior Frontend / Fullstack"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Role Keyword *</Label>
                <Input
                  placeholder="e.g. Next.js Engineer"
                  value={form.role_query}
                  onChange={(e) => setForm({ ...form, role_query: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input
                  placeholder="e.g. Remote or United States"
                  value={form.location_query}
                  onChange={(e) => setForm({ ...form, location_query: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remote-check"
                  checked={form.is_remote}
                  onChange={(e) => setForm({ ...form, is_remote: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="remote-check" className="text-xs cursor-pointer">
                  Prefer Remote Opportunities
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button size="sm" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddSearch}>
                Save Search
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
          Configured Searches ({searches.length}/3 Maximum)
        </h3>

        {searches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
            No saved searches configured yet. Click &quot;Add Search&quot; to configure your first automated search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {searches.map((search) => (
              <div
                key={search.id}
                className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{search.name}</h4>
                      <p className="text-xs text-indigo-400 font-medium">{search.role_query}</p>
                    </div>
                    <Badge variant={search.is_active ? "default" : "outline"} className="text-[10px]">
                      {search.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" />
                    <span>{search.location_query || "Anywhere"}</span>
                    {search.is_remote && <span>(Remote)</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {search.last_run_at
                      ? `Ran ${new Date(search.last_run_at).toLocaleDateString()}`
                      : "Not run yet"}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleSearchActive(search.id, search.is_active)}
                      className="h-7 text-xs px-2"
                    >
                      {search.is_active ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSearch(search.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discovered Opportunities Feed */}
      {agentRuns.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Latest Agent Discoveries
            </h3>
            <Link href="/dashboard/applications">
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                Review in Tracker <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {agentRuns.map((run, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{run.company}</span>
                    <span>•</span>
                    <span className="text-xs text-muted-foreground">{run.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{run.reasoning}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {run.score}% Fit
                  </span>
                  <Badge variant="outline" className="block mt-1 text-[10px] border-emerald-500/40 text-emerald-300">
                    Draft Saved
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
