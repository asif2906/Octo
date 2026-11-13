"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, CreditCard, ExternalLink, Loader2, AlertCircle, ArrowUpRight } from "lucide-react"
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
import type { PaymentHistoryRow, SubscriptionPlan, SubscriptionRow } from "@/types/database"

interface SubscriptionViewProps {
  subscription: SubscriptionRow
  usage: UsageSummary
  paymentHistory?: PaymentHistoryRow[]
}

export function SubscriptionView({
  subscription,
  usage,
  paymentHistory = [],
}: SubscriptionViewProps) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const planKey = (subscription.plan as SubscriptionPlan) || "basic"
  const planDef = PLAN_DEFINITIONS[planKey]
  const interval = subscription.billing_interval || "monthly"
  const price = interval === "weekly" ? planDef.pricing.weekly : planDef.pricing.monthly
  const periodLabel = interval === "weekly" ? "/week" : "/month"

  const renewalDate = subscription.current_period_end
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(subscription.current_period_end))
    : "—"

  const periodStartDate = subscription.current_period_start
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(subscription.current_period_start))
    : "—"

  async function handleOpenPortal() {
    setPortalLoading(true)
    setPortalError(null)

    try {
      const res = await fetch("/api/payments/portal", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to open customer portal.")
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl
      } else {
        throw new Error("No portal URL returned.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load portal"
      setPortalError(msg)
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Subscription & Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your active Dodo Payments subscription, billing interval, and invoice history.
        </p>
      </div>

      {portalError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{portalError}</span>
        </div>
      )}

      {/* Current Subscription Card */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-xl capitalize">
                {planDef.name} Plan
              </CardTitle>
              <Badge
                variant={
                  subscription.status === "active"
                    ? "default"
                    : subscription.status === "cancelled"
                      ? "outline"
                      : "subtle"
                }
                className="capitalize"
              >
                {subscription.status}
              </Badge>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                {interval} billing
              </span>
            </div>
            <CardDescription>
              {planDef.applicationsPerDay} auto-applies/day · {planDef.coldEmailsPerDay} cold emails/day
            </CardDescription>
          </div>

          <div className="flex flex-col sm:items-end gap-1 sm:text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                ${price}
              </span>
              <span className="text-sm text-muted-foreground">{periodLabel}</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-500">Taxes included</span>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 py-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current Period Start
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {periodStartDate}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {subscription.cancel_at_period_end ? "Access Ends On" : "Next Renewal Date"}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {renewalDate}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cancellation Status
            </p>
            <p className="mt-1 text-sm text-foreground">
              {subscription.cancel_at_period_end
                ? "Set to cancel at period end"
                : "Auto-renew active"}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5">
          <div className="text-xs text-muted-foreground">
            Billed securely through Dodo Payments (Merchant of Record).
          </div>
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/pricing" />}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              Change Plan
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              size="sm"
              className="gap-1.5"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <CreditCard className="size-3.5" />
                  Manage Billing
                  <ExternalLink className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Usage Overview */}
      <UsageOverview usage={usage} />

      {/* Payment History Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Payment History
          </h2>
          <p className="text-xs text-muted-foreground">
            Invoices and transactions for your Octo.tech account.
          </p>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No payments recorded yet. Initial invoice will appear here once processed.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paymentHistory.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(pmt.created_at))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {pmt.dodo_payment_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      ${Number(pmt.amount).toFixed(2)} {pmt.currency}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          pmt.payment_status === "succeeded"
                            ? "default"
                            : pmt.payment_status === "failed"
                              ? "outline"
                              : "subtle"
                        }
                        className="text-[11px] capitalize"
                      >
                        {pmt.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
