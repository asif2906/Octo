"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import { getTimezoneOptions } from "@/lib/timezones"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProfileRecordsSection } from "@/components/profile/profile-records-section"
import { ProfileExtraSections } from "@/components/profile/profile-extra-sections"
import { ResumeImportDialog } from "@/components/profile/resume-import-dialog"
import { CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"
import type {
  CertificationRow,
  EducationRow,
  ExperienceRow,
  LanguageRow,
  ProfileRow,
  ProjectRow,
  PublicationRow,
  ReferenceRow,
  SkillRow,
  VolunteeringRow,
} from "@/types/database"

interface ProfileClientProps {
  profile: ProfileRow
  education: EducationRow[]
  experience: ExperienceRow[]
  skills: SkillRow[]
  projects: ProjectRow[]
  certifications?: CertificationRow[]
  languages?: LanguageRow[]
  publications?: PublicationRow[]
  volunteering?: VolunteeringRow[]
  references?: ReferenceRow[]
}

export function ProfileClient({
  profile,
  education,
  experience,
  skills,
  projects,
  certifications = [],
  languages = [],
  publications = [],
  volunteering = [],
  references = [],
}: ProfileClientProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    full_name: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    headline: profile.headline ?? "",
    professional_summary: profile.professional_summary ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    github_url: profile.github_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
    timezone: profile.timezone || "UTC",
  })

  // Calculate profile strength
  const completeness = React.useMemo(() => {
    let score = 0
    if (form.full_name.trim()) score += 10
    if (form.email.trim() || form.phone.trim()) score += 10
    if (form.headline.trim()) score += 10
    if (form.professional_summary.trim()) score += 15
    if (experience.length > 0) score += 20
    if (education.length > 0) score += 15
    if (skills.length >= 3) score += 10
    if (projects.length > 0 || certifications.length > 0 || languages.length > 0) score += 10
    return Math.min(score, 100)
  }, [form, experience, education, skills, projects, certifications, languages])

  const timezoneOptions = React.useMemo(
    () => getTimezoneOptions(form.timezone),
    [form.timezone]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) {
      toast({
        title: "Full name is required",
        variant: "error",
      })
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: profile.id,
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          headline: form.headline.trim() || null,
          professional_summary: form.professional_summary.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          github_url: form.github_url.trim() || null,
          portfolio_url: form.portfolio_url.trim() || null,
          timezone: form.timezone || "UTC",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    setSaving(false)
    if (error) {
      toast({
        title: "Failed to save profile",
        description: error.message,
        variant: "error",
      })
      return
    }

    await logUserActivity(supabase, {
      userId: profile.id,
      activityType: "profile_updated",
      description: "Updated professional profile details",
    })

    toast({
      title: "Profile saved successfully",
      variant: "success",
    })
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Profile Header & Completeness Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Career Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your single source of truth for AI resume tailoring and job matching.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ResumeImportDialog userId={profile.id} onImportSuccess={() => router.refresh()} />
        </div>
      </div>

      {/* Completeness Card */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">Profile Strength</span>
          </div>
          <span className="text-sm font-bold font-mono text-emerald-400">{completeness}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {completeness >= 80
            ? "Your career profile is comprehensive and ready for optimal AI matching."
            : "Complete more sections below to improve tailoring accuracy and interview conversion."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal & Contact Details</CardTitle>
            <CardDescription>
              Basic contact and location data used when building your resumes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-full-name">Full Name *</Label>
                <Input
                  id="profile-full-name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-headline">Professional Headline</Label>
                <Input
                  id="profile-headline"
                  value={form.headline}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, headline: e.target.value }))
                  }
                  placeholder="e.g. Senior Full Stack Engineer | Next.js & Cloud"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Contact Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Phone Number</Label>
                <Input
                  id="profile-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-location">Location</Label>
                <Input
                  id="profile-location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="e.g. San Francisco, CA (or Remote)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-timezone">Timezone</Label>
                <Select
                  id="profile-timezone"
                  value={form.timezone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, timezone: e.target.value }))
                  }
                >
                  {timezoneOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-linkedin">LinkedIn Profile URL</Label>
                <Input
                  id="profile-linkedin"
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, linkedin_url: e.target.value }))
                  }
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-github">GitHub URL</Label>
                <Input
                  id="profile-github"
                  type="url"
                  value={form.github_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, github_url: e.target.value }))
                  }
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-portfolio">Portfolio Website</Label>
                <Input
                  id="profile-portfolio"
                  type="url"
                  value={form.portfolio_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, portfolio_url: e.target.value }))
                  }
                  placeholder="https://yoursite.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-summary">Professional Summary</Label>
              <Textarea
                id="profile-summary"
                rows={4}
                value={form.professional_summary}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    professional_summary: e.target.value,
                  }))
                }
                placeholder="Summarize your core background, strengths, and career focus in 2-4 concise sentences."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Core Records (Experience, Education, Skills, Projects) */}
      <ProfileRecordsSection
        userId={profile.id}
        initialEducation={education}
        initialExperience={experience}
        initialSkills={skills}
        initialProjects={projects}
      />

      {/* Comprehensive Career Extensions (Certifications, Languages, Publications, Volunteering, References) */}
      <ProfileExtraSections
        userId={profile.id}
        initialCertifications={certifications}
        initialLanguages={languages}
        initialPublications={publications}
        initialVolunteering={volunteering}
        initialReferences={references}
      />
    </div>
  )
}
