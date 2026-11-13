import { PricingCards } from "./pricing-cards"

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-b border-border/60 bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Subscription Plans
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Predictable power. All taxes included.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Choose between Basic ($5/wk or $12/mo) and Pro ($11/wk or $24/mo). Predictable daily application caps, cold email quotas, and full pipeline tracking.
            </p>
          </div>
        </div>

        <PricingCards />
      </div>
    </section>
  )
}
