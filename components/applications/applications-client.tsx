"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import { getDateKeyInTimezone, type UsageSummary } from "@/lib/plans"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  ApplicationRow,
  ApplicationStatus,
  ResumeRow,
} from "@/types/database"

interface ApplicationsClientProps {
  userId: string
  usage: UsageSummary
  initialApplications: ApplicationRow[]
  resumes: Pick<ResumeRow, "id" | "title" | "is_primary">[]
}

const KANBAN_STAGES: Array<{ id: ApplicationStatus; label: string; color: string; border: string }> = [
  { id: "draft", label: "Draft", color: "text-zinc-300 bg-zinc-500/10", border: "border-zinc-500/30" },
  { id: "applied", label: "Applied", color: "text-blue-300 bg-blue-500/10", border: "border-blue-500/30" },
  { id: "assessment", label: "Assessment", color: "text-amber-300 bg-amber-500/10", border: "border-amber-500/30" },
  { id: "interview", label: "Interview", color: "text-purple-300 bg-purple-500/10", border: "border-purple-500/30" },
  { id: "offer", label: "Offer", color: "text-emerald-300 bg-emerald-500/10", border: "border-emerald-500/30" },
  { id: "rejected", label: "Rejected", color: "text-rose-300 bg-rose-500/10", border: "border-rose-500/30" },
]

export function ApplicationsClient({
  userId,
  usage,
  initialApplications,
  resumes,
}: ApplicationsClientProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [applications, setApplications] = React.useState<ApplicationRow[]>(initialApplications)
  const [viewMode, setViewMode] = React.useState<"board" | "table">("board")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ApplicationRow | null>(null)

  const todayDefault = React.useMemo(
    () => getDateKeyInTimezone(new Date(), usage.timezone),
    [usage.timezone]
  )

  const primaryResumeId = resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? ""

  const [form, setForm] = React.useState({
    company: "",
    job_title: "",
    job_url: "",
    location: "",
    job_description: "",
    resume_id: primaryResumeId,
    application_date: todayDefault,
    status: "applied" as ApplicationStatus,
    notes: "",
  })

  // Filtered applications
  const filtered = React.useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "all") {
        if (statusFilter === "applied" && (app.status === "applied" || app.status === "no_reply")) {
          // match
        } else if (statusFilter === "offer" && (app.status === "offer" || app.status === "hired")) {
          // match
        } else if (app.status !== statusFilter) {
          return false
        }
      }
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        app.company.toLowerCase().includes(q) ||
        app.job_title.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q))
      )
    })
  }, [applications, searchQuery, statusFilter])

  // Move stage directly (Board or card action)
  async function handleMoveStage(appId: string, newStage: ApplicationStatus) {
    const prevApps = [...applications]
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStage, updated_at: new Date().toISOString() } : a))
    )

    const { error } = await supabase
      .from("applications")
      .update({ status: newStage, updated_at: new Date().toISOString() })
      .eq("id", appId)
      .eq("user_id", userId)

    if (error) {
      setApplications(prevApps)
      toast({ title: "Failed to update status", description: error.message, variant: "error" })
    } else {
      toast({ title: `Moved to ${newStage.toUpperCase()}`, variant: "info" })
    }
  }

  function openNewForm() {
    setEditingId(null)
    setForm({
      company: "",
      job_title: "",
      job_url: "",
      location: "",
      job_description: "",
      resume_id: primaryResumeId,
      application_date: todayDefault,
      status: "draft",
      notes: "",
    })
    setFormOpen(true)
  }

  function openEditForm(app: ApplicationRow) {
    setEditingId(app.id)
    setForm({
      company: app.company,
      job_title: app.job_title,
      job_url: app.job_url ?? "",
      location: app.location ?? "",
      job_description: app.job_description ?? "",
      resume_id: app.resume_id ?? "",
      application_date: app.application_date,
      status: app.status,
      notes: app.notes ?? "",
    })
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.job_title.trim()) {
      toast({ title: "Company and job title are required", variant: "error" })
      return
    }

    setSaving(true)
    const now = new Date().toISOString()
    const payload = {
      user_id: userId,
      company: form.company.trim(),
      job_title: form.job_title.trim(),
      job_url: form.job_url.trim() || null,
      location: form.location.trim() || null,
      job_description: form.job_description.trim() || null,
      resume_id: form.resume_id || null,
      application_date: form.application_date || todayDefault,
      status: form.status,
      notes: form.notes.trim() || null,
      updated_at: now,
    }

    const res = editingId
      ? await supabase.from("applications").update(payload).eq("id", editingId).eq("user_id", userId).select("*").single()
      : await supabase.from("applications").insert(payload).select("*").single()

    setSaving(false)
    if (res.error || !res.data) {
      toast({ title: "Save error", description: res.error?.message, variant: "error" })
      return
    }

    const saved = res.data as ApplicationRow
    setApplications((prev) =>
      editingId ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
    )

    setFormOpen(false)
    toast({ title: editingId ? "Application updated" : "Application logged", variant: "success" })
  }

  async function handleDelete(appId: string) {
    const { error } = await supabase.from("applications").delete().eq("id", appId).eq("user_id", userId)
    if (!error) {
      setApplications((prev) => prev.filter((a) => a.id !== appId))
      setDeleteTarget(null)
      toast({ title: "Application deleted", variant: "info" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Applications Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your opportunities across Kanban stages or review detailed metrics in Table view.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "board"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" />
              Table
            </button>
          </div>

          <Button size="sm" onClick={openNewForm} className="gap-1.5">
            <Plus className="size-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search company, job title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44 text-xs"
        >
          <option value="all">All Stages ({applications.length})</option>
          <option value="draft">Draft</option>
          <option value="applied">Applied</option>
          <option value="assessment">Assessment</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-semibold text-foreground text-base">
                {editingId ? "Edit Application" : "New Application"}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Company *</Label>
                  <Input
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Job Title *</Label>
                  <Input
                    required
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input
                    placeholder="e.g. Remote / SF"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Application Stage</Label>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
                    className="mt-1 text-xs"
                  >
                    <option value="draft">Draft</option>
                    <option value="applied">Applied</option>
                    <option value="assessment">Assessment</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Job Posting URL</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.job_url}
                    onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Job Description (Used for AI tailoring)</Label>
                <Textarea
                  rows={4}
                  value={form.job_description}
                  onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  placeholder="Paste job details or responsibilities..."
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Private Notes</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Salary notes, recruiter names, referral contacts..."
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Application" : "Save to Pipeline"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Application"
        description={`Are you sure you want to delete the application for ${deleteTarget?.job_title} at ${deleteTarget?.company}?`}
        confirmLabel="Delete"
        destructive={true}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget.id)
        }}
      />

      {/* VIEW MODE: KANBAN BOARD */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-6">
          {KANBAN_STAGES.map((col) => {
            const colApps = filtered.filter((app) => {
              if (col.id === "applied") return app.status === "applied" || app.status === "no_reply"
              if (col.id === "offer") return app.status === "offer" || app.status === "hired"
              return app.status === col.id
            })

            return (
              <div
                key={col.id}
                className="rounded-xl border border-border/70 bg-card/40 p-3 min-h-[500px] flex flex-col space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${col.color}`}>
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1">
                  {colApps.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border border-dashed border-border/50 rounded-lg text-[11px] text-muted-foreground/60 italic">
                      No applications
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-lg border border-border/80 bg-card p-3.5 shadow-xs hover:border-foreground/30 transition-all space-y-2.5 relative group"
                      >
                        <Link
                          href={`/dashboard/applications/${app.id}`}
                          className="block hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-semibold text-xs text-foreground truncate group-hover/card:text-primary transition-colors">
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

                        {/* Move stage selector */}
                        <div className="pt-1 flex items-center justify-between border-t border-border/40 text-[10px]">
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

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditForm(app)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(app)}
                              className="p-1 rounded text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => (
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
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {app.status === "no_reply" ? "Applied" : app.status === "hired" ? "Offer" : app.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {app.location || "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {app.application_date || new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Link href={`/dashboard/applications/${app.id}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                            Workspace
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEditForm(app)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(app)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
  )
}
