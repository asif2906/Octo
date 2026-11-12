import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Log in — Octo.tech",
  description: "Log in to your Octo.tech account.",
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const initialError =
    params.error === "auth_callback_failed"
      ? "The authentication link is invalid or has expired. Please try again."
      : undefined

  return <LoginForm initialError={initialError} />
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <AuthShell
      title="Welcome back"
      description="Log in to your Octo.tech account to continue your job search."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up free
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
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}

