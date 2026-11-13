import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDodoClient } from "@/lib/dodo/client"
import { getDodoProductId, PLAN_DEFINITIONS } from "@/lib/plans"
import type { BillingInterval, SubscriptionPlan } from "@/types/database"

interface CheckoutRequestBody {
  plan?: SubscriptionPlan
  interval?: BillingInterval
  returnUrl?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to initiate checkout." },
        { status: 401 }
      )
    }

    const body = (await request.json()) as CheckoutRequestBody
    const plan = body.plan
    const interval = body.interval

    if (!plan || !["lite", "basic", "pro"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid subscription plan selected." },
        { status: 400 }
      )
    }

    if (!interval || !["weekly", "monthly"].includes(interval)) {
      return NextResponse.json(
        { error: "Invalid billing interval selected (must be weekly or monthly)." },
        { status: 400 }
      )
    }

    const productId = getDodoProductId(plan, interval)
    if (!productId) {
      return NextResponse.json(
        {
          error: `Dodo product ID for ${plan} (${interval}) is not configured. Please set DODO_${plan.toUpperCase()}_${interval.toUpperCase()}_PRODUCT_ID in environment variables.`,
          code: "PRODUCT_NOT_CONFIGURED",
        },
        { status: 503 }
      )
    }

    // Determine return URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (request.headers.get("origin") ?? "https://octo-pi-nine.vercel.app")
    const returnUrl = `${appUrl}/payment/success`

    const dodo = getDodoClient()

    // Create hosted checkout session with Supabase user ID in metadata
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: returnUrl,
      customer: {
        email: user.email ?? "",
        name:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "Customer",
      },
      metadata: {
        user_id: user.id,
        plan,
        interval,
      },
    })

    if (!session || !session.checkout_url) {
      return NextResponse.json(
        { error: "Failed to create Dodo Checkout session." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session"
    console.error("Dodo checkout error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

