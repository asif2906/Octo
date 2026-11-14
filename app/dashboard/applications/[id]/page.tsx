import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { ApplicationDetailClient } from "@/components/applications/application-detail-client"
import type { ApplicationRow, ResumeRow, CoverLetterRow } from "@/types/database"

async function ApplicationDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>
}) {
  const { id } = await paramsPromise
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  const { data: appData, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .maybeSingle()

  if (appError || !appData) {
    notFound()
  }

  const application = appData as ApplicationRow

  // Fetch linked or primary resume
  let resume: ResumeRow | null = null
  if (application.resume_id) {
    const { data: resData } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", application.resume_id)
      .eq("user_id", ctx.user.id)
      .maybeSingle()
    resume = resData as ResumeRow | null
  }

  if (!resume) {
    // Fallback to primary resume or most recent
    const { data: primaryData } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("is_primary", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    resume = primaryData as ResumeRow | null
  }

  // Fetch linked cover letter
  let coverLetter: CoverLetterRow | null = null
  if (application.cover_letter_id) {
    const { data: clData } = await supabase
      .from("cover_letters")
      .select("*")
      .eq("id", application.cover_letter_id)
      .eq("user_id", ctx.user.id)
      .maybeSingle()
    coverLetter = clData as CoverLetterRow | null
  }

  if (!coverLetter && application.company) {
    const { data: clData } = await supabase
      .from("cover_letters")
      .select("*")
      .eq("user_id", ctx.user.id)
      .ilike("company", application.company)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    coverLetter = clData as CoverLetterRow | null
  }

  return (
    <ApplicationDetailClient
      application={application}
      resume={resume}
      coverLetter={coverLetter}
      userId={ctx.user.id}
    />
  )
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-44 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <ApplicationDetailContent paramsPromise={params} />
    </Suspense>
  )
}

