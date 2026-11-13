"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Loader2 } from "lucide-react"
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
  lite: "Essential daily limits for focused applicants starting their job search.",
  basic: "Recommended for active job seekers sending weekly applications and cold emails.",
  pro: "Maximum throughput with priority daily quotas and advanced outreach analytics.",
}

export function PricingCards({ currentPlan, userEmail }: PricingCardsProps) {
  const router = useRouter()
  const [interval, setInterval] = useState<BillingInterval>("monthly")
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const plans: SubscriptionPlan[] = ["lite", "basic", "pro"]

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
          // Unauthenticated, redirect to signup/login with next
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
              "cursor-pointer rounded-full px-4 py-1.5 font-medium transition-all duration-150",
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
              "cursor-pointer rounded-full px-4 py-1.5 font-medium transition-all duration-150 flex items-center gap-1.5",
              interval === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly billing
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Save ~35%
            </span>
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 max-w-md text-center">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((planKey) => {
          const plan = PLAN_DEFINITIONS[planKey]
          const price = interval === "weekly" ? plan.pricing.weekly : plan.pricing.monthly
          const periodLabel = interval === "weekly" ? "/week" : "/month"
          const isCurrent = currentPlan === planKey
          const isBasic = planKey === "basic"
          const isPro = planKey === "pro"
          const isLoading = loadingPlan === planKey

          return (
            <div
              key={planKey}
              className={cn(
                "relative flex flex-col justify-between rounded-xl border p-6 transition-all duration-200 sm:p-7",
                isBasic
                  ? "border-foreground bg-card shadow-lg ring-1 ring-foreground/10"
                  : isPro
                    ? "border-zinc-800 bg-zinc-950 text-zinc-50 shadow-md"
                    : "border-border bg-card"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={cn(
                      "text-base font-semibold tracking-tight",
                      isPro ? "text-white" : "text-foreground"
                    )}
                  >
                    {plan.name}
                  </h3>
                  {isBasic ? (
                    <Badge variant="default" className="text-[11px]">
                      Recommended
                    </Badge>
                  ) : null}
                  {isPro ? (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-zinc-200">
                      Most Power
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-4xl font-semibold tracking-tight",
                      isPro ? "text-white" : "text-foreground"
                    )}
                  >
                    ${price}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      isPro ? "text-zinc-400" : "text-muted-foreground"
                    )}
                  >
                    {periodLabel}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-3 text-sm leading-relaxed",
                    isPro ? "text-zinc-400" : "text-muted-foreground"
                  )}
                >
                  {TIER_DESCRIPTIONS[planKey]}
                </p>

                <div
                  className={cn(
                    "mt-5 rounded-lg border px-3 py-2 font-mono text-xs",
                    isPro
                      ? "border-zinc-800 bg-zinc-900/80 text-zinc-300"
                      : "border-border/80 bg-muted/50 text-foreground/85"
                  )}
                >
                  {plan.applicationsPerDay} auto-applies/day · {plan.coldEmailsPerDay} cold emails/day
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          isPro ? "text-emerald-400" : "text-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          isPro ? "text-zinc-300" : "text-muted-foreground"
                        )}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => handleSubscribe(planKey)}
                  disabled={isLoading || isCurrent}
                  className={cn(
                    "h-10 w-full justify-center font-medium gap-2",
                    isPro
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : isBasic
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Redirecting to Checkout...
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
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>
          Secure payments powered by Dodo Payments. Switch or cancel anytime from the customer portal.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          All subscriptions are billed in advance per interval with no hidden fees.
        </p>
      </div>
    </div>
  )
}

