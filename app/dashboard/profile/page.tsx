import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { ProfileClient } from "@/components/profile/profile-client"
import type {
  CertificationRow,
  EducationRow,
  ExperienceRow,
  LanguageRow,
  ProjectRow,
  PublicationRow,
  ReferenceRow,
  SkillRow,
  VolunteeringRow,
} from "@/types/database"

async function ProfilePageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let education: EducationRow[] = []
  let experience: ExperienceRow[] = []
  let skills: SkillRow[] = []
  let projects: ProjectRow[] = []
  let certifications: CertificationRow[] = []
  let languages: LanguageRow[] = []
  let publications: PublicationRow[] = []
  let volunteering: VolunteeringRow[] = []
  let references: ReferenceRow[] = []

  if (ctx.schemaReady) {
    const [
      eduRes,
      expRes,
      skillRes,
      projRes,
      certRes,
      langRes,
      pubRes,
      volRes,
      refRes,
    ] = await Promise.all([
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
        .from("certifications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("languages")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("publications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("volunteering")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("references")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
    ])

    education = (eduRes.data as EducationRow[] | null) ?? []
    experience = (expRes.data as ExperienceRow[] | null) ?? []
    skills = (skillRes.data as SkillRow[] | null) ?? []
    projects = (projRes.data as ProjectRow[] | null) ?? []
    certifications = (certRes.data as CertificationRow[] | null) ?? []
    languages = (langRes.data as LanguageRow[] | null) ?? []
    publications = (pubRes.data as PublicationRow[] | null) ?? []
    volunteering = (volRes.data as VolunteeringRow[] | null) ?? []
    references = (refRes.data as ReferenceRow[] | null) ?? []
  }

  return (
    <ProfileClient
      profile={ctx.profile}
      education={education}
      experience={experience}
      skills={skills}
      projects={projects}
      certifications={certifications}
      languages={languages}
      publications={publications}
      volunteering={volunteering}
      references={references}
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
