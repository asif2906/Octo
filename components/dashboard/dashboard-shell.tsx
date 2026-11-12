"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { ToastProvider } from "@/components/ui/toast"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import type { UsageSummary } from "@/lib/plans"

interface DashboardShellProps {
  fullName: string | null
  email: string
  usage: UsageSummary
  schemaReady: boolean
  children: React.ReactNode
}

export function DashboardShell({
  fullName,
  email,
  usage,
  schemaReady,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-muted/20 text-foreground">
        <DashboardSidebar
          usage={usage}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            fullName={fullName}
            email={email}
            usage={usage}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 print:p-0">
            {!schemaReady ? (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 print:hidden">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">
                    Database migration required in Supabase
                  </p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    The Phase 2 database tables are not applied to your Supabase project yet. Run{" "}
                    <code className="rounded bg-black/10 px-1 py-0.5 font-mono">
                      supabase/migrations/20261111000001_phase2_core_schema.sql
                    </code>{" "}
                    in your Supabase SQL Editor, then refresh this page.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

