import { NextResponse, type NextRequest } from "next/server"
import { getDodoClient } from "@/lib/dodo/client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getPlanFromProductId } from "@/lib/plans"
import type { BillingInterval, SubscriptionPlan, SubscriptionStatus } from "@/types/database"

interface DodoSubscriptionData {
  subscription_id?: string
  customer_id?: string
  product_id?: string
  status?: string
  current_period_start?: string
  current_period_end?: string
  cancelled_at?: string
  cancel_at_period_end?: boolean
  metadata?: Record<string, string>
}

interface DodoPaymentData {
  payment_id?: string
  subscription_id?: string
  customer_id?: string
  total_amount?: number
  currency?: string
  status?: string
  payment_method_type?: string
  metadata?: Record<string, string>
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const headers = {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    }

    if (!headers["webhook-id"] || !headers["webhook-signature"]) {
      return NextResponse.json(
        { error: "Missing required Dodo webhook signature headers." },
        { status: 401 }
      )
    }

    const dodo = getDodoClient()

    let event: any
    try {
      event = dodo.webhooks.unwrap(rawBody, { headers })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid signature"
      console.error("Dodo webhook signature verification failed:", msg)
      return NextResponse.json(
        { error: `Webhook verification failed: ${msg}` },
        { status: 401 }
      )
    }

    const webhookId = headers["webhook-id"]
    const eventType: string = event.type || event.event_type || ""
    const eventData: any = event.data || {}

    const admin = getSupabaseAdmin()

    // 1. Idempotency Check
    const { data: existingEvent } = await admin
      .from("dodo_webhook_events")
      .select("id, processed")
      .eq("webhook_id", webhookId)
      .maybeSingle()

    if (existingEvent?.processed) {
      return NextResponse.json(
        { message: "Webhook event already processed." },
        { status: 200 }
      )
    }

    // Record webhook reception
    if (!existingEvent) {
      await admin.from("dodo_webhook_events").insert({
        webhook_id: webhookId,
        event_type: eventType,
        processed: false,
      })
    }

    // 2. Process Subscription Events
    if (eventType.startsWith("subscription.")) {
      const sub = eventData as DodoSubscriptionData
      const subscriptionId = sub.subscription_id
      const customerId = sub.customer_id
      const productId = sub.product_id

      let userId = sub.metadata?.user_id

      // If user_id is missing from metadata, lookup by existing dodo_customer_id or subscription_id
      if (!userId && customerId) {
        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("dodo_customer_id", customerId)
          .maybeSingle()
        userId = existingSub?.user_id
      }

      if (!userId && subscriptionId) {
        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("dodo_subscription_id", subscriptionId)
          .maybeSingle()
        userId = existingSub?.user_id
      }

      if (userId) {
        const planInfo = productId ? getPlanFromProductId(productId) : null
        const mappedPlan: SubscriptionPlan | null =
          planInfo?.plan ??
          (sub.metadata?.plan as SubscriptionPlan) ??
          null

        const mappedInterval: BillingInterval | null =
          planInfo?.interval ??
          (sub.metadata?.interval as BillingInterval) ??
          null

        let status: SubscriptionStatus = "active"

        switch (eventType) {
          case "subscription.active":
          case "subscription.renewed":
            status = "active"
            break
          case "subscription.cancelled":
            status = "cancelled"
            break
          case "subscription.expired":
            status = "expired"
            break
          case "subscription.on_hold":
            status = "on_hold"
            break
          case "subscription.past_due":
            status = "past_due"
            break
          case "subscription.paused":
            status = "paused"
            break
          default:
            status = (sub.status as SubscriptionStatus) || "active"
        }

        const now = new Date().toISOString()

        const updatePayload: Record<string, any> = {
          dodo_customer_id: customerId || null,
          dodo_subscription_id: subscriptionId || null,
          dodo_product_id: productId || null,
          status,
          updated_at: now,
        }

        if (mappedPlan) updatePayload.plan = mappedPlan
        if (mappedInterval) updatePayload.billing_interval = mappedInterval
        if (sub.current_period_start)
          updatePayload.current_period_start = sub.current_period_start
        if (sub.current_period_end)
          updatePayload.current_period_end = sub.current_period_end
        if (typeof sub.cancel_at_period_end === "boolean")
          updatePayload.cancel_at_period_end = sub.cancel_at_period_end
        if (sub.cancelled_at) updatePayload.cancelled_at = sub.cancelled_at

        await admin
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              ...updatePayload,
            },
            { onConflict: "user_id" }
          )

        // Activity log
        await admin.from("activity_logs").insert({
          user_id: userId,
          activity_type: `billing_${eventType.replace(".", "_")}`,
          description: `Subscription ${status}: ${mappedPlan ? mappedPlan.toUpperCase() : "plan updated"}`,
          metadata: {
            dodo_subscription_id: subscriptionId,
            event_type: eventType,
          },
        })
      }
    }

    // 3. Process Payment Events (payment.succeeded, payment.failed)
    if (eventType.startsWith("payment.")) {
      const pay = eventData as DodoPaymentData
      const paymentId = pay.payment_id
      const subscriptionId = pay.subscription_id
      const customerId = pay.customer_id
      let userId = pay.metadata?.user_id

      if (!userId && customerId) {
        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("dodo_customer_id", customerId)
          .maybeSingle()
        userId = existingSub?.user_id
      }

      if (userId && paymentId) {
        await admin.from("payment_history").upsert(
          {
            user_id: userId,
            dodo_payment_id: paymentId,
            dodo_subscription_id: subscriptionId || null,
            amount: (pay.total_amount ?? 0) / 100, // Dodo amount in cents
            currency: pay.currency || "USD",
            payment_status: eventType === "payment.succeeded" ? "succeeded" : "failed",
            payment_type: pay.payment_method_type || null,
          },
          { onConflict: "dodo_payment_id" }
        )
      }
    }

    // Mark event as processed
    await admin
      .from("dodo_webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("webhook_id", webhookId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("Dodo webhook processing error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

