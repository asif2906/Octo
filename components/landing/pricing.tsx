import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

interface PricingPlan {
  id: "free" | "basic" | "pro"
  name: string
  price: string
  period: string
  description: string
  limitsSummary: string
  features: string[]
  ctaLabel: string
  ctaHref: string
  highlighted?: boolean
  dark?: boolean
}

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Everything you need to start organizing your job search.",
    limitsSummary: "3 assisted applications/day · 5 cold emails/week",
    features: [
      "3 assisted applications per day",
      "5 cold emails per week",
      "Personal recipient list",
      "Basic resume builder",
      "Basic application tracker",
      "Manual status updates",
    ],
    ctaLabel: "Get Started Free",
    ctaHref: "/signup",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9",
    period: "/month",
    description: "Recommended for active job seekers applying every week.",
    limitsSummary: "10 assisted applications/day · 15 cold emails/day",
    features: [
      "10 assisted applications per day",
      "15 cold emails per day",
      "Personal recipient list",
      "AI resume tailoring",
      "Basic follow-ups",
      "Full application tracker",
    ],
    ctaLabel: "Get Basic",
    ctaHref: "/signup?plan=basic",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Built for high-volume outreach and complete pipeline visibility.",
    limitsSummary: "20 assisted applications/day · 20 cold emails/day",
    features: [
      "20 assisted applications per day",
      "20 cold emails per day",
      "Personal recipient list",
      "Founder and CEO database (planned)",
      "AI resume tailoring",
      "Advanced follow-ups",
      "Full tracker and analytics",
    ],
    ctaLabel: "Get Pro",
    ctaHref: "/signup?plan=pro",
    dark: true,
  },
]

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-b border-border/60 bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Pricing
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent plans in USD.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Clear daily and weekly caps—no confusing credit math. Start free
              and upgrade only when you need higher limits.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-muted/50 p-1 text-xs">
            <span className="rounded-full bg-background px-3 py-1 font-medium text-foreground shadow-xs">
              Monthly billing
            </span>
            <span className="px-3 py-1 text-muted-foreground">
              Annual discounts · Coming soon
            </span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col justify-between rounded-xl border p-6 transition-all duration-200 sm:p-7",
                plan.highlighted
                  ? "border-foreground bg-card shadow-md ring-1 ring-foreground/10"
                  : plan.dark
                    ? "border-zinc-800 bg-zinc-950 text-zinc-50 shadow-md"
                    : "border-border bg-card"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={cn(
                      "text-base font-semibold tracking-tight",
                      plan.dark ? "text-white" : "text-foreground"
                    )}
                  >
                    {plan.name}
                  </h3>
                  {plan.highlighted ? (
                    <Badge variant="default" className="text-[11px]">
                      Recommended
                    </Badge>
                  ) : null}
                  {plan.dark ? (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-zinc-200">
                      Most Power
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-4xl font-semibold tracking-tight",
                      plan.dark ? "text-white" : "text-foreground"
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      plan.dark ? "text-zinc-400" : "text-muted-foreground"
                    )}
                  >
                    {plan.period}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-3 text-sm leading-relaxed",
                    plan.dark ? "text-zinc-400" : "text-muted-foreground"
                  )}
                >
                  {plan.description}
                </p>

                <div
                  className={cn(
                    "mt-5 rounded-lg border px-3 py-2 font-mono text-xs",
                    plan.dark
                      ? "border-zinc-800 bg-zinc-900/80 text-zinc-300"
                      : "border-border/80 bg-muted/50 text-foreground/85"
                  )}
                >
                  {plan.limitsSummary}
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          plan.dark
                            ? "text-emerald-400"
                            : "text-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          plan.dark ? "text-zinc-300" : "text-muted-foreground"
                        )}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href={plan.ctaHref}
                  className={cn(
                    buttonVariants({
                      variant: plan.dark
                        ? "secondary"
                        : plan.highlighted
                          ? "default"
                          : "outline",
                      size: "lg",
                    }),
                    "h-10 w-full justify-center font-medium",
                    plan.dark
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : ""
                  )}
                >
                  {plan.ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Paid subscriptions and billing launch after the core resume builder is
          live. Creating an account now starts on the Free tier with no card
          required.
        </p>
      </div>
    </section>
  )
}

