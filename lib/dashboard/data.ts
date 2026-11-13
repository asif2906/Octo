import { redirect } from "next/navigation"
import { connection } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import {
  PLAN_DEFINITIONS,
  type UsageSummary,
  getDateKeyInTimezone,
} from "@/lib/plans"
import type {
  ProfileRow,
  SubscriptionPlan,
  SubscriptionRow,
  UsageEventRow,
} from "@/types/database"

export interface DashboardContextData {
  user: User
  profile: ProfileRow
  subscription: SubscriptionRow
  usage: UsageSummary
  schemaReady: boolean
}

export function isSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const err = error as { code?: string; message?: string }
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    (typeof err.message === "string" &&
      (err.message.includes("Could not find the table") ||
        err.message.includes("does not exist")))
  )
}

function buildFallbackProfile(user: User): ProfileRow {
  const now = new Date().toISOString()
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null

  return {
    id: user.id,
    full_name: metadataName,
    email: user.email ?? null,
    phone: null,
    location: null,
    headline: null,
    professional_summary: null,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    timezone: "UTC",
    created_at: now,
    updated_at: now,
  }
}

function buildFallbackSubscription(userId: string): SubscriptionRow {
  const now = new Date().toISOString()
  return {
    id: "fallback",
    user_id: userId,
    plan: null,
    status: "pending",
    dodo_customer_id: null,
    dodo_subscription_id: null,
    dodo_product_id: null,
    billing_interval: null,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    cancelled_at: null,
    created_at: now,
    updated_at: now,
  }
}

export function computeUsageSummary({
  plan,
  timezone,
  events,
}: {
  plan: SubscriptionPlan
  timezone: string
  events: Pick<UsageEventRow, "action_type" | "created_at">[]
}): UsageSummary {
  const now = new Date()
  const todayKey = getDateKeyInTimezone(now, timezone)
  const planDef = PLAN_DEFINITIONS[plan]

  let applicationsUsedToday = 0
  let coldEmailsUsedInPeriod = 0
  let aiTailoringUsedToday = 0

  for (const event of events) {
    const createdAt = new Date(event.created_at)
    const eventDateKey = getDateKeyInTimezone(createdAt, timezone)

    if (event.action_type === "application" && eventDateKey === todayKey) {
      applicationsUsedToday += 1
    } else if (
      event.action_type === "ai_tailor" &&
      eventDateKey === todayKey
    ) {
      aiTailoringUsedToday += 1
    } else if (
      event.action_type === "cold_email" &&
      eventDateKey === todayKey
    ) {
      coldEmailsUsedInPeriod += 1
    }
  }

  return {
    plan,
    hasActiveSubscription: true,
    timezone,
    applicationsUsedToday,
    applicationsDailyLimit: planDef.applicationsPerDay,
    coldEmailsUsedInPeriod,
    coldEmailsLimit: planDef.coldEmailsPerDay,
    coldEmailsPeriod: "day",
    aiTailoringUsedToday,
    aiTailoringDailyLimit: planDef.aiTailoringDailyLimit,
    aiTailoringEnabled: planDef.aiTailoringEnabled,
  }
}

export async function getDashboardContext(): Promise<DashboardContextData> {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

  const [profileRes, subscriptionRes, usageRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("usage_events")
      .select("action_type, created_at")
      .eq("user_id", user.id)
      .gte("created_at", eightDaysAgo),
  ])

  const rawSub = subscriptionRes.data as SubscriptionRow | null

  // Server-Side Subscription Access Control
  const now = new Date()
  const isPaidActive =
    rawSub &&
    (rawSub.plan === "basic" || rawSub.plan === "pro") &&
    (rawSub.status === "active" ||
      (rawSub.status === "cancelled" &&
        rawSub.current_period_end &&
        new Date(rawSub.current_period_end) > now))

  if (!isPaidActive) {
    redirect("/pricing")
  }

  const subscription = rawSub!
  const plan = subscription.plan as SubscriptionPlan

  let profile = profileRes.data as ProfileRow | null
  if (!profile) {
    const fallback = buildFallbackProfile(user)
    const { data: createdProfile } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fallback.full_name,
          email: fallback.email,
          timezone: "UTC",
        },
        { onConflict: "id" }
      )
      .select("*")
      .maybeSingle()
    profile = (createdProfile as ProfileRow | null) ?? fallback
  }

  const events =
    (usageRes.data as Pick<UsageEventRow, "action_type" | "created_at">[] | null) ??
    []

  const usage = computeUsageSummary({
    plan,
    timezone: profile.timezone || "UTC",
    events,
  })

  return {
    user,
    profile,
    subscription,
    usage,
    schemaReady: true,
  }
}

