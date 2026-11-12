"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Lock,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import { normalizeResumeContent } from "@/lib/resume/defaults"
import { downloadResumePdf } from "@/lib/resume/pdf-generator"
import type { UsageSummary } from "@/lib/plans"
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
import { ResumePreview } from "@/components/resume/resume-preview"
import type {
  ResumeContent,
  ResumeRow,
  ResumeVersionRow,
} from "@/types/database"

interface TailorClientProps {
  userId: string
  usage: UsageSummary
  resumes: ResumeRow[]
  initialVersions: ResumeVersionRow[]
  preselectedResumeId?: string
}

export function TailorClient({
  userId,
  usage,
  resumes,
  initialVersions,
  preselectedResumeId,
}: TailorClientProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const defaultResume =
    resumes.find((r) => r.id === preselectedResumeId) ??
    resumes.find((r) => r.is_primary) ??
    resumes[0]

  const [selectedResumeId, setSelectedResumeId] = React.useState(
    defaultResume?.id ?? ""
  )
  const [jobTitle, setJobTitle] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [jobDescription, setJobDescription] = React.useState("")

  const [tailoring, setTailoring] = React.useState(false)
  const [savingVersion, setSavingVersion] = React.useState(false)
  const [tailorError, setTailorError] = React.useState<string | null>(null)
  const [tailoredContent, setTailoredContent] =
    React.useState<ResumeContent | null>(null)
  const [versions, setVersions] = React.useState(initialVersions)
  const [deleteTarget, setDeleteTarget] =
    React.useState<ResumeVersionRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedResumeId || !jobDescription.trim()) {
      toast({
        title: "Missing details",
        description: "Choose a resume and paste a job description first.",
        variant: "error",
      })
      return
    }

    setTailoring(true)
    setTailorError(null)
    try {
      const response = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobTitle,
          company,
          jobDescription,
        }),
      })
      const payload = (await response.json()) as {
        tailoredContent?: ResumeContent
        error?: string
      }

      if (!response.ok || !payload.tailoredContent) {
        const msg =
          payload.error ?? "Unable to generate tailored resume right now."
        setTailorError(msg)
        toast({
          title: "Tailoring paused",
          description: msg,
          variant: "error",
        })
        return
      }

      setTailoredContent(normalizeResumeContent(payload.tailoredContent))
      toast({
        title: "Tailored resume generated",
        description: "Review the preview below and save it when ready.",
        variant: "success",
      })
      router.refresh()
    } catch {
      const msg = "Network error while contacting the tailoring API."
      setTailorError(msg)
      toast({ title: "Request failed", description: msg, variant: "error" })
    } finally {
      setTailoring(false)
    }
  }

  async function handleSaveVersion() {
    if (!tailoredContent || !selectedResume) return
    setSavingVersion(true)
    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        user_id: userId,
        resume_id: selectedResume.id,
        job_title: jobTitle.trim() || null,
        company: company.trim() || null,
        job_description: jobDescription.trim(),
        content: tailoredContent,
      })
      .select("*")
      .single()

    setSavingVersion(false)
    if (error || !data) {
      toast({
        title: "Failed to save tailored version",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = data as ResumeVersionRow
    setVersions((prev) => [saved, ...prev])
    await logUserActivity(supabase, {
      userId,
      activityType: "resume_tailored_saved",
      description: `Saved tailored resume for ${jobTitle || "target role"}${company ? ` at ${company}` : ""}`,
      metadata: { resume_version_id: saved.id },
    })
    toast({ title: "Saved to tailored versions", variant: "success" })
    router.refresh()
  }

  async function handleDeleteVersion() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", userId)
    setDeleting(false)

    if (error) {
      toast({
        title: "Could not delete version",
        description: error.message,
        variant: "error",
      })
      return
    }
    setVersions((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast({ title: "Tailored version removed", variant: "success" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/resumes" />}
          >
            <ArrowLeft className="size-4" />
            My Resumes
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              AI Resume Tailoring
            </h1>
            <p className="text-sm text-muted-foreground">
              Tailor truthful phrasing and keyword alignment for a target job description.
            </p>
          </div>
        </div>
        <Badge variant={usage.aiTailoringEnabled ? "default" : "outline"}>
          {usage.aiTailoringEnabled
            ? `${usage.aiTailoringUsedToday}/${usage.aiTailoringDailyLimit} used today (soft limit)`
            : "Included on Basic & Pro"}
        </Badge>
      </div>

      {!usage.aiTailoringEnabled ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Upgrade to Basic or Pro for AI Resume Tailoring
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              The Free plan does not include AI resume tailoring. Basic ($9/mo) and Pro ($19/mo) include up to 20 tailored generations per day.
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
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Create at least one base resume before tailoring for a role.
            </p>
            <Button
              className="mt-4"
              nativeButton={false}
              render={<Link href="/dashboard/resumes/new" />}
            >
              Create Base Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-5">
            <CardHeader>
              <CardTitle>Target Job Details</CardTitle>
              <CardDescription>
                AI will never fabricate experience, companies, dates, or degrees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tailor-resume">Source Resume</Label>
                  <Select
                    id="tailor-resume"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                        {r.is_primary ? " (Primary)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tailor-job-title">Job Title</Label>
                    <Input
                      id="tailor-job-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Senior Product Engineer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tailor-company">Company</Label>
                    <Input
                      id="tailor-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Linear"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tailor-jd">Job Description *</Label>
                  <Textarea
                    id="tailor-jd"
                    rows={10}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    required
                  />
                </div>

                {tailorError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{tailorError}</span>
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={tailoring}>
                  <Sparkles className="size-4" />
                  {tailoring ? "Tailoring Resume..." : "Generate Tailored Resume"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4 xl:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {tailoredContent
                  ? "Tailored Output Preview"
                  : "Source Resume Preview"}
              </p>
              {tailoredContent && selectedResume ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadResumePdf({
                        content: tailoredContent,
                        template: selectedResume.template,
                        title: `${selectedResume.title}-${company || "tailored"}`,
                      })
                    }
                  >
                    <Download className="size-3.5" />
                    Download Tailored PDF
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingVersion}
                    onClick={handleSaveVersion}
                  >
                    <Save className="size-3.5" />
                    {savingVersion ? "Saving..." : "Save Tailored Version"}
                  </Button>
                </div>
              ) : null}
            </div>

            {selectedResume ? (
              <ResumePreview
                content={
                  tailoredContent ?? normalizeResumeContent(selectedResume.content)
                }
                template={selectedResume.template}
              />
            ) : null}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saved Tailored Versions</CardTitle>
          <CardDescription>
            Previously reviewed and saved job-specific resume versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tailored versions saved yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {ver.job_title || "Untitled Role"}
                      {ver.company ? ` at ${ver.company}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saved{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: usage.timezone || "UTC",
                      }).format(new Date(ver.created_at))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadResumePdf({
                          content: normalizeResumeContent(ver.content),
                          template: "modern-professional",
                          title: `${ver.company || "tailored"}-${ver.job_title || "resume"}`,
                        })
                      }
                    >
                      <Download className="size-3.5" />
                      Download PDF
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteTarget(ver)}
                      aria-label="Delete tailored version"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete tailored version?"
        description="This tailored resume snapshot will be permanently removed."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteVersion}
      />
    </div>
  )
}
