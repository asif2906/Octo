import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { ResumesListClient } from "@/components/resume/resumes-list-client"
import type { ResumeRow } from "@/types/database"

async function ResumesListContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let resumes: ResumeRow[] = []
  if (ctx.schemaReady) {
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("is_primary", { ascending: false })
      .order("updated_at", { ascending: false })
    resumes = (data as ResumeRow[] | null) ?? []
  }

  return <ResumesListClient userId={ctx.user.id} initialResumes={resumes} />
}

export default function ResumesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <ResumesListContent />
    </Suspense>
  )
}

