import { NextResponse, type NextRequest } from "next/server"
import { getDodoClient } from "@/lib/dodo/client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getPlanFromProductId } from "@/lib/plans"
import type { BillingInterval, SubscriptionPlan, SubscriptionStatus } from "@/types/database"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Support both standardwebhooks headers and Svix headers
    const webhookId =
      req.headers.get("webhook-id") ||
      req.headers.get("svix-id") ||
      req.headers.get("msg-id") ||
      ""

    const webhookSignature =
      req.headers.get("webhook-signature") ||
      req.headers.get("svix-signature") ||
      ""

    const webhookTimestamp =
      req.headers.get("webhook-timestamp") ||
      req.headers.get("svix-timestamp") ||
      ""

    const headers = {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    }

    if (!webhookId || !webhookSignature) {
      console.warn("[Dodo Webhook] Missing required signature headers")
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

    const eventType: string = event.type || event.event_type || ""
    const eventData: any = event.data || {}

    console.log(`[Dodo Webhook] Received verified event: ${eventType} (ID: ${webhookId})`)

    const admin = getSupabaseAdmin()

    // 1. Idempotency Check via RPC
    const { data: canProcess } = await admin.rpc("record_dodo_webhook_event", {
      p_webhook_id: webhookId,
      p_event_type: eventType,
    })

    if (canProcess === false) {
      console.log(`[Dodo Webhook] Event ${webhookId} already processed. Skipping.`)
      return NextResponse.json(
        { message: "Webhook event already processed." },
        { status: 200 }
      )
    }

    // Extract common fields across different Dodo payload formats
    const subscriptionId: string | null =
      eventData.subscription_id ||
      eventData.subscriptionId ||
      null

    const customerObj = eventData.customer
    const customerId: string | null =
      eventData.customer_id ||
      (typeof customerObj === "object" ? customerObj?.customer_id : null) ||
      (typeof customerObj === "string" ? customerObj : null) ||
      null

    const customerEmail: string | null =
      (typeof customerObj === "object" ? customerObj?.email : null) ||
      eventData.customer_email ||
      eventData.billing?.email ||
      null

    const productId: string | null =
      eventData.product_id ||
      eventData.productId ||
      null

    // Resolve user_id:
    // 1. Metadata from checkout session
    let userId: string | null =
      eventData.metadata?.user_id ||
      eventData.metadata?.userId ||
      null

    // 2. Lookup by existing dodo_customer_id or dodo_subscription_id
    if (!userId && (customerId || subscriptionId)) {
      const { data: foundId } = await admin.rpc("get_user_id_by_dodo_id", {
        p_dodo_id: customerId || subscriptionId,
      })
      if (foundId) {
        userId = foundId
      }
    }

    // 3. Fallback: Lookup by customer email in auth.users
    if (!userId && customerEmail) {
      const { data: emailUserId } = await admin.rpc("get_user_id_by_email", {
        p_email: customerEmail,
      })
      if (emailUserId) {
        userId = emailUserId
      }
    }

    console.log(
      `[Dodo Webhook] Context: event=${eventType}, user_id=${userId}, email=${customerEmail}, sub_id=${subscriptionId}, cust_id=${customerId}, product_id=${productId}`
    )

    // 2. Process Subscription Events
    if (eventType.startsWith("subscription.") || eventType.startsWith("invoice.")) {
      if (userId) {
        const planInfo = productId ? getPlanFromProductId(productId) : null
        const mappedPlan: SubscriptionPlan | null =
          planInfo?.plan ??
          (eventData.metadata?.plan as SubscriptionPlan) ??
          null

        const mappedInterval: BillingInterval | null =
          planInfo?.interval ??
          (eventData.metadata?.interval as BillingInterval) ??
          null

        let status: SubscriptionStatus = "active"

        switch (eventType) {
          case "subscription.active":
          case "subscription.renewed":
          case "invoice.payment_succeeded":
            status = "active"
            break
          case "subscription.cancelled":
            status = "cancelled"
            break
          case "subscription.expired":
            status = "expired"
            break
          case "subscription.on_hold":
          case "invoice.past_due":
            status = "on_hold"
            break
          case "subscription.past_due":
            status = "past_due"
            break
          case "subscription.paused":
            status = "paused"
            break
          default:
            status = (eventData.status as SubscriptionStatus) || "active"
        }

        // Period dates from Dodo
        const currentPeriodStart =
          eventData.previous_billing_date ||
          eventData.current_period_start ||
          eventData.created_at ||
          null

        const currentPeriodEnd =
          eventData.next_billing_date ||
          eventData.current_period_end ||
          null

        const cancelAtPeriodEnd =
          eventData.cancel_at_next_billing_date ??
          eventData.cancel_at_period_end ??
          false

        const cancelledAt =
          eventData.cancelled_at ||
          (status === "cancelled" ? new Date().toISOString() : null)

        const { error: syncError } = await admin.rpc("sync_dodo_subscription", {
          p_user_id: userId,
          p_customer_id: customerId,
          p_subscription_id: subscriptionId,
          p_product_id: productId,
          p_plan: mappedPlan,
          p_interval: mappedInterval,
          p_status: status,
          p_current_period_start: currentPeriodStart,
          p_current_period_end: currentPeriodEnd,
          p_cancel_at_period_end: cancelAtPeriodEnd,
          p_cancelled_at: cancelledAt,
        })

        if (syncError) {
          console.error("[Dodo Webhook] sync_dodo_subscription error:", syncError)
        } else {
          console.log(`[Dodo Webhook] Subscription successfully synced for user ${userId} -> ${status}`)
        }
      } else {
        console.warn("[Dodo Webhook] Warning: Could not resolve user_id for subscription event.")
      }
    }

    // 3. Process Payment Events (payment.succeeded, payment.failed)
    if (eventType.startsWith("payment.")) {
      const paymentId = eventData.payment_id || eventData.paymentId || webhookId
      const totalAmount = eventData.total_amount ?? eventData.amount ?? 0
      const currency = eventData.currency || "USD"
      const paymentStatus = eventType === "payment.succeeded" ? "succeeded" : "failed"
      const paymentType = eventData.payment_method_type || eventData.payment_method || null

      if (userId && paymentId) {
        const { error: payError } = await admin.rpc("record_dodo_payment", {
          p_user_id: userId,
          p_payment_id: paymentId,
          p_subscription_id: subscriptionId,
          p_amount: totalAmount / 100, // Dodo amount in cents
          p_currency: currency,
          p_payment_status: paymentStatus,
          p_payment_type: paymentType,
        })

        if (payError) {
          console.error("[Dodo Webhook] record_dodo_payment error:", payError)
        } else {
          console.log(`[Dodo Webhook] Payment ${paymentId} recorded for user ${userId}`)
        }

        // If payment succeeded, also ensure subscription is marked active
        if (paymentStatus === "succeeded") {
          const planInfo = productId ? getPlanFromProductId(productId) : null
          const mappedPlan = planInfo?.plan ?? (eventData.metadata?.plan as SubscriptionPlan) ?? "basic"
          const mappedInterval = planInfo?.interval ?? (eventData.metadata?.interval as BillingInterval) ?? "monthly"

          await admin.rpc("sync_dodo_subscription", {
            p_user_id: userId,
            p_customer_id: customerId,
            p_subscription_id: subscriptionId,
            p_product_id: productId,
            p_plan: mappedPlan,
            p_interval: mappedInterval,
            p_status: "active",
          })
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
