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
      console.warn("[Dodo Webhook] Rejected: Missing required signature headers")
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
      console.error("[Dodo Webhook] Signature verification failed:", msg)
      return NextResponse.json(
        { error: `Webhook verification failed: ${msg}` },
        { status: 401 }
      )
    }

    const webhookId = headers["webhook-id"]
    const eventType: string = event.type || event.event_type || ""
    const eventData: any = event.data || {}

    console.log(`[Dodo Webhook] Received verified event: ${eventType} (ID: ${webhookId})`)

    const admin = getSupabaseAdmin()

    // 1. Idempotency Check via RPC
    const { data: canProcess, error: idempotencyError } = await admin.rpc(
      "record_dodo_webhook_event",
      {
        p_webhook_id: webhookId,
        p_event_type: eventType,
      }
    )

    if (idempotencyError) {
      console.error("[Dodo Webhook] Idempotency check failed:", idempotencyError)
    }

    if (canProcess === false) {
      console.log(`[Dodo Webhook] Event ${webhookId} already processed. Skipping.`)
      return NextResponse.json(
        { message: "Webhook event already processed." },
        { status: 200 }
      )
    }

    // 2. Process Subscription Events
    if (eventType.startsWith("subscription.")) {
      const sub = eventData as DodoSubscriptionData
      const subscriptionId = sub.subscription_id
      const customerId = sub.customer_id
      const productId = sub.product_id

      let userId = sub.metadata?.user_id

      // If user_id is missing from metadata, lookup by existing customer_id or subscription_id
      if (!userId && (customerId || subscriptionId)) {
        const { data: foundId } = await admin.rpc("get_user_id_by_dodo_id", {
          p_dodo_id: customerId || subscriptionId,
        })
        if (foundId) {
          userId = foundId
        }
      }

      console.log(
        `[Dodo Webhook] Subscription event data: user_id=${userId}, sub_id=${subscriptionId}, cust_id=${customerId}, product_id=${productId}`
      )

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

        const { error: syncError } = await admin.rpc("sync_dodo_subscription", {
          p_user_id: userId,
          p_customer_id: customerId || null,
          p_subscription_id: subscriptionId || null,
          p_product_id: productId || null,
          p_plan: mappedPlan,
          p_interval: mappedInterval,
          p_status: status,
          p_current_period_start: sub.current_period_start || null,
          p_current_period_end: sub.current_period_end || null,
          p_cancel_at_period_end: sub.cancel_at_period_end ?? false,
          p_cancelled_at: sub.cancelled_at || null,
        })

        if (syncError) {
          console.error("[Dodo Webhook] sync_dodo_subscription error:", syncError)
        } else {
          console.log(`[Dodo Webhook] Subscription successfully synced for user ${userId} -> ${status}`)
        }
      } else {
        console.warn("[Dodo Webhook] Subscription event skipped: user_id could not be resolved.")
      }
    }

    // 3. Process Payment Events (payment.succeeded, payment.failed)
    if (eventType.startsWith("payment.")) {
      const pay = eventData as DodoPaymentData
      const paymentId = pay.payment_id
      const subscriptionId = pay.subscription_id
      const customerId = pay.customer_id
      let userId = pay.metadata?.user_id

      if (!userId && (customerId || subscriptionId)) {
        const { data: foundId } = await admin.rpc("get_user_id_by_dodo_id", {
          p_dodo_id: customerId || subscriptionId,
        })
        if (foundId) {
          userId = foundId
        }
      }

      if (userId && paymentId) {
        const { error: payError } = await admin.rpc("record_dodo_payment", {
          p_user_id: userId,
          p_payment_id: paymentId,
          p_subscription_id: subscriptionId || null,
          p_amount: (pay.total_amount ?? 0) / 100, // Dodo amount in cents
          p_currency: pay.currency || "USD",
          p_payment_status: eventType === "payment.succeeded" ? "succeeded" : "failed",
          p_payment_type: pay.payment_method_type || null,
        })

        if (payError) {
          console.error("[Dodo Webhook] record_dodo_payment error:", payError)
        } else {
          console.log(`[Dodo Webhook] Payment ${paymentId} recorded for user ${userId}`)
        }
      }
    }

    // 4. Mark event as complete
    await admin.rpc("complete_dodo_webhook_event", {
      p_webhook_id: webhookId,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("[Dodo Webhook] Fatal error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
