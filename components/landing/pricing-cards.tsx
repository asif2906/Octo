"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Loader2, Sparkles, Database, MailCheck, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import { PLAN_DEFINITIONS } from "@/lib/plans"
import type { BillingInterval, SubscriptionPlan } from "@/types/database"

interface PricingCardsProps {
  currentPlan?: SubscriptionPlan | null
  userEmail?: string | null
}

const TIER_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  basic: "Comprehensive everyday toolset for active candidates seeking consistent application throughput.",
  pro: "Maximum power with double throughput, curated founder/CEO database access, and advanced analytics.",
}

export function PricingCards({ currentPlan, userEmail }: PricingCardsProps) {
  const router = useRouter()
  const [interval, setInterval] = useState<BillingInterval>("monthly")
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const plans: SubscriptionPlan[] = ["basic", "pro"]

  async function handleSubscribe(plan: SubscriptionPlan) {
    setErrorMessage(null)
    setLoadingPlan(plan)

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/signup?next=/pricing&plan=${plan}&interval=${interval}`)
          return
        }
        throw new Error(data.error || "Failed to initialize checkout.")
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error("No checkout URL returned from server.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout error"
      setErrorMessage(msg)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="space-y-10">
      {/* Interval Toggle */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 p-1.5 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => setInterval("weekly")}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 font-medium transition-all duration-150",
              interval === "weekly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Weekly billing
          </button>
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 font-medium transition-all duration-150 flex items-center gap-1.5",
              interval === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly billing
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Save ~40%
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>All displayed prices are tax-inclusive · No surprise fees at checkout</span>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 max-w-md text-center">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Pricing Cards Grid (2-column layout for Basic and Pro) */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((planKey) => {
          const plan = PLAN_DEFINITIONS[planKey]
          const price = interval === "weekly" ? plan.pricing.weekly : plan.pricing.monthly
          const periodLabel = interval === "weekly" ? "/week" : "/month"
          const isCurrent = currentPlan === planKey
          const isPro = planKey === "pro"
          const isLoading = loadingPlan === planKey

          return (
            <div
              key={planKey}
              className={cn(
                "relative flex flex-col justify-between rounded-2xl border p-8 transition-all duration-200",
                isPro
                  ? "border-foreground bg-card shadow-2xl ring-2 ring-foreground/15"
                  : "border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isPro ? "Maximum pipeline velocity" : "Active job search suite"}
                    </p>
                  </div>
                  {isPro ? (
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 font-medium gap-1">
                      <Sparkles className="size-3" />
                      Recommended
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Starter Pro
                    </Badge>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    ${price}
                  </span>
                  <span className="text-base text-muted-foreground">
                    {periodLabel}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                    Taxes included
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {TIER_DESCRIPTIONS[planKey]}
                </p>

                {/* Quota Highlights Banner */}
                <div
                  className={cn(
                    "mt-6 rounded-xl border p-3.5 font-mono text-xs space-y-1.5",
                    isPro
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-border/80 bg-muted/40 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Daily Quota</span>
                    <span>{plan.applicationsPerDay} apps · {plan.coldEmailsPerDay} emails</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {plan.recipientsDescription}
                  </div>
                </div>

                {/* Feature Bullet List */}
                <ul className="mt-6 space-y-3.5 text-sm">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span className={cn(
                        "text-muted-foreground",
                        isPro && (item.includes("founder") || item.includes("analytics"))
                          ? "text-foreground font-medium"
                          : ""
                      )}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50">
                <Button
                  onClick={() => handleSubscribe(planKey)}
                  disabled={isLoading || isCurrent}
                  size="lg"
                  className={cn(
                    "h-11 w-full justify-center font-medium gap-2 text-sm",
                    isPro
                      ? "bg-foreground text-background hover:bg-foreground/90 shadow-md"
                      : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Connecting to Checkout...
                    </>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    <>
                      Subscribe to {plan.name}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Billed in advance · Cancel anytime in portal
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground space-y-1 max-w-xl mx-auto pt-4">
        <p>
          Secure checkout handled by Dodo Payments (Merchant of Record). All listed prices are final and inclusive of applicable taxes.
        </p>
      </div>
    </div>
  )
}
