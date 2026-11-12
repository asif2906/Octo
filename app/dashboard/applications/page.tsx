import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { ApplicationsClient } from "@/components/applications/applications-client"
import type { ApplicationRow, ResumeRow } from "@/types/database"

async function ApplicationsPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let applications: ApplicationRow[] = []
  let resumes: Pick<ResumeRow, "id" | "title" | "is_primary">[] = []

  if (ctx.schemaReady) {
    const [appsRes, resumesRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("application_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("resumes")
        .select("id, title, is_primary")
        .eq("user_id", ctx.user.id)
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false }),
    ])

    applications = (appsRes.data as ApplicationRow[] | null) ?? []
    resumes =
      (resumesRes.data as Pick<ResumeRow, "id" | "title" | "is_primary">[] | null) ??
      []
  }

  return (
    <ApplicationsClient
      userId={ctx.user.id}
      usage={ctx.usage}
      initialApplications={applications}
      resumes={resumes}
    />
  )
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <ApplicationsPageContent />
    </Suspense>
  )
}

