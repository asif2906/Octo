import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { AutoApplyClient } from "@/components/automation/auto-apply-client"
import type { ApplicationRow, ResumeRow } from "@/types/database"

async function AutoApplyContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let resumes: Pick<ResumeRow, "id" | "title" | "is_primary">[] = []
  let applications: ApplicationRow[] = []
  let candidateSkills: string[] = []
  let initialConfig = null
  let initialManualItems: Array<{
    id: string
    job_title: string
    company: string
    apply_url?: string
    notes?: string
    created_at: string
  }> = []
  let initialAvailableJobs: Array<{
    id: string
    title: string
    company: string
    location?: string
    apply_url?: string
    skills_required?: string[]
  }> = []

  if (ctx.schemaReady) {
    const [resumesRes, appsRes, skillsRes, configRes, manualRes, jobsRes] =
      await Promise.all([
        supabase
          .from("resumes")
          .select("id, title, is_primary")
          .eq("user_id", ctx.user.id)
          .order("is_primary", { ascending: false }),
        supabase
          .from("applications")
          .select("*")
          .eq("user_id", ctx.user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("skills")
          .select("name")
          .eq("user_id", ctx.user.id),
        supabase
          .from("auto_apply_configurations")
          .select("*")
          .eq("user_id", ctx.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("auto_apply_run_items")
          .select("id, job_title, company, apply_url, notes, created_at")
          .eq("user_id", ctx.user.id)
          .eq("status", "needs_manual_action")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("job_postings")
          .select("id, title, company, location, apply_url, skills_required")
          .order("posted_at", { ascending: false })
          .limit(20),
      ])

    resumes =
      (resumesRes.data as Pick<ResumeRow, "id" | "title" | "is_primary">[] | null) ?? []
    applications = (appsRes.data as ApplicationRow[] | null) ?? []
    candidateSkills = (skillsRes.data ?? []).map((s: { name: string }) => s.name)
    initialConfig = configRes.data || null
    initialManualItems = manualRes.data || []
    initialAvailableJobs = jobsRes.data || []
  }

  return (
    <AutoApplyClient
      userId={ctx.user.id}
      usage={ctx.usage}
      resumes={resumes}
      recentApplications={applications}
      candidateSkills={candidateSkills}
      initialConfig={initialConfig}
      initialManualItems={initialManualItems}
      initialAvailableJobs={initialAvailableJobs}
    />
  )
}

export default function AutoApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <AutoApplyContent />
    </Suspense>
  )
}
