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
  FileText,
  Upload,
  Plus,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  Palette,
  Eye,
  CheckCircle2,
  Sliders,
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
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResumeUploadDialog } from "@/components/resume/resume-upload-dialog"
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
  ResumeTemplateId,
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

  const [activeTab, setActiveTab] = React.useState<"tailor" | "base" | "versions">("tailor")
  const [showUploadModal, setShowUploadModal] = React.useState(false)

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

  // Conversational AI Refinement Chat state
  const [chatInstruction, setChatInstruction] = React.useState("")
  const [isRefining, setIsRefining] = React.useState(false)

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedResumeId || !jobDescription.trim()) {
      toast({
        title: "Missing details",
        description: "Choose a source resume and paste the target job description.",
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
        title: "Tailored resume generated!",
        description: "Review preview, refine with AI chat if needed, and save version.",
        variant: "success",
      })
      router.refresh()
    } catch {
      const msg = "Network error while contacting the central AI engine."
      setTailorError(msg)
      toast({ title: "Request failed", description: msg, variant: "error" })
    } finally {
      setTailoring(false)
    }
  }

  async function handleChatRefinement(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInstruction.trim() || !tailoredContent) return

    setIsRefining(true)
    try {
      const res = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobTitle,
          company,
          jobDescription: `${jobDescription}\n\nCandidate Refinement Directive: ${chatInstruction}`,
        }),
      })
      const data = await res.json()
      if (res.ok && data.tailoredContent) {
        setTailoredContent(normalizeResumeContent(data.tailoredContent))
        setChatInstruction("")
        toast({
          title: "Resume Refined!",
          description: "Applied your AI chat instruction to the tailored document.",
          variant: "success",
        })
      } else {
        throw new Error(data.error || "Failed to refine resume.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error refining"
      toast({ title: "Refinement failed", description: msg, variant: "error" })
    } finally {
      setIsRefining(false)
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Resume Workspace
            </h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
              Tailor & Themes
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your base resumes across 12 themes and generate truthful, job-specific tailored versions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ResumeUploadDialog
            userId={userId}
            buttonVariant="outline"
            buttonText="Upload Old Resume"
          />

          <Link href="/dashboard/resumes/new">
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Create Base Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("tailor")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "tailor"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tailor Resume
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("base")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "base"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          Base Resumes & 12 Themes ({resumes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("versions")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "versions"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Tailored Versions ({versions.length})
        </button>
      </div>

      {/* TAB 1: TAILOR RESUME */}
      {activeTab === "tailor" && (
        <div className="space-y-6">
          {resumes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-foreground font-semibold">
                  No Base Resume Found
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Create a base resume or upload an existing PDF/Word file to begin tailoring for target job descriptions.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <ResumeUploadDialog
                    userId={userId}
                    buttonVariant="outline"
                    buttonText="Upload File"
                  />
                  <Link href="/dashboard/resumes/new">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Create New
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-12">
              {/* Left Column: Target Inputs */}
              <Card className="xl:col-span-5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" /> Target Job Parameters
                  </CardTitle>
                  <CardDescription className="text-xs">
                    AI aligns your verified profile experience with vacancy keywords. Zero fabrication guarantee.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <Label htmlFor="tailor-resume" className="text-xs font-semibold">Source Resume</Label>
                      <select
                        id="tailor-resume"
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="tailor-job-title" className="text-xs font-semibold">Job Title</Label>
                        <Input
                          id="tailor-job-title"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Staff Full Stack Engineer"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="tailor-company" className="text-xs font-semibold">Company</Label>
                        <Input
                          id="tailor-company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Supabase"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tailor-jd" className="text-xs font-semibold">Job Description *</Label>
                      <Textarea
                        id="tailor-jd"
                        rows={8}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description here..."
                        required
                        className="text-xs leading-relaxed"
                      />
                    </div>

                    {tailorError ? (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <span>{tailorError}</span>
                      </div>
                    ) : null}

                    <Button type="submit" className="w-full gap-2 text-xs h-9 font-medium" disabled={tailoring}>
                      {tailoring ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      {tailoring ? "Analyzing & Tailoring Resume..." : "Generate AI Tailored Resume"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Right Column: Preview & Refinement Chat */}
              <div className="space-y-4 xl:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {tailoredContent ? "AI Tailored Resume Output" : "Source Resume Preview"}
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
                        className="text-xs h-8 gap-1.5"
                      >
                        <Download className="size-3.5" />
                        Download PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingVersion}
                        onClick={handleSaveVersion}
                        className="text-xs h-8 gap-1.5 font-medium"
                      >
                        <Save className="size-3.5" />
                        {savingVersion ? "Saving..." : "Save Version"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* AI Refinement Chat if Tailored Content exists */}
                {tailoredContent && (
                  <form onSubmit={handleChatRefinement} className="flex gap-2">
                    <Input
                      value={chatInstruction}
                      onChange={(e) => setChatInstruction(e.target.value)}
                      placeholder="Prompt AI: e.g. 'Make summary shorter', 'Emphasize React', 'Make bullets more technical'..."
                      className="text-xs h-9"
                    />
                    <Button type="submit" size="sm" disabled={isRefining || !chatInstruction.trim()} className="gap-1.5 text-xs h-9 shrink-0">
                      {isRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Refine
                    </Button>
                  </form>
                )}

                {selectedResume ? (
                  <ResumePreview
                    content={tailoredContent ?? normalizeResumeContent(selectedResume.content)}
                    template={selectedResume.template}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BASE RESUMES & 12 THEMES */}
      {activeTab === "base" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-xs hover:border-foreground/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {resume.title}
                      {resume.is_primary && (
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px]">
                          Primary
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      Theme: {resume.template}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {(resume.content as any)?.summary || "Full structured career resume."}
                </p>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <Link href={`/dashboard/resumes/${resume.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Edit Sections & Theme
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      downloadResumePdf({
                        content: normalizeResumeContent(resume.content),
                        template: resume.template,
                        title: resume.title,
                      })
                    }
                    className="h-7 text-xs gap-1"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TAILORED VERSIONS */}
      {activeTab === "versions" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Tailored Versions</CardTitle>
            <CardDescription className="text-xs">
              Review and restore previous job-specific tailored documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center italic">
                No tailored versions saved yet. Generate one in the Tailor tab.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex flex-col justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {ver.job_title || "Untitled Role"}
                        {ver.company ? ` at ${ver.company}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(ver.created_at).toLocaleDateString()}
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
                        className="text-xs h-8 gap-1.5"
                      >
                        <Download className="size-3.5" />
                        Download PDF
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(ver)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
