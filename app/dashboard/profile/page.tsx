import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { ProfileClient } from "@/components/profile/profile-client"
import type {
  EducationRow,
  ExperienceRow,
  ProjectRow,
  SkillRow,
} from "@/types/database"

async function ProfilePageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let education: EducationRow[] = []
  let experience: ExperienceRow[] = []
  let skills: SkillRow[] = []
  let projects: ProjectRow[] = []

  if (ctx.schemaReady) {
    const [eduRes, expRes, skillRes, projRes] = await Promise.all([
      supabase
        .from("education")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("end_date", { ascending: false, nullsFirst: true }),
      supabase
        .from("experience")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("currently_working", { ascending: false })
        .order("start_date", { ascending: false, nullsFirst: false }),
      supabase
        .from("skills")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
    ])

    education = (eduRes.data as EducationRow[] | null) ?? []
    experience = (expRes.data as ExperienceRow[] | null) ?? []
    skills = (skillRes.data as SkillRow[] | null) ?? []
    projects = (projRes.data as ProjectRow[] | null) ?? []
  }

  return (
    <ProfileClient
      profile={ctx.profile}
      education={education}
      experience={experience}
      skills={skills}
      projects={projects}
    />
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}

