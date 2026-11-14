"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Copy,
  Download,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import {
  RESUME_TEMPLATES,
  normalizeResumeContent,
} from "@/lib/resume/defaults"
import { downloadResumePdf } from "@/lib/resume/pdf-generator"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResumeUploadDialog } from "@/components/resume/resume-upload-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ResumeRow } from "@/types/database"

export function ResumesListClient({
  userId,
  initialResumes,
}: {
  userId: string
  initialResumes: ResumeRow[]
}) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [resumes, setResumes] = React.useState(initialResumes)
  const [deleteTarget, setDeleteTarget] = React.useState<ResumeRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  async function handleSetPrimary(resume: ResumeRow) {
    await supabase
      .from("resumes")
      .update({ is_primary: false })
      .eq("user_id", userId)

    const { error } = await supabase
      .from("resumes")
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq("id", resume.id)
      .eq("user_id", userId)

    if (error) {
      toast({
        title: "Failed to set primary resume",
        description: error.message,
        variant: "error",
      })
      return
    }

    setResumes((prev) =>
      prev.map((item) => ({
        ...item,
        is_primary: item.id === resume.id,
      }))
    )
    toast({ title: `"${resume.title}" set as primary`, variant: "success" })
    router.refresh()
  }

  async function handleDuplicate(resume: ResumeRow) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title: `${resume.title} (Copy)`,
        template: resume.template,
        content: normalizeResumeContent(resume.content),
        is_primary: false,
        updated_at: now,
      })
      .select("*")
      .single()

    if (error || !data) {
      toast({
        title: "Could not duplicate resume",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    setResumes((prev) => [data as ResumeRow, ...prev])
    await logUserActivity(supabase, {
      userId,
      activityType: "resume_duplicated",
      description: `Duplicated resume "${resume.title}"`,
    })
    toast({ title: "Resume duplicated", variant: "success" })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", deleteTarget.id)
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

    setResumes((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    toast({ title: "Resume deleted", variant: "success" })
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My Resumes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create ATS-friendly resumes, reorder sections, and export genuine selectable-text PDFs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ResumeUploadDialog
            userId={userId}
            buttonVariant="outline"
            buttonText="Upload Old Resume"
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/resumes/tailor" />}
          >
            <Sparkles className="size-4" />
            AI Resume Tailoring
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/resumes/new" />}
          >
            <Plus className="size-4" />
            New Resume
          </Button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="size-10 text-muted-foreground/60" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              No resumes yet
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create your first ATS-ready resume or upload an existing PDF/Word resume to extract your work history, education, and skills automatically.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <ResumeUploadDialog
                userId={userId}
                buttonVariant="default"
                buttonText="Upload Old Resume (PDF / Doc)"
              />
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/resumes/new" />}
              >
                <Plus className="size-4" />
                Start From Scratch
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resumes.map((resume) => {
            const templateMeta = RESUME_TEMPLATES.find(
              (tpl) => tpl.id === resume.template
            )
            return (
              <Card key={resume.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{resume.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {templateMeta?.name ?? resume.template} · Updated{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        }).format(new Date(resume.updated_at))}
                      </CardDescription>
                    </div>
                    {resume.is_primary ? (
                      <Badge>Primary</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/dashboard/resumes/${resume.id}`} />}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadResumePdf({
                        content: normalizeResumeContent(resume.content),
                        template: resume.template,
                        title: resume.title,
                      })
                    }
                  >
                    <Download className="size-3.5" />
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(resume)}
                  >
                    <Copy className="size-3.5" />
                    Duplicate
                  </Button>
                  {!resume.is_primary ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(resume)}
                    >
                      <Star className="size-3.5" />
                      Set Primary
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(resume)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete resume?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed.`
            : ""
        }
        confirmLabel="Delete Resume"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
