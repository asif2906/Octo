import { Suspense } from "react"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Faq } from "@/components/landing/faq"
import { PricingCards } from "@/components/landing/pricing-cards"
import { createClient } from "@/lib/supabase/server"
import type { SubscriptionPlan } from "@/types/database"

export const metadata = {
  title: "Pricing Plans — Octo.tech",
  description:
    "Simple, predictable subscription plans for automated job applications and high-touch founder outreach.",
}

async function PricingContent() {
  let currentPlan: SubscriptionPlan | null = null
  let userEmail: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      userEmail = user.email ?? null
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle()

      if (sub && sub.status === "active") {
        currentPlan = sub.plan as SubscriptionPlan
      }
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      ("digest" in err || (err instanceof Error && err.message.includes("connection()")))
    ) {
      throw err
    }
    console.warn("Failed to fetch user pricing state:", err)
  }

  return (
    <PricingCards currentPlan={currentPlan} userEmail={userEmail} />
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />
      <main className="flex-1">
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <p className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Flexible Plans & Transparent Pricing
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
                Scale your job search with predictable power.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Choose between weekly or monthly intervals. All plans include full ATS resume building, genuine PDF export, and verified outreach tracking.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="py-20 text-center text-sm text-muted-foreground">
                  Loading plan details...
                </div>
              }
            >
              <PricingContent />
            </Suspense>
          </div>
        </section>

        <Faq />
      </main>
      <Footer />
    </div>
  )
}

