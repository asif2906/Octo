import type { SubscriptionPlan } from "@/types/database"

export interface PlanDefinition {
  id: SubscriptionPlan
  name: string
  monthlyPriceUsd: number
  applicationsPerDay: number
  coldEmailsLimit: number
  coldEmailsPeriod: "week" | "day"
  aiTailoringEnabled: boolean
  aiTailoringDailyLimit: number
  followUpsTier: "None" | "Basic" | "Advanced"
  trackerTier: "Basic" | "Full" | "Full + Analytics"
  founderDatabase: "No" | "Planned"
  features: string[]
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    applicationsPerDay: 3,
    coldEmailsLimit: 5,
    coldEmailsPeriod: "week",
    aiTailoringEnabled: false,
    aiTailoringDailyLimit: 0,
    followUpsTier: "None",
    trackerTier: "Basic",
    founderDatabase: "No",
    features: [
      "3 assisted applications per day",
      "5 cold emails per week",
      "Personal recipient list",
      "Basic resume builder & PDF export",
      "Basic application tracker",
      "Manual status updates",
    ],
  },
  basic: {
    id: "basic",
    name: "Basic",
    monthlyPriceUsd: 9,
    applicationsPerDay: 10,
    coldEmailsLimit: 15,
    coldEmailsPeriod: "day",
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 20,
    followUpsTier: "Basic",
    trackerTier: "Full",
    founderDatabase: "No",
    features: [
      "10 assisted applications per day",
      "15 cold emails per day",
      "Personal recipient list",
      "AI resume tailoring (20 requests/day soft limit)",
      "Basic follow-up reminders",
      "Full application tracker",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 19,
    applicationsPerDay: 20,
    coldEmailsLimit: 20,
    coldEmailsPeriod: "day",
    aiTailoringEnabled: true,
    aiTailoringDailyLimit: 20,
    followUpsTier: "Advanced",
    trackerTier: "Full + Analytics",
    founderDatabase: "Planned",
    features: [
      "20 assisted applications per day",
      "20 cold emails per day",
      "Personal recipient list",
      "Founder and CEO database (planned)",
      "AI resume tailoring (20 requests/day soft limit)",
      "Advanced follow-ups",
      "Full tracker and analytics",
    ],
  },
}

export interface UsageSummary {
  plan: SubscriptionPlan
  timezone: string
  applicationsUsedToday: number
  applicationsDailyLimit: number
  coldEmailsUsedInPeriod: number
  coldEmailsLimit: number
  coldEmailsPeriod: "week" | "day"
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

/**
 * Returns the Monday-start ISO week identifier (YYYY-MM-DD of Monday) in the given timezone,
 * matching PostgreSQL date_trunc('week', ts at time zone tz).
 */
export function getWeekStartKeyInTimezone(date: Date, timeZone: string): string {
  const dateKey = getDateKeyInTimezone(date, timeZone)
  const [y, m, d] = dateKey.split("-").map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const dayOfWeek = utcDate.getUTCDay() // 0 = Sun, 1 = Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday)
  return utcDate.toISOString().slice(0, 10)
}

