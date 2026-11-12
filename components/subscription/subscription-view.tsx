"use client"

import { Check, Info } from "lucide-react"
import { PLAN_DEFINITIONS, type UsageSummary } from "@/lib/plans"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UsageOverview } from "@/components/dashboard/usage-overview"
import type { SubscriptionPlan, SubscriptionRow } from "@/types/database"

const PLAN_ORDER: SubscriptionPlan[] = ["free", "basic", "pro"]

export function SubscriptionView({
  subscription,
  usage,
}: {
  subscription: SubscriptionRow
  usage: UsageSummary
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Subscription & Usage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your current plan, server-tracked daily/weekly quotas, and upcoming billing checkout.
        </p>
      </div>

      <UsageOverview usage={usage} />

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-foreground" />
        <div>
          <p className="font-medium text-foreground">
            Merchant of Record Checkout Coming Soon
          </p>
          <p className="mt-1">
            Plan upgrades will be processed through verified server-side billing webhooks (Lemon Squeezy, Paddle, or Dodo Payments). Paid features and quotas remain strictly enforced on the server based on your active subscription record ({subscription.status}).
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLAN_DEFINITIONS[planId]
          const isCurrent = subscription.plan === planId
          return (
            <Card
              key={plan.id}
              className={
                isCurrent ? "border-primary ring-2 ring-primary/15" : undefined
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent ? <Badge>Current Plan</Badge> : null}
                </div>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    ${plan.monthlyPriceUsd}
                  </span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  variant={isCurrent ? "secondary" : "outline"}
                  className="w-full"
                  disabled
                >
                  {isCurrent
                    ? "Active Plan"
                    : "Checkout Integration Coming Soon"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

