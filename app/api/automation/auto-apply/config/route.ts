import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SubscriptionPlan } from "@/types/database"
import { PLAN_LIMITS } from "@/lib/plans"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch user subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .maybeSingle()

    const plan: SubscriptionPlan = (sub?.plan as SubscriptionPlan) || "basic"
    const planDailyLimit =
      (PLAN_LIMITS as Record<string, { applicationsPerDay: number }>)[plan]
        ?.applicationsPerDay || 10

    // 2. Fetch active or latest configuration
    const { data: config } = await supabase
      .from("auto_apply_configurations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3. Fetch manual action items
    const { data: manualItems } = await supabase
      .from("auto_apply_run_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "needs_manual_action")
      .order("created_at", { ascending: false })
      .limit(20)

    // 4. Calculate days remaining
    let daysRemaining = 0
    let isExpired = false
    if (config?.expires_at) {
      const msLeft = new Date(config.expires_at).getTime() - Date.now()
      daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
      if (msLeft <= 0 && config.status === "running") {
        isExpired = true
      }
    }

    return NextResponse.json({
      config: config || null,
      plan,
      planDailyLimit,
      daysRemaining,
      isExpired,
      manualItems: manualItems || [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      selectedRoles,
      locations,
      dailyTarget,
      durationDays,
      status, // 'running' | 'paused' | 'stopped'
      selectedResumeId,
      timezone,
    } = body

    // 1. Fetch user subscription to validate dailyTarget limit
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()

    const plan: SubscriptionPlan = (sub?.plan as SubscriptionPlan) || "basic"
    const planDailyLimit =
      (PLAN_LIMITS as Record<string, { applicationsPerDay: number }>)[plan]
        ?.applicationsPerDay || 10

    // Enforce target limit (cannot exceed subscription entitlement)
    const sanitizedTarget = Math.max(
      1,
      Math.min(Number(dailyTarget) || 10, planDailyLimit)
    )

    // Enforce duration (1, 7, 14, 21, 30 days - capped at 30 days)
    const validDurations = [1, 7, 14, 21, 30]
    const sanitizedDuration = validDurations.includes(Number(durationDays))
      ? Number(durationDays)
      : 30

    const now = new Date()
    const expiresAt = new Date(
      now.getTime() + sanitizedDuration * 24 * 60 * 60 * 1000
    )

    // Check existing config
    const { data: existing } = await supabase
      .from("auto_apply_configurations")
      .select("id, status, expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let result
    if (existing) {
      const updatePayload: Record<string, unknown> = {
        selected_roles: Array.isArray(selectedRoles)
          ? selectedRoles
          : typeof selectedRoles === "string"
          ? selectedRoles.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        locations: Array.isArray(locations)
          ? locations
          : typeof locations === "string"
          ? [locations.trim()]
          : [],
        daily_target: sanitizedTarget,
        plan_daily_limit: planDailyLimit,
        timezone: timezone || "UTC",
        selected_resume_id: selectedResumeId || null,
        updated_at: now.toISOString(),
      }

      if (status) {
        updatePayload.status = status
      }

      if (status === "running" && existing.status !== "running") {
        updatePayload.start_at = now.toISOString()
        updatePayload.expires_at = expiresAt.toISOString()
        updatePayload.duration_days = sanitizedDuration
      }

      const { data, error } = await supabase
        .from("auto_apply_configurations")
        .update(updatePayload)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from("auto_apply_configurations")
        .insert({
          user_id: user.id,
          selected_roles: Array.isArray(selectedRoles)
            ? selectedRoles
            : typeof selectedRoles === "string"
            ? selectedRoles.split(",").map((s: string) => s.trim()).filter(Boolean)
            : ["Software Engineer"],
          locations: Array.isArray(locations)
            ? locations
            : typeof locations === "string"
            ? [locations.trim()]
            : ["Remote"],
          daily_target: sanitizedTarget,
          plan_daily_limit: planDailyLimit,
          duration_days: sanitizedDuration,
          start_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          timezone: timezone || "UTC",
          status: status || "running",
          selected_resume_id: selectedResumeId || null,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      config: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
