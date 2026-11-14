import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { createClient } from "@/lib/supabase/server"
import { discoverAllPublicJobs } from "@/lib/jobs/catalog"
import { JobsClient } from "@/components/jobs/jobs-client"
import type { JobSearchRow } from "@/types/database"

async function JobsPageContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ tab?: string }>
}) {
  const [{ tab }, ctx] = await Promise.all([
    searchParamsPromise,
    getDashboardContext(),
  ])
  const supabase = await createClient()

  // 1. Get user skills for compatibility scoring
  let candidateSkills: string[] = []
  let savedSearches: JobSearchRow[] = []

  if (ctx.schemaReady) {
    const [skillsRes, searchesRes] = await Promise.all([
      supabase
        .from("skills")
        .select("skill_name")
        .eq("user_id", ctx.user.id),
      supabase
        .from("job_searches")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
    ])

    candidateSkills = (skillsRes.data || []).map((s: any) => s.skill_name).filter(Boolean)
    savedSearches = (searchesRes.data as JobSearchRow[] | null) ?? []
  }

  // 2. Fetch jobs from zero-cost public sources (Greenhouse, Lever, RemoteOK, HN, Curated Startups)
  const combinedJobs = await discoverAllPublicJobs()

  // 3. Get user's saved job IDs
  let savedExternalIds: string[] = []
  if (ctx.schemaReady) {
    const { data: saved } = await supabase
      .from("saved_jobs")
      .select("job_posting_id, job_postings(external_id)")
      .eq("user_id", ctx.user.id)

    savedExternalIds = (saved || [])
      .map((s: any) => s.job_postings?.external_id)
      .filter(Boolean)
  }

  return (
    <JobsClient
      initialJobs={combinedJobs}
      candidateSkills={candidateSkills}
      savedJobIds={savedExternalIds}
      userId={ctx.user.id}
      savedSearches={savedSearches}
      isPro={ctx.usage.plan === "pro"}
      initialTab={tab || "search"}
    />
  )
}

export default function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <JobsPageContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}
