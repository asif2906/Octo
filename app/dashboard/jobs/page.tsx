import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { createClient } from "@/lib/supabase/server"
import { fetchHackerNewsJobs, CURATED_STARTUPS } from "@/lib/jobs/catalog"
import { JobsClient } from "@/components/jobs/jobs-client"
import type { SkillRow, SavedJobRow } from "@/types/database"

async function JobsPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  // 1. Get user skills for compatibility scoring
  let candidateSkills: string[] = []
  if (ctx.schemaReady) {
    const { data: skills } = await supabase
      .from("skills")
      .select("skill_name")
      .eq("user_id", ctx.user.id)

    candidateSkills = (skills || []).map((s: any) => s.skill_name).filter(Boolean)
  }

  // 2. Fetch jobs from zero-cost sources
  const hnJobs = await fetchHackerNewsJobs()
  const combinedJobs = [...CURATED_STARTUPS, ...hnJobs]

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
    />
  )
}

export default function JobsPage() {
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
      <JobsPageContent />
    </Suspense>
  )
}
