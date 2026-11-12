import type { SupabaseClient } from "@supabase/supabase-js"

export async function logUserActivity(
  supabase: SupabaseClient,
  {
    userId,
    activityType,
    description,
    metadata = {},
  }: {
    userId: string
    activityType: string
    description: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      activity_type: activityType,
      description,
      metadata,
    })
  } catch {
    // Activity logging should not break primary user workflows
  }
}

