"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BellRing,
  CheckCircle2,
  Circle,
  Info,
  Lock,
  Plus,
  Trash2,
  Sparkles,
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
import type { ApplicationRow, FollowUpReminderRow } from "@/types/database"

interface FollowUpsClientProps {
  userId: string
  usage: UsageSummary
  applications: ApplicationRow[]
  initialReminders: FollowUpReminderRow[]
  preselectedApplicationId?: string
}

export function FollowUpsClient({
  userId,
  usage,
  applications,
  initialReminders,
  preselectedApplicationId,
}: FollowUpsClientProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const eligibleApps = React.useMemo(
    () => applications.filter((a) => a.status === "no_reply"),
    [applications]
  )

  const [reminders, setReminders] =
    React.useState<FollowUpReminderRow[]>(initialReminders)
  const [selectedAppId, setSelectedAppId] = React.useState(
    preselectedApplicationId &&
      eligibleApps.some((a) => a.id === preselectedApplicationId)
      ? preselectedApplicationId
      : eligibleApps[0]?.id ?? ""
  )

  const defaultDueDate = React.useMemo(() => {
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return getDateKeyInTimezone(sevenDaysLater, usage.timezone)
  }, [usage.timezone])

  const [dueDate, setDueDate] = React.useState(defaultDueDate)
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] =
    React.useState<FollowUpReminderRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const [generatingForApp, setGeneratingForApp] = React.useState<ApplicationRow | null>(null)
  const [aiFollowUpDraft, setAiFollowUpDraft] = React.useState<{ subject: string; body: string } | null>(null)
  const [drafting, setDrafting] = React.useState(false)
  const followUpsUnlocked = true

  async function handleGenerateAiFollowUp(app: ApplicationRow) {
    setGeneratingForApp(app)
    setDrafting(true)
    try {
      const res = await fetch("/api/follow-ups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: "Candidate",
          company: app.company,
          jobTitle: app.job_title,
          applicationDate: app.application_date,
          stage: app.status,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiFollowUpDraft(data.email)
      } else {
        throw new Error("Failed to generate follow-up.")
      }
    } catch {
      setAiFollowUpDraft({
        subject: `Following up on ${app.job_title} application — Candidate`,
        body: `Hi Hiring Team at ${app.company},\n\nI am writing to politely follow up on my application for the ${app.job_title} position. I remain very enthusiastic about the opportunity to contribute to your engineering milestones.\n\nPlease let me know if there are any additional materials I can provide to assist in your review.\n\nBest regards,\nCandidate`,
      })
    } finally {
      setDrafting(false)
    }
  }

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAppId || !dueDate) {
      toast({
        title: "Select an application and due date",
        variant: "error",
      })
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from("follow_up_reminders")
      .insert({
        user_id: userId,
        application_id: selectedAppId,
        due_date: dueDate,
        note: note.trim() || null,
        completed: false,
      })
      .select("*")
      .single()
    setSaving(false)

    if (error || !data) {
      toast({
        title: "Failed to create follow-up reminder",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = data as FollowUpReminderRow
    setReminders((prev) => [saved, ...prev])
    setNote("")
    const app = applications.find((a) => a.id === selectedAppId)
    await logUserActivity(supabase, {
      userId,
      activityType: "follow_up_created",
      description: `Scheduled follow-up reminder${app ? ` for ${app.company}` : ""}`,
    })
    toast({ title: "Follow-up reminder added", variant: "success" })
    router.refresh()
  }

  async function handleToggleComplete(reminder: FollowUpReminderRow) {
    const nextCompleted = !reminder.completed
    const now = new Date().toISOString()
    const { error } = await supabase
      .from("follow_up_reminders")
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? now : null,
        updated_at: now,
      })
      .eq("id", reminder.id)
      .eq("user_id", userId)

    if (error) {
      toast({
        title: "Could not update reminder",
        description: error.message,
        variant: "error",
      })
      return
    }

    setReminders((prev) =>
      prev.map((item) =>
        item.id === reminder.id
          ? {
              ...item,
              completed: nextCompleted,
              completed_at: nextCompleted ? now : null,
            }
          : item
      )
    )
    toast({
      title: nextCompleted ? "Follow-up marked complete" : "Reminder reopened",
      variant: "success",
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from("follow_up_reminders")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", userId)
    setDeleting(false)

    if (error) {
      toast({
        title: "Failed to delete reminder",
        description: error.message,
        variant: "error",
      })
      return
    }

    setReminders((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast({ title: "Reminder deleted", variant: "success" })
  }

  const appById = new Map(applications.map((a) => [a.id, a]))

  // Only show reminders whose linked application is still awaiting reply (`no_reply`)
  const activeReminders = reminders.filter((rem) => {
    const app = appById.get(rem.application_id)
    return app && app.status === "no_reply" && !rem.completed
  })
  const completedOrStoppedReminders = reminders.filter((rem) => {
    const app = appById.get(rem.application_id)
    return rem.completed || !app || app.status !== "no_reply"
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Follow-ups
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track follow-up timing for unanswered applications. Follow-ups automatically stop when marked Rejected or Hired.
          </p>
        </div>
        <Badge variant="default" className="capitalize">
          {usage.plan === "pro" || usage.plan === "basic"
            ? "Advanced Follow-ups"
            : "Basic Follow-ups"}
        </Badge>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-foreground" />
        <p>
          Automated follow-up email sending requires explicit confirmation and a connected Gmail account (Coming Soon). Manual follow-up reminders track timing accurately today and stop automatically whenever an application is updated to Rejected or Hired.
        </p>
      </div>

      {!followUpsUnlocked ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Upgrade to Basic or Pro to manage Follow-ups
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Basic ($9/mo) unlocks follow-up reminders, and Pro ($19/mo) unlocks advanced follow-up workflows.
            </p>
            <Button
              className="mt-5"
              nativeButton={false}
              render={<Link href="/dashboard/subscription" />}
            >
              View Plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create Follow-up Reminder</CardTitle>
              <CardDescription>
                Only applications with status &ldquo;No Reply&rdquo; are eligible for follow-ups.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eligibleApps.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No unanswered applications right now.{" "}
                  <Link
                    href="/dashboard/applications"
                    className="font-medium text-primary hover:underline"
                  >
                    Log an application first →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCreateReminder} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="followup-app">Application</Label>
                      <Select
                        id="followup-app"
                        value={selectedAppId}
                        onChange={(e) => setSelectedAppId(e.target.value)}
                      >
                        {eligibleApps.map((app) => (
                          <option key={app.id} value={app.id}>
                            {app.company} — {app.job_title} (Applied{" "}
                            {app.application_date})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="followup-date">Follow-up Due Date</Label>
                      <Input
                        id="followup-date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="followup-note">Reminder Note</Label>
                    <Textarea
                      id="followup-note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Send polite check-in note to hiring manager..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <Plus className="size-4" />
                      {saving ? "Adding..." : "Schedule Reminder"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Pending Follow-ups ({activeReminders.length})
              </CardTitle>
              <CardDescription>
                Active reminders for applications awaiting a response
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BellRing className="size-8 text-muted-foreground/60" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    No active follow-up reminders
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeReminders.map((rem) => {
                    const app = appById.get(rem.application_id)
                    return (
                      <div
                        key={rem.id}
                        className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {app
                              ? `${app.job_title} at ${app.company}`
                              : "Application"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due {rem.due_date}
                            {rem.note ? ` · ${rem.note}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {app && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateAiFollowUp(app)}
                              className="text-xs gap-1.5"
                            >
                              <Sparkles className="size-3.5 text-primary" />
                              Draft AI Note
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleComplete(rem)}
                          >
                            <Circle className="size-3.5" />
                            Mark Done
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteTarget(rem)}
                            aria-label="Delete reminder"
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

          {completedOrStoppedReminders.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Completed & Stopped ({completedOrStoppedReminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {completedOrStoppedReminders.map((rem) => {
                  const app = appById.get(rem.application_id)
                  const stoppedByOutcome =
                    app && app.status !== "no_reply"
                      ? `Stopped (${app.status})`
                      : "Completed"

                  return (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          <p className="truncate text-sm font-medium text-foreground">
                            {app
                              ? `${app.job_title} at ${app.company}`
                              : "Application"}
                          </p>
                          <Badge variant="outline">{stoppedByOutcome}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Due {rem.due_date}
                          {rem.note ? ` · ${rem.note}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteTarget(rem)}
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete follow-up reminder?"
        description="This reminder will be removed permanently."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />

      {/* AI Follow-up Draft Dialog */}
      {generatingForApp && aiFollowUpDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Follow-up Message
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tailored for {generatingForApp.company} ({generatingForApp.job_title})
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setGeneratingForApp(null); setAiFollowUpDraft(null) }}>
                Close
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Subject</Label>
                <Input
                  value={aiFollowUpDraft.subject}
                  onChange={(e) => setAiFollowUpDraft({ ...aiFollowUpDraft, subject: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Email Body</Label>
                <Textarea
                  rows={6}
                  value={aiFollowUpDraft.body}
                  onChange={(e) => setAiFollowUpDraft({ ...aiFollowUpDraft, body: e.target.value })}
                  className="mt-1 text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">Review before sending.</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${aiFollowUpDraft.subject}\n\n${aiFollowUpDraft.body}`)
                    toast({ title: "Copied to clipboard", variant: "success" })
                  }}
                  className="text-xs"
                >
                  Copy Message
                </Button>
                <a
                  href={`mailto:${generatingForApp.contact_email || ""}?subject=${encodeURIComponent(aiFollowUpDraft.subject)}&body=${encodeURIComponent(aiFollowUpDraft.body)}`}
                >
                  <Button size="sm" className="text-xs">
                    Open in Mail
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
