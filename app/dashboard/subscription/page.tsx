import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { SubscriptionView } from "@/components/subscription/subscription-view"
import { createClient } from "@/lib/supabase/server"
import type { PaymentHistoryRow } from "@/types/database"

async function SubscriptionPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from("payment_history")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <SubscriptionView
      subscription={ctx.subscription}
      usage={ctx.usage}
      paymentHistory={(payments as PaymentHistoryRow[] | null) ?? []}
    />
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
