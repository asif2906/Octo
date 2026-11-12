import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { OctoLogo } from "@/components/octo-logo"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AuthShellProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-zinc-50/70 px-4 py-8 dark:bg-zinc-950 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(24,24,27,0.05),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]"
      />

      <div className="relative mx-auto flex w-full max-w-md items-center justify-between">
        <OctoLogo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
      </div>

      <main className="relative mx-auto my-8 w-full max-w-md">
        <Card className="border border-border/80 bg-card py-6 shadow-sm ring-0">
          <CardHeader className="space-y-1.5 px-6 pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pt-2">
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </CardContent>
        </Card>
      </main>

      <footer className="relative mx-auto w-full max-w-md text-center text-xs text-muted-foreground">
        © 2026 Octo.tech. All rights reserved.
      </footer>
    </div>
  )
}

export function getPublicOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "")
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return ""
}

