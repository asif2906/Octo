import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { createClient } from "@/lib/supabase/server"
import { AgentClient } from "@/components/agent/agent-client"
import type { JobSearchRow } from "@/types/database"

async function AgentPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let searches: JobSearchRow[] = []
  let candidateSkills: string[] = []

  if (ctx.schemaReady) {
    const [searchesRes, skillsRes] = await Promise.all([
      supabase
        .from("job_searches")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("skills")
        .select("skill_name")
        .eq("user_id", ctx.user.id),
    ])

    searches = (searchesRes.data as JobSearchRow[] | null) ?? []
    candidateSkills = (skillsRes.data || []).map((s: any) => s.skill_name).filter(Boolean)
  }

  return (
    <AgentClient
      initialSearches={searches}
      candidateSkills={candidateSkills}
      userId={ctx.user.id}
    />
  )
}

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <AgentPageContent />
    </Suspense>
  )
}
