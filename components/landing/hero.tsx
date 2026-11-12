import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Mail,
  Send,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_60%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
        <div className="space-y-7 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Early Access · Resume Builder First</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              Your next opportunity starts here.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Stop wasting hours applying manually. Build tailored resumes,
              reach hiring managers directly, and manage your entire job search
              from one platform.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 px-6 text-sm font-medium shadow-xs"
              )}
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-6 text-sm font-medium"
              )}
            >
              Explore Features
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-foreground/70" />
              Create your profile once
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-foreground/70" />
              Send-only Gmail integration
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-foreground/70" />
              Free plan included
            </span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-xl border border-border bg-card shadow-lg shadow-zinc-950/[0.04] dark:shadow-black/40">
            {/* Browser-style workspace header */}
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  octo.tech/workspace
                </span>
              </div>
              <Badge variant="subtle" className="text-[11px]">
                Demo Preview
              </Badge>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Top Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/80 bg-background p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Resumes</span>
                    <FileText className="size-3.5" />
                  </div>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight">
                    3 versions
                  </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Applications</span>
                    <BarChart3 className="size-3.5" />
                  </div>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight">
                    14 tracked
                  </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Outreach</span>
                    <Mail className="size-3.5" />
                  </div>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight">
                    5 / week
                  </p>
                </div>
              </div>

              {/* Resume Builder + Tailoring Preview */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/80 bg-background p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <FileText className="size-3.5 text-muted-foreground" />
                      Resume Builder
                    </span>
                    <Badge variant="outline" className="px-2 py-0 text-[10px]">
                      Preview
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        Software Engineer — Fresher
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Ready
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 w-4/5 rounded-full bg-zinc-900 dark:bg-zinc-200" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Profile synced · Education, 2 projects, 8 skills
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-background p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Sparkles className="size-3.5 text-muted-foreground" />
                      AI Resume Tailoring
                    </span>
                    <Badge variant="outline" className="px-2 py-0 text-[10px]">
                      Demo
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Backend Intern · FinTech Co.
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Prioritizes TypeScript, PostgreSQL &amp; REST API bullets
                      from your saved profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Progress & Outreach Activity */}
              <div className="rounded-lg border border-border/80 bg-background p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Applications &amp; Outreach Activity
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Sample workflow
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/35 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          Frontend Engineer · Linear-style SaaS
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          Assisted form filled · Confirmed by you
                        </p>
                      </div>
                    </div>
                    <Badge variant="subtle" className="shrink-0 text-[10px]">
                      Applied
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/35 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Send className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          Cold email to Engineering Lead
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          Sent via Gmail send-only · Follow-up in 4d
                        </p>
                      </div>
                    </div>
                    <Badge variant="subtle" className="shrink-0 text-[10px]">
                      Outreach
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

