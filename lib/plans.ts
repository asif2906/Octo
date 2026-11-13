import type { BillingInterval, SubscriptionPlan } from "@/types/database"

export const PLAN_LIMITS = {
  basic: {
    applicationsPerDay: 10,
    emailsPerDay: 15,
  },
  pro: {
    applicationsPerDay: 20,
    emailsPerDay: 20,
  },
} as const

export interface PlanPricing {
  weekly: number
  monthly: number
}

export interface PlanDefinition {
  id: SubscriptionPlan
  name: string
  pricing: PlanPricing
  applicationsPerDay: number
  coldEmailsPerDay: number
  recipientsDescription: string
  aiTailoringEnabled: boolean
  aiTailoringDailyLimit: number
  followUpsTier: "Basic" | "Advanced"
  analyticsTier: "Full" | "Advanced"
  features: string[]
  recommended?: boolean
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanDefinition> = {
  basic: {
    id: "basic",
    name: "Basic",
    pricing: {
      weekly: 5,
      monthly: 12,
    },
    applicationsPerDay: 10,
    coldEmailsPerDay: 15,
    recipientsDescription: "Personal recipient list",
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 20,
    followUpsTier: "Basic",
    analyticsTier: "Full",
    recommended: false,
    features: [
      "10 auto-apply / day",
      "15 cold emails / day",
      "Personal recipient list",
      "ATS resume builder (fair use)",
      "AI resume tailoring (fair use)",
      "Basic follow-up reminders",
      "Full application tracker",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricing: {
      weekly: 11,
      monthly: 24,
    },
    applicationsPerDay: 20,
    coldEmailsPerDay: 20,
    recipientsDescription: "Personal list + founder & CEO database",
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 40,
    followUpsTier: "Advanced",
    analyticsTier: "Advanced",
    recommended: true,
    features: [
      "20 auto-apply / day",
      "20 cold emails / day",
      "Curated founder & CEO recipient database",
      "ATS resume builder (higher fair use allowance)",
      "AI resume tailoring (higher fair use allowance)",
      "Advanced follow-up automation",
      "Full application tracker + advanced analytics",
    ],
  },
}

export interface UsageSummary {
  plan: SubscriptionPlan
  hasActiveSubscription: boolean
  timezone: string
  applicationsUsedToday: number
  applicationsDailyLimit: number
  coldEmailsUsedInPeriod: number
  coldEmailsLimit: number
  coldEmailsPeriod: "day"
  aiTailoringUsedToday: number
  aiTailoringDailyLimit: number
  aiTailoringEnabled: boolean
}

export function getDateKeyInTimezone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }
}

const DEFAULT_PRODUCT_IDS: Record<SubscriptionPlan, Record<BillingInterval, string>> = {
  basic: {
    weekly: "pdt_0Nrs5TXBiUR9b3Z1SE18H",
    monthly: "pdt_0Nrs5B7Squ6f4qx2B4y5h",
  },
  pro: {
    weekly: "pdt_0Nrs6B1riVWn7ZDFIWLkA",
    monthly: "pdt_0Nrs6s7kKP6lbv39stDPZ",
  },
}

export function getDodoProductId(
  plan: SubscriptionPlan,
  interval: BillingInterval
): string | null {
  const envKey = `DODO_${plan.toUpperCase()}_${interval.toUpperCase()}_PRODUCT_ID`
  const val = process.env[envKey]
  if (val && val.trim()) return val.trim()
  return DEFAULT_PRODUCT_IDS[plan]?.[interval] ?? null
}

export function getPlanFromProductId(
  productId: string
): { plan: SubscriptionPlan; interval: BillingInterval } | null {
  const trimmed = productId.trim()
  const mapping: Array<{
    envKey: string
    plan: SubscriptionPlan
    interval: BillingInterval
    defaultId: string
  }> = [
    { envKey: "DODO_BASIC_WEEKLY_PRODUCT_ID", plan: "basic", interval: "weekly", defaultId: "pdt_0Nrs5TXBiUR9b3Z1SE18H" },
    { envKey: "DODO_BASIC_MONTHLY_PRODUCT_ID", plan: "basic", interval: "monthly", defaultId: "pdt_0Nrs5B7Squ6f4qx2B4y5h" },
    { envKey: "DODO_PRO_WEEKLY_PRODUCT_ID", plan: "pro", interval: "weekly", defaultId: "pdt_0Nrs6B1riVWn7ZDFIWLkA" },
    { envKey: "DODO_PRO_MONTHLY_PRODUCT_ID", plan: "pro", interval: "monthly", defaultId: "pdt_0Nrs6s7kKP6lbv39stDPZ" },
  ]

  for (const item of mapping) {
    const id = process.env[item.envKey]?.trim() || item.defaultId
    if (id === trimmed) {
      return { plan: item.plan, interval: item.interval }
    }
  }
  return null
}
