import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { SubscriptionView } from "@/components/subscription/subscription-view"

async function SubscriptionPageContent() {
  const ctx = await getDashboardContext()
  return (
    <SubscriptionView subscription={ctx.subscription} usage={ctx.usage} />
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-52 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <SubscriptionPageContent />
    </Suspense>
  )
}

