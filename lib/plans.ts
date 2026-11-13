import type { BillingInterval, SubscriptionPlan } from "@/types/database"

export const PLAN_LIMITS = {
  lite: {
    applicationsPerDay: 5,
    emailsPerDay: 5,
  },
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
  aiTailoringEnabled: boolean
  aiTailoringDailyLimit: number
  followUpsTier: "Basic" | "Advanced"
  analyticsTier: "Basic" | "Full" | "Advanced"
  features: string[]
  recommended?: boolean
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanDefinition> = {
  lite: {
    id: "lite",
    name: "Lite",
    pricing: {
      weekly: 2,
      monthly: 5,
    },
    applicationsPerDay: 5,
    coldEmailsPerDay: 5,
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 20,
    followUpsTier: "Basic",
    analyticsTier: "Basic",
    features: [
      "5 auto-apply / day",
      "5 cold emails / day",
      "Full ATS resume builder & genuine PDF export",
      "AI resume tailoring (20 requests/day soft limit)",
      "Application tracker",
      "Basic follow-up reminders",
      "Basic analytics",
    ],
  },
  basic: {
    id: "basic",
    name: "Basic",
    pricing: {
      weekly: 4,
      monthly: 9,
    },
    applicationsPerDay: 10,
    coldEmailsPerDay: 15,
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 20,
    followUpsTier: "Advanced",
    analyticsTier: "Full",
    recommended: true,
    features: [
      "10 auto-apply / day",
      "15 cold emails / day",
      "Full ATS resume builder & genuine PDF export",
      "AI resume tailoring (20 requests/day soft limit)",
      "Application tracker",
      "Advanced follow-up automation",
      "Full analytics suite",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricing: {
      weekly: 7,
      monthly: 19,
    },
    applicationsPerDay: 20,
    coldEmailsPerDay: 20,
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 20,
    followUpsTier: "Advanced",
    analyticsTier: "Advanced",
    features: [
      "20 auto-apply / day",
      "20 cold emails / day",
      "Full ATS resume builder & genuine PDF export",
      "AI resume tailoring (20 requests/day soft limit)",
      "Application tracker",
      "Advanced follow-up automation",
      "Advanced search analytics",
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

export function getDodoProductId(
  plan: SubscriptionPlan,
  interval: BillingInterval
): string | null {
  const envKey = `DODO_${plan.toUpperCase()}_${interval.toUpperCase()}_PRODUCT_ID`
  const val = process.env[envKey]
  return val && val.trim() ? val.trim() : null
}

export function getPlanFromProductId(
  productId: string
): { plan: SubscriptionPlan; interval: BillingInterval } | null {
  const mapping: Array<{
    envKey: string
    plan: SubscriptionPlan
    interval: BillingInterval
  }> = [
    { envKey: "DODO_LITE_WEEKLY_PRODUCT_ID", plan: "lite", interval: "weekly" },
    { envKey: "DODO_LITE_MONTHLY_PRODUCT_ID", plan: "lite", interval: "monthly" },
    { envKey: "DODO_BASIC_WEEKLY_PRODUCT_ID", plan: "basic", interval: "weekly" },
    { envKey: "DODO_BASIC_MONTHLY_PRODUCT_ID", plan: "basic", interval: "monthly" },
    { envKey: "DODO_PRO_WEEKLY_PRODUCT_ID", plan: "pro", interval: "weekly" },
    { envKey: "DODO_PRO_MONTHLY_PRODUCT_ID", plan: "pro", interval: "monthly" },
  ]

  for (const item of mapping) {
    if (process.env[item.envKey] && process.env[item.envKey]?.trim() === productId.trim()) {
      return { plan: item.plan, interval: item.interval }
    }
  }
  return null
}
