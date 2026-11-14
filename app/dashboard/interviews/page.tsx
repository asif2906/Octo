import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { createClient } from "@/lib/supabase/server"
import { InterviewsClient } from "@/components/interviews/interviews-client"
import type { InterviewRow } from "@/types/database"

async function InterviewsPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let initialInterviews: InterviewRow[] = []
  let candidateSkills: string[] = []

  if (ctx.schemaReady) {
    const [intRes, skillRes] = await Promise.all([
      supabase
        .from("interviews")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("interview_date", { ascending: true }),
      supabase
        .from("skills")
        .select("skill_name")
        .eq("user_id", ctx.user.id),
    ])

    initialInterviews = (intRes.data as InterviewRow[] | null) ?? []
    candidateSkills = (skillRes.data || []).map((s: any) => s.skill_name).filter(Boolean)
  }

  return (
    <InterviewsClient
      initialInterviews={initialInterviews}
      candidateSkills={candidateSkills}
      userId={ctx.user.id}
    />
  )
}

export default function InterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <InterviewsPageContent />
    </Suspense>
  )
}

