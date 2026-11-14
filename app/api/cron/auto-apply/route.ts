import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { calculateJobMatch, tailorResumeAI, generateCoverLetter } from "@/lib/ai/provider"
import type { SubscriptionPlan } from "@/types/database"
import { PLAN_LIMITS } from "@/lib/plans"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const isCronHeader =
        req.headers.get("x-vercel-cron") ||
        req.headers.get("user-agent")?.includes("vercel-cron")
      if (!isCronHeader) {
        return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 })
      }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const now = new Date()

    // 1. Check and mark expired configurations (durations expired > now)
    await supabaseAdmin
      .from("auto_apply_configurations")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("status", "running")
      .lte("expires_at", now.toISOString())

    // 2. Fetch active running configurations
    const { data: configs, error: configErr } = await supabaseAdmin
      .from("auto_apply_configurations")
      .select("*")
      .eq("status", "running")
      .gt("expires_at", now.toISOString())

    if (configErr) {
      return NextResponse.json({ error: configErr.message }, { status: 500 })
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active running auto-apply configurations found.",
        processedUsers: 0,
      })
    }

    const executionResults = []

    for (const config of configs) {
      try {
        const userId = config.user_id

        // Fetch user subscription & plan daily limit
        const { data: subData } = await supabaseAdmin
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", userId)
          .maybeSingle()

        const planId: SubscriptionPlan = (subData?.plan as SubscriptionPlan) || "basic"
        const planMax =
          (PLAN_LIMITS as Record<string, { applicationsPerDay: number }>)[planId]
            ?.applicationsPerDay || 10

        // Daily target cannot exceed subscription plan entitlement
        const effectiveDailyTarget = Math.min(config.daily_target, planMax)

        // Calculate user local date
        const userTz = config.timezone || "UTC"
        const localDateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: userTz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now)

        // Count today's successful submissions from usage_events
        const { count: submittedTodayCount } = await supabaseAdmin
          .from("usage_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("event_type", "auto_apply_submission")
          .gte("created_at", `${localDateStr}T00:00:00Z`)

        const submittedToday = submittedTodayCount || 0
        const quotaRemaining = Math.max(0, effectiveDailyTarget - submittedToday)

        if (quotaRemaining <= 0) {
          executionResults.push({
            userId,
            status: "target_reached",
            submittedToday,
            dailyTarget: effectiveDailyTarget,
          })
          continue
        }

        // Fetch user's existing applications to avoid duplicate submissions
        const { data: existingApps } = await supabaseAdmin
          .from("applications")
          .select("company, job_title")
          .eq("user_id", userId)

        const existingKeys = new Set(
          (existingApps || []).map((a) => `${a.company.toLowerCase()}|${a.job_title.toLowerCase()}`)
        )

        // Fetch eligible unapplied job postings matching target roles
        const rolesList: string[] = config.selected_roles || []
        const { data: availableJobs } = await supabaseAdmin
          .from("job_postings")
          .select("*")
          .order("posted_at", { ascending: false })
          .limit(30)

        // Filter jobs matching user roles
        const matchingJobs = (availableJobs || []).filter((j) => {
          const key = `${j.company.toLowerCase()}|${j.title.toLowerCase()}`
          if (existingKeys.has(key)) return false

          if (rolesList.length === 0) return true
          const titleLower = j.title.toLowerCase()
          return rolesList.some((role) => titleLower.includes(role.toLowerCase().trim()))
        })

        // Create or get today's run record
        let runId = null
        const { data: existingRun } = await supabaseAdmin
          .from("auto_apply_runs")
          .select("id, successful_submissions, failed_attempts")
          .eq("config_id", config.id)
          .eq("run_date", localDateStr)
          .maybeSingle()

        if (existingRun) {
          runId = existingRun.id
        } else {
          const { data: newRun } = await supabaseAdmin
            .from("auto_apply_runs")
            .insert({
              config_id: config.id,
              user_id: userId,
              run_date: localDateStr,
              status: "running",
            })
            .select("id")
            .single()
          runId = newRun?.id
        }

        let newlySubmitted = 0
        let manualActionCount = 0

        // Fetch user primary resume or selected resume
        const { data: resumeData } = await supabaseAdmin
          .from("resumes")
          .select("*")
          .eq("id", config.selected_resume_id || "")
          .maybeSingle()

        const baseResumeObj = resumeData?.content || {}

        for (const job of matchingJobs.slice(0, quotaRemaining)) {
          try {
            // Assess match with central Gemini service
            const match = await calculateJobMatch(
              job.skills_required || [],
              job.title,
              job.description || ""
            )

            // If requires captcha or external portal login, classify as needs_manual_action
            const requiresManual =
              job.apply_url?.includes("login") ||
              job.apply_url?.includes("auth") ||
              job.description?.toLowerCase().includes("security clearance")

            if (requiresManual) {
              await supabaseAdmin.from("auto_apply_run_items").insert({
                run_id: runId,
                user_id: userId,
                job_id: job.id,
                job_title: job.title,
                company: job.company,
                source: job.source,
                apply_url: job.apply_url,
                status: "needs_manual_action",
                match_score: match.score,
                notes: "External portal login or manual clearance required.",
              })
              manualActionCount++
              continue
            }

            // Generate tailored resume and cover letter
            const tailoredResume = await tailorResumeAI({
              baseResume: baseResumeObj,
              jobTitle: job.title,
              company: job.company,
              jobDescription: job.description || "",
              candidateSkills: job.skills_required || [],
            })

            const coverLetter = await generateCoverLetter({
              fullName: "Candidate",
              company: job.company,
              jobTitle: job.title,
              skills: job.skills_required || [],
              jobDescription: job.description || "",
            })

            // Create cover letter record
            const { data: clRecord } = await supabaseAdmin
              .from("cover_letters")
              .insert({
                user_id: userId,
                title: `Cover Letter - ${job.company} (${job.title})`,
                job_title: job.title,
                company: job.company,
                content: coverLetter,
              })
              .select("id")
              .single()

            // Record application
            await supabaseAdmin.from("applications").insert({
              user_id: userId,
              company: job.company,
              job_title: job.title,
              job_url: job.apply_url,
              location: job.location,
              job_description: job.description?.slice(0, 1000),
              status: "applied",
              application_date: localDateStr,
              match_score: match.score,
              match_reasoning: match.reasoning,
              cover_letter_id: clRecord?.id || null,
            })

            // Record run item
            await supabaseAdmin.from("auto_apply_run_items").insert({
              run_id: runId,
              user_id: userId,
              job_id: job.id,
              job_title: job.title,
              company: job.company,
              source: job.source,
              apply_url: job.apply_url,
              status: "submitted",
              match_score: match.score,
              cover_letter_id: clRecord?.id || null,
            })

            // Log usage event
            await supabaseAdmin.from("usage_events").insert({
              user_id: userId,
              event_type: "auto_apply_submission",
              details: { job_id: job.id, company: job.company, role: job.title },
            })

            newlySubmitted++
          } catch (jobErr) {
            console.warn("[Auto-Apply Job Item Failed]:", jobErr)
          }
        }

        // Update run stats
        if (runId) {
          await supabaseAdmin
            .from("auto_apply_runs")
            .update({
              successful_submissions: (submittedToday || 0) + newlySubmitted,
              status: "completed",
            })
            .eq("id", runId)
        }

        executionResults.push({
          userId,
          status: "processed",
          newlySubmitted,
          manualActionCount,
          totalToday: submittedToday + newlySubmitted,
          dailyTarget: effectiveDailyTarget,
        })
      } catch (userErr: unknown) {
        console.error(`[Auto-Apply User ${config.user_id} Failed]:`, userErr)
        executionResults.push({
          userId: config.user_id,
          status: "error",
          error: userErr instanceof Error ? userErr.message : String(userErr),
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedCount: configs.length,
      results: executionResults,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
