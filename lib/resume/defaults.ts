import type {
  EducationRow,
  ExperienceRow,
  ProfileRow,
  ProjectRow,
  ResumeContent,
  ResumeSectionKey,
  ResumeTemplateId,
  SkillRow,
} from "@/types/database"

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
]

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
}

export const RESUME_TEMPLATES: {
  id: ResumeTemplateId
  name: string
  description: string
}[] = [
  {
    id: "modern-professional",
    name: "Modern Professional",
    description:
      "Crisp sans-serif hierarchy with subtle slate accents and structured right-aligned dates.",
  },
  {
    id: "minimal-ats",
    name: "Minimal ATS",
    description:
      "Plain single-column ATS-first formatting optimized for maximum automated parser accuracy.",
  },
  {
    id: "classic-professional",
    name: "Classic Professional",
    description:
      "Traditional centered header with serif typography suited for executive, finance, and academic roles.",
  },
]

export function createClientId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function buildResumeContentFromProfile({
  profile,
  education,
  experience,
  skills,
  projects,
  fallbackEmail = "",
}: {
  profile: ProfileRow | null
  education: EducationRow[]
  experience: ExperienceRow[]
  skills: SkillRow[]
  projects: ProjectRow[]
  fallbackEmail?: string
}): ResumeContent {
  return {
    personalInfo: {
      fullName: profile?.full_name ?? "",
      email: profile?.email || fallbackEmail,
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      headline: profile?.headline ?? "",
      summary: profile?.professional_summary ?? "",
      linkedinUrl: profile?.linkedin_url ?? "",
      githubUrl: profile?.github_url ?? "",
      portfolioUrl: profile?.portfolio_url ?? "",
    },
    experience: experience.map((item) => ({
      id: item.id,
      company: item.company,
      jobTitle: item.job_title,
      employmentType: item.employment_type ?? "Full-time",
      location: item.location ?? "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      currentlyWorking: item.currently_working,
      description: item.description ?? "",
    })),
    education: education.map((item) => ({
      id: item.id,
      institution: item.institution,
      degree: item.degree,
      fieldOfStudy: item.field_of_study ?? "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      grade: item.grade ?? "",
      description: item.description ?? "",
    })),
    skills: skills.map((item) => ({
      id: item.id,
      skillName: item.skill_name,
      proficiency: item.proficiency ?? "Proficient",
    })),
    projects: projects.map((item) => ({
      id: item.id,
      projectName: item.project_name,
      description: item.description ?? "",
      technologies: item.technologies ?? [],
      projectUrl: item.project_url ?? "",
      githubUrl: item.github_url ?? "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
    })),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  }
}

export function normalizeResumeContent(
  input: Partial<ResumeContent> | null | undefined
): ResumeContent {
  const validOrder = (input?.sectionOrder ?? []).filter(
    (key): key is ResumeSectionKey =>
      DEFAULT_SECTION_ORDER.includes(key as ResumeSectionKey)
  )
  for (const key of DEFAULT_SECTION_ORDER) {
    if (!validOrder.includes(key)) {
      validOrder.push(key)
    }
  }

  return {
    personalInfo: {
      fullName: input?.personalInfo?.fullName ?? "",
      email: input?.personalInfo?.email ?? "",
      phone: input?.personalInfo?.phone ?? "",
      location: input?.personalInfo?.location ?? "",
      headline: input?.personalInfo?.headline ?? "",
      summary: input?.personalInfo?.summary ?? "",
      linkedinUrl: input?.personalInfo?.linkedinUrl ?? "",
      githubUrl: input?.personalInfo?.githubUrl ?? "",
      portfolioUrl: input?.personalInfo?.portfolioUrl ?? "",
    },
    experience: Array.isArray(input?.experience) ? input.experience : [],
    education: Array.isArray(input?.education) ? input.education : [],
    skills: Array.isArray(input?.skills) ? input.skills : [],
    projects: Array.isArray(input?.projects) ? input.projects : [],
    sectionOrder: validOrder,
  }
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return cleaned || "resume"
}

