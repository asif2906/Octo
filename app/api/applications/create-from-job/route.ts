import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateJobMatchDeterministic, generateCoverLetterDeterministic } from "@/lib/ai/provider"
import { buildResumeContentFromProfile } from "@/lib/resume/defaults"
import type { EducationRow, ExperienceRow, ProjectRow, SkillRow } from "@/types/database"

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
      company,
      title: jobTitle,
      location = "Remote",
      description = "",
      applyUrl,
      skillsRequired = [],
      salaryRange,
    } = body

    if (!company || !jobTitle) {
      return NextResponse.json(
        { error: "Company and job title are required to start an application." },
        { status: 400 }
      )
    }

    // 1. Fetch user profile, skills, and background for truthful tailoring
    const [profileRes, skillsRes, expRes, eduRes, projRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("skills").select("*").eq("user_id", user.id),
      supabase.from("experience").select("*").eq("user_id", user.id),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("projects").select("*").eq("user_id", user.id),
    ])

    const profile = profileRes.data
    const skills = (skillsRes.data as SkillRow[] | null) ?? []
    const experience = (expRes.data as ExperienceRow[] | null) ?? []
    const education = (eduRes.data as EducationRow[] | null) ?? []
    const projects = (projRes.data as ProjectRow[] | null) ?? []

    const candidateSkillNames = skills.map((s) => s.skill_name)

    // 2. Produce Compatibility Assessment
    const match = calculateJobMatchDeterministic(
      candidateSkillNames,
      jobTitle,
      description,
      skillsRequired
    )

    // 3. Generate Tailored Resume (Truthful, ATS-optimized)
    const baseContent = buildResumeContentFromProfile({
      profile,
      education,
      experience,
      skills,
      projects,
      fallbackEmail: user.email ?? "",
    })

    // Tailor summary to emphasize target role
    if (baseContent.personalInfo.summary) {
      baseContent.personalInfo.headline = `${jobTitle} | ${profile?.headline || "Software Engineer"}`
    }

    const { data: createdResume } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title: `Tailored: ${company} — ${jobTitle}`,
        template: "modern",
        content: baseContent,
        is_primary: false,
      })
      .select()
      .single()

    // 4. Generate Tailored Cover Letter
    const coverLetterContent = generateCoverLetterDeterministic({
      fullName: profile?.full_name || "Candidate",
      company,
      jobTitle,
      skills: candidateSkillNames,
      tone: "Professional",
      experienceSummary: profile?.professional_summary || "",
    })

    const { data: createdCoverLetter } = await supabase
      .from("cover_letters")
      .insert({
        user_id: user.id,
        title: `Cover Letter: ${company} — ${jobTitle}`,
        company,
        job_title: jobTitle,
        tone: "Professional",
        content: coverLetterContent,
        resume_id: createdResume?.id || null,
      })
      .select()
      .single()

    // 5. Save Application as Draft in Application Tracker
    const { data: createdApp, error: appErr } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        company,
        job_title: jobTitle,
        job_url: applyUrl || null,
        location: location || null,
        job_description: description || null,
        resume_id: createdResume?.id || null,
        cover_letter_id: createdCoverLetter?.id || null,
        match_score: match.score,
        match_reasoning: match.reasoning,
        salary_range: salaryRange || null,
        status: "draft",
        application_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single()

    if (appErr || !createdApp) {
      console.error("[Start Application API] DB Error:", appErr)
      return NextResponse.json(
        { error: appErr?.message || "Failed to create application draft." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applicationId: createdApp.id,
      resumeId: createdResume?.id,
      coverLetterId: createdCoverLetter?.id,
      matchScore: match.score,
      company,
      jobTitle,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating application"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
