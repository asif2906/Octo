import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDodoClient } from "@/lib/dodo/client"
import type { SubscriptionRow } from "@/types/database"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    }

    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("dodo_customer_id, dodo_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (subError || !subData || !subData.dodo_customer_id) {
      return NextResponse.json(
        {
          error:
            "No active Dodo billing account found for this user. You can manage your subscription after completing your initial checkout.",
        },
        { status: 404 }
      )
    }

    const dodo = getDodoClient()
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (request.headers.get("origin") ?? "https://octo-pi-nine.vercel.app")
    const returnUrl = `${appUrl}/dashboard/subscription`

    const session = await dodo.customers.customerPortal.create(
      subData.dodo_customer_id,
      { return_url: returnUrl }
    )

    const portalUrl = (session as any).link || (session as any).portal_url

    if (!session || !portalUrl) {
      return NextResponse.json(
        { error: "Failed to create Customer Portal session." },
        { status: 502 }
      )
    }

    return NextResponse.json({ portalUrl })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to open customer portal"
    console.error("Customer Portal error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
