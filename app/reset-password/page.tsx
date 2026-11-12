import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Set new password — Octo.tech",
  description: "Choose a new password for your Octo.tech account.",
}

async function ResetPasswordContent() {
  let hasValidSession = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    hasValidSession = Boolean(user)
  } catch {
    hasValidSession = false
  }

  return <ResetPasswordForm hasValidSession={hasValidSession} />
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password with at least 8 characters."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Need to sign in instead?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AuthShell>
  )
}

