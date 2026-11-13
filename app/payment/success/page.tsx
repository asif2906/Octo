"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatusResponse {
  authenticated: boolean
  hasActiveSubscription: boolean
  subscription: {
    plan: "lite" | "basic" | "pro" | null
    status: string
    billingInterval: "weekly" | "monthly" | null
  } | null
}

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [interval, setInterval] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let mounted = true

    async function checkStatus() {
      try {
        const res = await fetch("/api/payments/status")
        if (!res.ok) {
          if (res.status === 401) {
            // Unauthenticated
            setLoading(false)
            return
          }
        }
        const data: StatusResponse = await res.json()

        if (data.hasActiveSubscription) {
          if (mounted) {
            setConfirmed(true)
            setPlan(data.subscription?.plan ?? null)
            setInterval(data.subscription?.billingInterval ?? null)
            setLoading(false)
          }
          return
        }

        // Keep polling for up to 30 attempts (~60 seconds)
        if (mounted && attempts < 30) {
          setAttempts((prev) => prev + 1)
          timer = setTimeout(checkStatus, 2000)
        } else if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        console.error("Status polling failed:", err)
        if (mounted && attempts < 30) {
          setAttempts((prev) => prev + 1)
          timer = setTimeout(checkStatus, 2500)
        } else if (mounted) {
          setLoading(false)
        }
      }
    }

    checkStatus()

    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
    }
  }, [attempts])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6">
        {loading && !confirmed ? (
          <div className="space-y-4 py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your payment is being confirmed.
            </h1>
            <p className="text-sm text-muted-foreground">
              We&apos;re verifying your transaction with Dodo Payments. This usually takes just a few seconds...
            </p>
          </div>
        ) : confirmed ? (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome to Octo.tech!
              </h1>
              <p className="text-sm text-muted-foreground">
                Your{" "}
                <span className="font-semibold text-foreground capitalize">
                  {plan ?? "Octo"}
                </span>{" "}
                {interval ? `(${interval}) ` : ""}subscription is now active.
              </p>
            </div>
            <div className="pt-4">
              <Button
                nativeButton={false}
                render={<Link href="/dashboard" />}
                size="lg"
                className="w-full gap-2"
              >
                Access Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight">
                Payment confirmation pending
              </h1>
              <p className="text-sm text-muted-foreground">
                Your checkout was submitted and is processing in the background. It may take a moment for Dodo Payments to deliver the webhook confirmation.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                nativeButton={false}
                render={<Link href="/dashboard" />}
                size="lg"
                className="w-full"
              >
                Check Dashboard
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/pricing" />}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Return to Pricing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
