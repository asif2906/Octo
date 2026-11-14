import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [
      profile,
      education,
      experience,
      skills,
      projects,
      certifications,
      languages,
      publications,
      volunteering,
      coverLetters,
      applications,
      interviews,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("education").select("*").eq("user_id", user.id),
      supabase.from("experience").select("*").eq("user_id", user.id),
      supabase.from("skills").select("*").eq("user_id", user.id),
      supabase.from("projects").select("*").eq("user_id", user.id),
      supabase.from("certifications").select("*").eq("user_id", user.id),
      supabase.from("languages").select("*").eq("user_id", user.id),
      supabase.from("publications").select("*").eq("user_id", user.id),
      supabase.from("volunteering").select("*").eq("user_id", user.id),
      supabase.from("cover_letters").select("*").eq("user_id", user.id),
      supabase.from("applications").select("*").eq("user_id", user.id),
      supabase.from("interviews").select("*").eq("user_id", user.id),
    ])

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile.data,
      education: education.data ?? [],
      experience: experience.data ?? [],
      skills: skills.data ?? [],
      projects: projects.data ?? [],
      certifications: certifications.data ?? [],
      languages: languages.data ?? [],
      publications: publications.data ?? [],
      volunteering: volunteering.data ?? [],
      coverLetters: coverLetters.data ?? [],
      applications: applications.data ?? [],
      interviews: interviews.data ?? [],
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="octo-career-data-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failure"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
