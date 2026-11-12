import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentApplications } from "@/components/dashboard/recent-applications"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { UsageOverview } from "@/components/dashboard/usage-overview"
import type { ActivityLogRow, ApplicationRow, ResumeRow } from "@/types/database"

async function OverviewContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let applications: ApplicationRow[] = []
  let activityLogs: ActivityLogRow[] = []
  let resumes: Pick<ResumeRow, "id" | "is_primary">[] = []

  if (ctx.schemaReady) {
    const [appsRes, logsRes, resumesRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("application_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("resumes")
        .select("id, is_primary")
        .eq("user_id", ctx.user.id)
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false }),
    ])

    applications = (appsRes.data as ApplicationRow[] | null) ?? []
    activityLogs = (logsRes.data as ActivityLogRow[] | null) ?? []
    resumes =
      (resumesRes.data as Pick<ResumeRow, "id" | "is_primary">[] | null) ?? []
  }

  const totalApplications = applications.length
  const pendingReplies = applications.filter(
    (app) => app.status === "no_reply"
  ).length
  const rejections = applications.filter(
    (app) => app.status === "rejected"
  ).length
  const hires = applications.filter((app) => app.status === "hired").length
  const primaryResumeId =
    resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? null
  const hasProfileBasics = Boolean(
    ctx.profile.full_name?.trim() && ctx.profile.headline?.trim()
  )

  return (
    <div className="space-y-6">
      <WelcomeSection
        fullName={ctx.profile.full_name}
        email={ctx.user.email ?? ctx.profile.email ?? ""}
        primaryResumeId={primaryResumeId}
        hasProfileBasics={hasProfileBasics}
      />

      <StatsCards
        totalApplications={totalApplications}
        pendingReplies={pendingReplies}
        rejections={rejections}
        hires={hires}
        usage={ctx.usage}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentApplications applications={applications.slice(0, 6)} />
          <RecentActivity logs={activityLogs} />
        </div>
        <div className="space-y-6">
          <UsageOverview usage={ctx.usage} />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-52 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
        </div>
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
