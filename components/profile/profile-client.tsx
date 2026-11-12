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
import type {
  EducationRow,
  ExperienceRow,
  ProfileRow,
  ProjectRow,
  SkillRow,
} from "@/types/database"

interface ProfileClientProps {
  profile: ProfileRow
  education: EducationRow[]
  experience: ExperienceRow[]
  skills: SkillRow[]
  projects: ProjectRow[]
}

export function ProfileClient({
  profile,
  education,
  experience,
  skills,
  projects,
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
      description: "Updated profile information",
    })

    toast({
      title: "Profile updated",
      description: "Your details are saved and ready for your resumes.",
      variant: "success",
    })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintain your master career details to pre-fill new resumes cleanly.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Details & Summary</CardTitle>
            <CardDescription>
              Last saved:{" "}
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: profile.timezone || "UTC",
              }).format(new Date(profile.updated_at))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-full-name">Full Name *</Label>
                <Input
                  id="profile-full-name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  placeholder="Alex Rivera"
                  required
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
                  placeholder="alex@example.com"
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
                  placeholder="+1 (555) 123-4567"
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
                  placeholder="Austin, TX"
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
                  placeholder="Full-Stack Software Engineer"
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
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-linkedin">LinkedIn URL</Label>
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

      <ProfileRecordsSection
        userId={profile.id}
        initialEducation={education}
        initialExperience={experience}
        initialSkills={skills}
        initialProjects={projects}
      />
    </div>
  )
}

