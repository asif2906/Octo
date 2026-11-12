import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { FollowUpsClient } from "@/components/follow-ups/follow-ups-client"
import type { ApplicationRow, FollowUpReminderRow } from "@/types/database"

async function FollowUpsPageContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ applicationId?: string }>
}) {
  const [{ applicationId }, ctx] = await Promise.all([
    searchParamsPromise,
    getDashboardContext(),
  ])
  const supabase = await createClient()

  let applications: ApplicationRow[] = []
  let reminders: FollowUpReminderRow[] = []

  if (ctx.schemaReady) {
    const [appsRes, remRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("application_date", { ascending: false }),
      supabase
        .from("follow_up_reminders")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("due_date", { ascending: true }),
    ])

    applications = (appsRes.data as ApplicationRow[] | null) ?? []
    reminders = (remRes.data as FollowUpReminderRow[] | null) ?? []
  }

  return (
    <FollowUpsClient
      userId={ctx.user.id}
      usage={ctx.usage}
      applications={applications}
      initialReminders={reminders}
      preselectedApplicationId={applicationId}
    />
  )
}

export default function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <FollowUpsPageContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

