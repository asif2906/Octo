import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign up — Octo.tech",
  description: "Create your free Octo.tech account.",
}

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start free with Octo.tech. Build your profile once and reuse it everywhere."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}

