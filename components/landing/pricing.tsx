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
            <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Pricing Plans
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent subscription plans in USD.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Predictable weekly or monthly billing with clear daily action caps. Choose the tier that matches your job search momentum.
            </p>
          </div>
        </div>

        <PricingCards />
      </div>
    </section>
  )
}
