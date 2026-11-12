import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { buildResumeContentFromProfile } from "@/lib/resume/defaults"
import { ResumeEditor } from "@/components/resume/resume-editor"
import type {
  EducationRow,
  ExperienceRow,
  ProjectRow,
  SkillRow,
} from "@/types/database"

async function NewResumeContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let education: EducationRow[] = []
  let experience: ExperienceRow[] = []
  let skills: SkillRow[] = []
  let projects: ProjectRow[] = []
  let existingCount = 0

  if (ctx.schemaReady) {
    const [eduRes, expRes, skillRes, projRes, resumesRes] = await Promise.all([
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
      supabase
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id),
    ])

    education = (eduRes.data as EducationRow[] | null) ?? []
    experience = (expRes.data as ExperienceRow[] | null) ?? []
    skills = (skillRes.data as SkillRow[] | null) ?? []
    projects = (projRes.data as ProjectRow[] | null) ?? []
    existingCount = resumesRes.count ?? 0
  }

  const initialContent = buildResumeContentFromProfile({
    profile: ctx.profile,
    education,
    experience,
    skills,
    projects,
    fallbackEmail: ctx.user.email ?? "",
  })

  return (
    <ResumeEditor
      userId={ctx.user.id}
      initialTitle={
        ctx.profile.headline?.trim()
          ? `${ctx.profile.headline.trim()} Resume`
          : "My ATS Resume"
      }
      initialTemplate="modern-professional"
      initialIsPrimary={existingCount === 0}
      initialContent={initialContent}
    />
  )
}

export default function NewResumePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-14 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <NewResumeContent />
    </Suspense>
  )
}

