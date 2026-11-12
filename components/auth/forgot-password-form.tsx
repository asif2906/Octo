"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPublicOrigin } from "@/components/auth/auth-shell"
import { cn } from "cn"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Please enter your account email address.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${getPublicOrigin()}/auth/callback?next=/reset-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSentTo(trimmedEmail)
    } catch {
      setError("Unable to send reset email right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <p className="font-medium">Reset link sent</p>
            <p className="text-xs leading-relaxed opacity-90">
              If an account exists for <span className="font-medium">{sentTo}</span>,
              you will receive a password reset link shortly.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}
        >
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className="h-10"
        />
      </div>

      <Button type="submit" disabled={loading} className="h-10 w-full">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  )
}

