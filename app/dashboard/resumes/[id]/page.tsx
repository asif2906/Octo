import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { normalizeResumeContent } from "@/lib/resume/defaults"
import { ResumeEditor } from "@/components/resume/resume-editor"
import type { ResumeRow } from "@/types/database"

async function EditResumeContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>
}) {
  const { id } = await paramsPromise
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .maybeSingle()

  const resume = data as ResumeRow | null
  if (!resume) {
    notFound()
  }

  return (
    <ResumeEditor
      userId={ctx.user.id}
      resumeId={resume.id}
      initialTitle={resume.title}
      initialTemplate={resume.template}
      initialIsPrimary={resume.is_primary}
      initialContent={normalizeResumeContent(resume.content)}
    />
  )
}

export default function EditResumePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-14 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <EditResumeContent paramsPromise={params} />
    </Suspense>
  )
}

