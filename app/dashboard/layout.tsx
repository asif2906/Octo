import { Suspense } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getDashboardContext } from "@/lib/dashboard/data"

async function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getDashboardContext()

  return (
    <DashboardShell
      fullName={ctx.profile.full_name}
      email={ctx.user.email ?? ctx.profile.email ?? ""}
      usage={ctx.usage}
      schemaReady={ctx.schemaReady}
    >
      {children}
    </DashboardShell>
  )
}

function DashboardLayoutFallback() {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background p-5 lg:block">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-9 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </aside>
      <div className="flex-1">
        <div className="h-16 border-b border-border bg-background px-6" />
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}

