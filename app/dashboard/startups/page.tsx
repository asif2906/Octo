import { Suspense } from "react"
import Link from "next/link"
import { getDashboardContext } from "@/lib/dashboard/data"
import { CURATED_STARTUPS } from "@/lib/jobs/catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Rocket, ExternalLink, Lock, Sparkles, ShieldCheck } from "lucide-react"

async function StartupsPageContent() {
  const ctx = await getDashboardContext()
  const isPro = ctx.usage.plan === "pro"

  // Pro users see all startups; Basic users see introductory set
  const visibleStartups = isPro ? CURATED_STARTUPS : CURATED_STARTUPS.slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Startup Discovery
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated database of early-stage, fast-growing venture backed companies and founders.
          </p>
        </div>

        {!isPro && (
          <Link href="/pricing">
            <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
              <Sparkles className="h-4 w-4" /> Upgrade to Pro for Full Database
            </Button>
          </Link>
        )}
      </div>

      {!isPro && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>
              You are currently on the <strong>Basic plan</strong>. Basic includes preview access to 2 startups. Pro subscribers unlock all venture-backed startups and direct founder contacts.
            </span>
          </div>
          <Link href="/pricing" className="underline font-semibold whitespace-nowrap ml-4">
            View Pro Plan
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleStartups.map((startup) => (
          <div
            key={startup.externalId}
            className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{startup.company}</h3>
                  <p className="text-xs text-indigo-400 font-medium">{startup.title}</p>
                </div>
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-[10px]">
                  YC Backed
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {startup.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {startup.skillsRequired.map((s, idx) => (
                  <span key={idx} className="rounded bg-muted/60 px-2 py-0.5 text-[10px] text-foreground/80">
                    {s}
                  </span>
                ))}
                {startup.salaryRange && (
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-mono">
                    {startup.salaryRange}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
              <span className="text-[11px] text-muted-foreground">{startup.location}</span>
              {startup.applyUrl && (
                <a href={startup.applyUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    Company Profile <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        ))}

        {!isPro && (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/20 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Unlock 100+ Curated Startups & Founder Contacts</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Pro members get full access to weekly refreshed YC and venture-backed startup directories with direct executive reach-out information.
            </p>
            <Link href="/pricing">
              <Button size="sm" variant="default" className="mt-2">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StartupsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <StartupsPageContent />
    </Suspense>
  )
}
