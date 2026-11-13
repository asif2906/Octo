import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SubscriptionRow } from "@/types/database"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { authenticated: false, hasActiveSubscription: false, subscription: null },
        { status: 401 }
      )
    }

    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Failed to query subscription status:", error)
      return NextResponse.json(
        { error: "Failed to query subscription status" },
        { status: 500 }
      )
    }

    const subscription = sub as SubscriptionRow | null
    const now = new Date()

    let hasActiveSubscription = false
    if (subscription) {
      if (subscription.status === "active") {
        hasActiveSubscription = true
      } else if (
        subscription.status === "cancelled" &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) > now
      ) {
        hasActiveSubscription = true
      }
    }

    return NextResponse.json({
      authenticated: true,
      hasActiveSubscription,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            billingInterval: subscription.billing_interval,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            cancelledAt: subscription.cancelled_at,
            dodoCustomerId: subscription.dodo_customer_id,
            dodoSubscriptionId: subscription.dodo_subscription_id,
          }
        : null,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal status check failure"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

