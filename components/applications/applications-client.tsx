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

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "no_reply", label: "No Reply" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
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

  const [applications, setApplications] =
    React.useState<ApplicationRow[]>(initialApplications)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | ApplicationStatus
  >("all")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] =
    React.useState<ApplicationRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const todayDefault = React.useMemo(
    () => getDateKeyInTimezone(new Date(), usage.timezone),
    [usage.timezone]
  )

  const primaryResumeId =
    resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? ""

  const [form, setForm] = React.useState({
    company: "",
    job_title: "",
    job_url: "",
    location: "",
    job_description: "",
    resume_id: primaryResumeId,
    application_date: todayDefault,
    status: "no_reply" as ApplicationStatus,
    notes: "",
  })

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
      status: "no_reply",
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
      toast({
        title: "Company and job title are required",
        variant: "error",
      })
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
      ? await supabase
          .from("applications")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId)
          .select("*")
          .single()
      : await supabase.from("applications").insert(payload).select("*").single()

    setSaving(false)
    if (res.error || !res.data) {
      toast({
        title: editingId
          ? "Could not update application"
          : "Application limit or save error",
        description: res.error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = res.data as ApplicationRow
    setApplications((prev) =>
      editingId
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev]
    )

    if (saved.status === "rejected" || saved.status === "hired") {
      await supabase
        .from("follow_up_reminders")
        .update({ completed: true, completed_at: now, updated_at: now })
        .eq("application_id", saved.id)
        .eq("user_id", userId)
        .eq("completed", false)
    }

    await logUserActivity(supabase, {
      userId,
      activityType: editingId ? "application_updated" : "application_created",
      description: `${editingId ? "Updated" : "Logged"} application for ${saved.job_title} at ${saved.company}`,
      metadata: { application_id: saved.id, status: saved.status },
    })

    toast({
      title: editingId ? "Application updated" : "Application logged",
      variant: "success",
    })
    setFormOpen(false)
    setEditingId(null)
    router.refresh()
  }

  async function handleInlineStatusChange(
    app: ApplicationRow,
    nextStatus: ApplicationStatus
  ) {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from("applications")
      .update({ status: nextStatus, updated_at: now })
      .eq("id", app.id)
      .eq("user_id", userId)

    if (error) {
      toast({
        title: "Could not update status",
        description: error.message,
        variant: "error",
      })
      return
    }

    if (nextStatus === "rejected" || nextStatus === "hired") {
      await supabase
        .from("follow_up_reminders")
        .update({ completed: true, completed_at: now, updated_at: now })
        .eq("application_id", app.id)
        .eq("user_id", userId)
        .eq("completed", false)
    }

    setApplications((prev) =>
      prev.map((item) =>
        item.id === app.id ? { ...item, status: nextStatus } : item
      )
    )
    await logUserActivity(supabase, {
      userId,
      activityType: "application_status_changed",
      description: `Marked ${app.job_title} at ${app.company} as ${nextStatus.replace("_", " ")}`,
    })
    toast({
      title: "Status updated",
      description:
        nextStatus === "no_reply"
          ? undefined
          : "Pending follow-ups for this application have been stopped.",
      variant: "success",
    })
    router.refresh()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", userId)
    setDeleting(false)

    if (error) {
      toast({
        title: "Could not delete application",
        description: error.message,
        variant: "error",
      })
      return
    }

    setApplications((prev) =>
      prev.filter((item) => item.id !== deleteTarget.id)
    )
    toast({ title: "Application removed", variant: "success" })
    setDeleteTarget(null)
    router.refresh()
  }

  const filtered = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false
    if (dateFrom && app.application_date < dateFrom) return false
    if (dateTo && app.application_date > dateTo) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matches =
        app.company.toLowerCase().includes(q) ||
        app.job_title.toLowerCase().includes(q) ||
        (app.location ?? "").toLowerCase().includes(q)
      if (!matches) return false
    }
    return true
  })

  const total = applications.length
  const pending = applications.filter((a) => a.status === "no_reply").length
  const rejected = applications.filter((a) => a.status === "rejected").length
  const hired = applications.filter((a) => a.status === "hired").length
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0
  const hireRate = total > 0 ? Math.round((hired / total) * 100) : 0
  const remainingToday = Math.max(
    0,
    usage.applicationsDailyLimit - usage.applicationsUsedToday
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track submitted job applications, outcomes, and daily plan limits ({remainingToday} of {usage.applicationsDailyLimit} left today).
          </p>
        </div>
        <Button type="button" onClick={openNewForm}>
          <Plus className="size-4" />
          Add Application
        </Button>
      </div>

      {/* Real Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardDescription>Pending / No Reply</CardDescription>
            <CardTitle className="text-2xl">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardDescription>Rejections ({rejectionRate}%)</CardDescription>
            <CardTitle className="text-2xl">{rejected}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardDescription>Hires ({hireRate}%)</CardDescription>
            <CardTitle className="text-2xl">{hired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Application" : "Log New Application"}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "Update status, notes, or role details."
                : `Remaining daily quota: ${remainingToday}/${usage.applicationsDailyLimit} on ${usage.plan.toUpperCase()} plan.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="app-company">Company *</Label>
                  <Input
                    id="app-company"
                    value={form.company}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, company: e.target.value }))
                    }
                    placeholder="Vercel"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-job-title">Job Title *</Label>
                  <Input
                    id="app-job-title"
                    value={form.job_title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, job_title: e.target.value }))
                    }
                    placeholder="Staff Frontend Engineer"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-url">Job URL</Label>
                  <Input
                    id="app-url"
                    type="url"
                    value={form.job_url}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, job_url: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-location">Location</Label>
                  <Input
                    id="app-location"
                    value={form.location}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="Remote / San Francisco, CA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-date">Application Date</Label>
                  <Input
                    id="app-date"
                    type="date"
                    value={form.application_date}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        application_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="app-status">Status</Label>
                  <Select
                    id="app-status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as ApplicationStatus,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="app-resume">Resume Used</Label>
                  <Select
                    id="app-resume"
                    value={form.resume_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resume_id: e.target.value }))
                    }
                  >
                    <option value="">None selected</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                        {r.is_primary ? " (Primary)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="app-notes">Notes</Label>
                <Textarea
                  id="app-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Recruiter contact, referral details, interview notes..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Save Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or role..."
              className="pl-8"
              aria-label="Search applications"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | ApplicationStatus)
            }
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter from date"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter to date"
          />
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Applications ({filtered.length})</CardTitle>
          <CardDescription>
            Marking an application Rejected or Hired automatically stops open follow-ups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="size-9 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium text-foreground">
                {applications.length === 0
                  ? "No applications tracked yet"
                  : "No applications match your filters"}
              </p>
              {applications.length === 0 ? (
                <Button size="sm" className="mt-4" onClick={openNewForm}>
                  Add Your First Application
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((app) => {
                const linkedResume = resumes.find(
                  (r) => r.id === app.resume_id
                )
                return (
                  <div
                    key={app.id}
                    className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {app.job_title}
                        </p>
                        <Badge variant="outline">{app.company}</Badge>
                        {app.job_url ? (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Posting
                            <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applied {app.application_date}
                        {app.location ? ` · ${app.location}` : ""}
                        {linkedResume ? ` · Resume: ${linkedResume.title}` : ""}
                      </p>
                      {app.notes ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {app.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Select
                        value={app.status}
                        onChange={(e) =>
                          handleInlineStatusChange(
                            app,
                            e.target.value as ApplicationStatus
                          )
                        }
                        className="w-32"
                        aria-label={`Status for ${app.company}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                      {app.status === "no_reply" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/dashboard/follow-ups?applicationId=${app.id}`}
                            />
                          }
                        >
                          Follow-up
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditForm(app)}
                        aria-label={`Edit ${app.job_title}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(app)}
                        aria-label={`Delete ${app.job_title}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete application?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.job_title}" at "${deleteTarget.company}" and its follow-up reminders?`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
