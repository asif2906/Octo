"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  Printer,
  Save,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import {
  SECTION_LABELS,
  normalizeResumeContent,
} from "@/lib/resume/defaults"
import { downloadResumePdf } from "@/lib/resume/pdf-generator"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PersonalInfoForm } from "@/components/resume/personal-info-form"
import { ExperienceForm } from "@/components/resume/experience-form"
import { EducationForm } from "@/components/resume/education-form"
import { SkillsForm } from "@/components/resume/skills-form"
import { ProjectsForm } from "@/components/resume/projects-form"
import { TemplateSelector } from "@/components/resume/template-selector"
import { ResumePreview } from "@/components/resume/resume-preview"
import type {
  ResumeContent,
  ResumeSectionKey,
  ResumeTemplateId,
} from "@/types/database"

interface ResumeEditorProps {
  userId: string
  resumeId?: string
  initialTitle: string
  initialTemplate: ResumeTemplateId
  initialIsPrimary: boolean
  initialContent: ResumeContent
}

export function ResumeEditor({
  userId,
  resumeId,
  initialTitle,
  initialTemplate,
  initialIsPrimary,
  initialContent,
}: ResumeEditorProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [title, setTitle] = React.useState(initialTitle)
  const [template, setTemplate] =
    React.useState<ResumeTemplateId>(initialTemplate)
  const [isPrimary, setIsPrimary] = React.useState(initialIsPrimary)
  const [content, setContent] = React.useState<ResumeContent>(() =>
    normalizeResumeContent(initialContent)
  )
  const [saving, setSaving] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  function moveSection(key: ResumeSectionKey, direction: -1 | 1) {
    setContent((prev) => {
      const idx = prev.sectionOrder.indexOf(key)
      const target = idx + direction
      if (idx === -1 || target < 0 || target >= prev.sectionOrder.length) {
        return prev
      }
      const nextOrder = [...prev.sectionOrder]
      const [removed] = nextOrder.splice(idx, 1)
      nextOrder.splice(target, 0, removed)
      return { ...prev, sectionOrder: nextOrder }
    })
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    if (!title.trim()) {
      toast({
        title: "Resume title is required",
        variant: "error",
      })
      return
    }

    setSaving(true)

    if (isPrimary) {
      await supabase
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", userId)
    }

    const now = new Date().toISOString()

    if (resumeId) {
      const { error } = await supabase
        .from("resumes")
        .update({
          title: title.trim(),
          template,
          is_primary: isPrimary,
          content,
          updated_at: now,
        })
        .eq("id", resumeId)
        .eq("user_id", userId)

      setSaving(false)
      if (error) {
        toast({
          title: "Could not save resume",
          description: error.message,
          variant: "error",
        })
        return
      }

      await logUserActivity(supabase, {
        userId,
        activityType: "resume_updated",
        description: `Updated resume "${title.trim()}"`,
        metadata: { resume_id: resumeId },
      })
      toast({ title: "Resume saved", variant: "success" })
      router.refresh()
    } else {
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          title: title.trim(),
          template,
          is_primary: isPrimary,
          content,
          updated_at: now,
        })
        .select("id")
        .single()

      setSaving(false)
      if (error || !data) {
        toast({
          title: "Could not create resume",
          description: error?.message ?? "Please try again.",
          variant: "error",
        })
        return
      }

      await logUserActivity(supabase, {
        userId,
        activityType: "resume_created",
        description: `Created resume "${title.trim()}"`,
        metadata: { resume_id: data.id },
      })
      toast({ title: "Resume created", variant: "success" })
      router.push(`/dashboard/resumes/${data.id}`)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!resumeId) return
    setDeleting(true)
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", userId)
    setDeleting(false)

    if (error) {
      toast({
        title: "Failed to delete resume",
        description: error.message,
        variant: "error",
      })
      return
    }

    await logUserActivity(supabase, {
      userId,
      activityType: "resume_deleted",
      description: `Deleted resume "${title}"`,
    })
    toast({ title: "Resume deleted", variant: "success" })
    router.push("/dashboard/resumes")
    router.refresh()
  }

  function handleDownloadPdf() {
    try {
      downloadResumePdf({
        content,
        template,
        title: title || "octo-resume",
      })
      toast({
        title: "PDF downloaded",
        description: "Generated with selectable text and clean ATS layout.",
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "PDF export failed",
        description:
          err instanceof Error ? err.message : "Could not generate PDF file.",
        variant: "error",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/resumes" />}
          >
            <ArrowLeft className="size-4" />
            All Resumes
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {resumeId ? "Edit Resume" : "Create Resume"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Build an ATS-friendly resume and download a clean text-selectable PDF
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {resumeId ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/dashboard/resumes/tailor?resumeId=${resumeId}`} />
              }
            >
              <Sparkles className="size-3.5" />
              Tailor with AI
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5" />
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
          >
            <Download className="size-3.5" />
            Download PDF
          </Button>
          {resumeId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          ) : null}
          <Button type="button" size="sm" disabled={saving} onClick={() => handleSave()}>
            <Save className="size-3.5" />
            {saving ? "Saving..." : resumeId ? "Save Changes" : "Save Resume"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <form
          onSubmit={handleSave}
          className="space-y-6 xl:col-span-6 print:hidden"
        >
          <Card>
            <CardHeader>
              <CardTitle>Resume Settings & Template</CardTitle>
              <CardDescription>
                Give this resume a recognizable title and choose an ATS template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="resume-title">Resume Title *</Label>
                  <Input
                    id="resume-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Software Engineer — Primary"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant={isPrimary ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPrimary((v) => !v)}
                >
                  <Star className="size-3.5" />
                  {isPrimary ? "Primary Resume" : "Set as Primary"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>ATS Template</Label>
                <TemplateSelector value={template} onChange={setTemplate} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Details & Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm
                value={content.personalInfo}
                onChange={(personalInfo) =>
                  setContent((prev) => ({ ...prev, personalInfo }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section Order</CardTitle>
              <CardDescription>
                Reorder sections in both live preview and exported PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.sectionOrder.map((key, idx) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {SECTION_LABELS[key]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={idx === 0}
                      onClick={() => moveSection(key, -1)}
                      aria-label={`Move ${SECTION_LABELS[key]} up`}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={idx === content.sectionOrder.length - 1}
                      onClick={() => moveSection(key, 1)}
                      aria-label={`Move ${SECTION_LABELS[key]} down`}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <ExperienceForm
                items={content.experience}
                onChange={(experience) =>
                  setContent((prev) => ({ ...prev, experience }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <EducationForm
                items={content.education}
                onChange={(education) =>
                  setContent((prev) => ({ ...prev, education }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillsForm
                items={content.skills}
                onChange={(skills) =>
                  setContent((prev) => ({ ...prev, skills }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectsForm
                items={content.projects}
                onChange={(projects) =>
                  setContent((prev) => ({ ...prev, projects }))
                }
              />
            </CardContent>
          </Card>
        </form>

        <div className="xl:col-span-6">
          <div className="xl:sticky xl:top-20">
            <div className="mb-3 flex items-center justify-between print:hidden">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Live ATS Preview
              </p>
              <span className="text-xs text-muted-foreground">
                US Letter · Selectable Text PDF
              </span>
            </div>
            <ResumePreview content={content} template={template} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this resume?"
        description={`"${title}" will be permanently deleted. Applications referencing it will remain in your tracker.`}
        confirmLabel="Delete Resume"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
