import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { SettingsClient } from "@/components/settings/settings-client"

async function SettingsContent() {
  const ctx = await getDashboardContext()
  return (
    <SettingsClient
      email={ctx.user.email ?? ctx.profile.email ?? ""}
      profile={ctx.profile}
    />
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-44 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}

