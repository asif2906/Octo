import { NextRequest, NextResponse } from "next/server"
import { discoverAllPublicJobs } from "@/lib/jobs/catalog"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow execution if bearer token matches or in dev/test environment
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const isCronHeader = req.headers.get("x-vercel-cron") || req.headers.get("user-agent")?.includes("vercel-cron")
      if (!isCronHeader) {
        return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 })
      }
    }

    // 1. Discover public jobs across all active sources
    const jobs = await discoverAllPublicJobs()

    // 2. Persist to Supabase job_postings catalog
    let persistedCount = 0
    let errCount = 0

    try {
      const supabaseAdmin = getSupabaseAdmin()

      // Insert or update batch into job_postings
      for (const job of jobs) {
        const { error } = await supabaseAdmin
          .from("job_postings")
          .upsert(
            {
              external_id: job.externalId,
              source: job.source,
              title: job.title,
              company: job.company,
              location: job.location,
              is_remote: job.isRemote,
              employment_type: job.employmentType,
              experience_level: job.experienceLevel,
              description: job.description,
              salary_range: job.salaryRange || null,
              apply_url: job.applyUrl,
              company_url: job.companyUrl || null,
              skills_required: job.skillsRequired,
              is_startup: job.isStartup,
              posted_at: job.postedAt,
            },
            { onConflict: "source,external_id" }
          )

        if (!error) {
          persistedCount++
        } else {
          errCount++
        }
      }
    } catch (dbErr) {
      console.warn("[Cron Job Discovery] Database upsert warning:", dbErr)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeSources: ["greenhouse", "lever", "remoteok", "hackernews", "ycombinator"],
      totalDiscovered: jobs.length,
      persistedCount,
      errors: errCount,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
