import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getDodoClient } from "@/lib/dodo/client"
import { getPlanFromProductId } from "@/lib/plans"
import type { BillingInterval, SubscriptionPlan, SubscriptionRow } from "@/types/database"

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

    let subscription = sub as SubscriptionRow | null
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

    // Active Reconcile Fallback: If not active in database, check Dodo Payments directly
    if (!hasActiveSubscription) {
      try {
        const dodo = getDodoClient()
        const userEmail = user.email?.toLowerCase().trim()
        const dodoSubs = await dodo.subscriptions.list()
        const items = dodoSubs.items || (dodoSubs as any).body?.items || []

        const activeItem = items.find((item: any) => {
          const itemEmail = item.customer?.email?.toLowerCase().trim()
          const itemUserId = item.metadata?.user_id || item.metadata?.userId
          return (
            (itemEmail === userEmail || itemUserId === user.id) &&
            item.status === "active"
          )
        })

        if (activeItem) {
          console.log("[Status Reconcile] Found active subscription in Dodo:", activeItem.subscription_id)
          const admin = getSupabaseAdmin()
          const planInfo = activeItem.product_id ? getPlanFromProductId(activeItem.product_id) : null
          const mappedPlan: SubscriptionPlan =
            planInfo?.plan ?? (activeItem.metadata?.plan as SubscriptionPlan) ?? "basic"
          const mappedInterval: BillingInterval =
            planInfo?.interval ?? (activeItem.metadata?.interval as BillingInterval) ?? "monthly"

          await admin.rpc("sync_dodo_subscription", {
            p_user_id: user.id,
            p_customer_id: activeItem.customer?.customer_id ?? null,
            p_subscription_id: activeItem.subscription_id,
            p_product_id: activeItem.product_id,
            p_plan: mappedPlan,
            p_interval: mappedInterval,
            p_status: "active",
            p_current_period_start: activeItem.previous_billing_date || activeItem.created_at,
            p_current_period_end: activeItem.next_billing_date,
            p_cancel_at_period_end: activeItem.cancel_at_next_billing_date ?? false,
          })

          hasActiveSubscription = true
          subscription = {
            id: subscription?.id ?? "",
            user_id: user.id,
            plan: mappedPlan,
            status: "active",
            billing_interval: mappedInterval,
            current_period_start: activeItem.previous_billing_date || activeItem.created_at,
            current_period_end: activeItem.next_billing_date,
            cancel_at_period_end: activeItem.cancel_at_next_billing_date ?? false,
            cancelled_at: null,
            dodo_customer_id: activeItem.customer?.customer_id ?? null,
            dodo_subscription_id: activeItem.subscription_id,
            dodo_product_id: activeItem.product_id,
            created_at: activeItem.created_at,
            updated_at: new Date().toISOString(),
          } as SubscriptionRow
        }
      } catch (dodoErr) {
        console.warn("[Status Reconcile] Dodo active check skipped:", dodoErr)
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

