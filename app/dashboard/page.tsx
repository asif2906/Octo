import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { DossierDashboard } from "@/components/dashboard/dossier-dashboard"
import type { ApplicationRow, InterviewRow, SavedJobRow, ResumeRow } from "@/types/database"

async function OverviewContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let applications: ApplicationRow[] = []
  let interviews: InterviewRow[] = []
  let savedJobs: SavedJobRow[] = []
  let resumes: Pick<ResumeRow, "id" | "title" | "is_primary">[] = []

  if (ctx.schemaReady) {
    const [appsRes, intRes, savedRes, resumesRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("interviews")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("interview_date", { ascending: true }),
      supabase
        .from("saved_jobs")
        .select("*, job_postings(*)")
        .eq("user_id", ctx.user.id)
        .eq("status", "saved")
        .order("created_at", { ascending: false }),
      supabase
        .from("resumes")
        .select("id, title, is_primary")
        .eq("user_id", ctx.user.id)
        .order("is_primary", { ascending: false }),
    ])

    applications = (appsRes.data as ApplicationRow[] | null) ?? []
    interviews = (intRes.data as InterviewRow[] | null) ?? []
    savedJobs = (savedRes.data as SavedJobRow[] | null) ?? []
    resumes = (resumesRes.data as Pick<ResumeRow, "id" | "title" | "is_primary">[] | null) ?? []
  }

  return (
    <DossierDashboard
      applications={applications}
      interviews={interviews}
      savedJobs={savedJobs}
      candidateName={ctx.profile.full_name || ctx.user.email?.split("@")[0] || "Candidate"}
      userId={ctx.user.id}
      resumes={resumes}
    />
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div key={idx} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-96 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  )
}

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewContent />
    </Suspense>
  )
}
