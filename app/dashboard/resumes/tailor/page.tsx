import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { TailorClient } from "@/components/resume/tailor-client"
import type { ResumeRow, ResumeVersionRow } from "@/types/database"

async function TailorPageContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ resumeId?: string }>
}) {
  const [{ resumeId }, ctx] = await Promise.all([
    searchParamsPromise,
    getDashboardContext(),
  ])
  const supabase = await createClient()

  let resumes: ResumeRow[] = []
  let versions: ResumeVersionRow[] = []

  if (ctx.schemaReady) {
    const [resumesRes, versionsRes] = await Promise.all([
      supabase
        .from("resumes")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase
        .from("resume_versions")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
    ])
    resumes = (resumesRes.data as ResumeRow[] | null) ?? []
    versions = (versionsRes.data as ResumeVersionRow[] | null) ?? []
  }

  return (
    <TailorClient
      userId={ctx.user.id}
      usage={ctx.usage}
      resumes={resumes}
      initialVersions={versions}
      preselectedResumeId={resumeId}
    />
  )
}

export default function TailorResumePage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId?: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-72 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <TailorPageContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

