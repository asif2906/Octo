"use client"

import * as React from "react"
import { Plus, Trash2, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  EducationRow,
  ExperienceRow,
  ProjectRow,
  SkillRow,
} from "@/types/database"

interface ProfileRecordsSectionProps {
  userId: string
  initialEducation: EducationRow[]
  initialExperience: ExperienceRow[]
  initialSkills: SkillRow[]
  initialProjects: ProjectRow[]
}

type DeleteTarget =
  | { table: "education"; id: string; label: string }
  | { table: "experience"; id: string; label: string }
  | { table: "skills"; id: string; label: string }
  | { table: "projects"; id: string; label: string }
  | null

export function ProfileRecordsSection({
  userId,
  initialEducation,
  initialExperience,
  initialSkills,
  initialProjects,
}: ProfileRecordsSectionProps) {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [education, setEducation] = React.useState(initialEducation)
  const [experience, setExperience] = React.useState(initialExperience)
  const [skills, setSkills] = React.useState(initialSkills)
  const [projects, setProjects] = React.useState(initialProjects)

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Experience form state
  const [expEditingId, setExpEditingId] = React.useState<string | null>(null)
  const [expOpen, setExpOpen] = React.useState(false)
  const [expSaving, setExpSaving] = React.useState(false)
  const [expForm, setExpForm] = React.useState({
    company: "",
    job_title: "",
    employment_type: "Full-time",
    location: "",
    start_date: "",
    end_date: "",
    currently_working: false,
    description: "",
  })

  // Education form state
  const [eduEditingId, setEduEditingId] = React.useState<string | null>(null)
  const [eduOpen, setEduOpen] = React.useState(false)
  const [eduSaving, setEduSaving] = React.useState(false)
  const [eduForm, setEduForm] = React.useState({
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    grade: "",
    description: "",
  })

  // Skills form state
  const [skillName, setSkillName] = React.useState("")
  const [skillProficiency, setSkillProficiency] = React.useState("Proficient")
  const [skillSaving, setSkillSaving] = React.useState(false)

  // Projects form state
  const [projEditingId, setProjEditingId] = React.useState<string | null>(null)
  const [projOpen, setProjOpen] = React.useState(false)
  const [projSaving, setProjSaving] = React.useState(false)
  const [projForm, setProjForm] = React.useState({
    project_name: "",
    description: "",
    technologies: "",
    project_url: "",
    github_url: "",
    start_date: "",
    end_date: "",
  })

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from(deleteTarget.table)
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", userId)
    setDeleting(false)

    if (error) {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "error",
      })
      return
    }

    if (deleteTarget.table === "education") {
      setEducation((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    } else if (deleteTarget.table === "experience") {
      setExperience((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    } else if (deleteTarget.table === "skills") {
      setSkills((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    } else if (deleteTarget.table === "projects") {
      setProjects((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    }

    toast({
      title: "Removed from profile",
      description: deleteTarget.label,
      variant: "success",
    })
    setDeleteTarget(null)
  }

  async function saveExperience(e: React.FormEvent) {
    e.preventDefault()
    if (!expForm.company.trim() || !expForm.job_title.trim()) {
      toast({
        title: "Missing required fields",
        description: "Company and job title are required.",
        variant: "error",
      })
      return
    }
    setExpSaving(true)
    const payload = {
      user_id: userId,
      company: expForm.company.trim(),
      job_title: expForm.job_title.trim(),
      employment_type: expForm.employment_type.trim() || null,
      location: expForm.location.trim() || null,
      start_date: expForm.start_date || null,
      end_date: expForm.currently_working ? null : expForm.end_date || null,
      currently_working: expForm.currently_working,
      description: expForm.description.trim() || null,
    }

    const res = expEditingId
      ? await supabase
          .from("experience")
          .update(payload)
          .eq("id", expEditingId)
          .eq("user_id", userId)
          .select("*")
          .single()
      : await supabase.from("experience").insert(payload).select("*").single()

    setExpSaving(false)
    if (res.error || !res.data) {
      toast({
        title: "Could not save experience",
        description: res.error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = res.data as ExperienceRow
    setExperience((prev) =>
      expEditingId
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev]
    )
    await logUserActivity(supabase, {
      userId,
      activityType: "profile_experience_saved",
      description: `${expEditingId ? "Updated" : "Added"} experience: ${saved.job_title} at ${saved.company}`,
    })
    toast({ title: "Experience saved", variant: "success" })
    setExpOpen(false)
    setExpEditingId(null)
    setExpForm({
      company: "",
      job_title: "",
      employment_type: "Full-time",
      location: "",
      start_date: "",
      end_date: "",
      currently_working: false,
      description: "",
    })
  }

  async function saveEducation(e: React.FormEvent) {
    e.preventDefault()
    if (!eduForm.institution.trim() || !eduForm.degree.trim()) {
      toast({
        title: "Missing required fields",
        description: "Institution and degree are required.",
        variant: "error",
      })
      return
    }
    setEduSaving(true)
    const payload = {
      user_id: userId,
      institution: eduForm.institution.trim(),
      degree: eduForm.degree.trim(),
      field_of_study: eduForm.field_of_study.trim() || null,
      start_date: eduForm.start_date || null,
      end_date: eduForm.end_date || null,
      grade: eduForm.grade.trim() || null,
      description: eduForm.description.trim() || null,
    }

    const res = eduEditingId
      ? await supabase
          .from("education")
          .update(payload)
          .eq("id", eduEditingId)
          .eq("user_id", userId)
          .select("*")
          .single()
      : await supabase.from("education").insert(payload).select("*").single()

    setEduSaving(false)
    if (res.error || !res.data) {
      toast({
        title: "Could not save education",
        description: res.error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = res.data as EducationRow
    setEducation((prev) =>
      eduEditingId
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev]
    )
    toast({ title: "Education saved", variant: "success" })
    setEduOpen(false)
    setEduEditingId(null)
    setEduForm({
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      grade: "",
      description: "",
    })
  }

  async function addSkill(e: React.FormEvent) {
    e.preventDefault()
    if (!skillName.trim()) return
    setSkillSaving(true)
    const { data, error } = await supabase
      .from("skills")
      .insert({
        user_id: userId,
        skill_name: skillName.trim(),
        proficiency: skillProficiency,
      })
      .select("*")
      .single()
    setSkillSaving(false)
    if (error || !data) {
      toast({
        title: "Could not add skill",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }
    setSkills((prev) => [...prev, data as SkillRow])
    setSkillName("")
    toast({ title: "Skill added", variant: "success" })
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projForm.project_name.trim()) {
      toast({
        title: "Project name is required",
        variant: "error",
      })
      return
    }
    setProjSaving(true)
    const technologies = projForm.technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    const payload = {
      user_id: userId,
      project_name: projForm.project_name.trim(),
      description: projForm.description.trim() || null,
      technologies,
      project_url: projForm.project_url.trim() || null,
      github_url: projForm.github_url.trim() || null,
      start_date: projForm.start_date || null,
      end_date: projForm.end_date || null,
    }

    const res = projEditingId
      ? await supabase
          .from("projects")
          .update(payload)
          .eq("id", projEditingId)
          .eq("user_id", userId)
          .select("*")
          .single()
      : await supabase.from("projects").insert(payload).select("*").single()

    setProjSaving(false)
    if (res.error || !res.data) {
      toast({
        title: "Could not save project",
        description: res.error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = res.data as ProjectRow
    setProjects((prev) =>
      projEditingId
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev]
    )
    toast({ title: "Project saved", variant: "success" })
    setProjOpen(false)
    setProjEditingId(null)
    setProjForm({
      project_name: "",
      description: "",
      technologies: "",
      project_url: "",
      github_url: "",
      start_date: "",
      end_date: "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Work Experience</CardTitle>
            <CardDescription>
              Saved roles automatically populate new resumes
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setExpEditingId(null)
              setExpForm({
                company: "",
                job_title: "",
                employment_type: "Full-time",
                location: "",
                start_date: "",
                end_date: "",
                currently_working: false,
                description: "",
              })
              setExpOpen((v) => !v)
            }}
          >
            <Plus className="size-3.5" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {expOpen ? (
            <form
              onSubmit={saveExperience}
              className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="exp-job-title">Job Title *</Label>
                  <Input
                    id="exp-job-title"
                    value={expForm.job_title}
                    onChange={(e) =>
                      setExpForm((p) => ({ ...p, job_title: e.target.value }))
                    }
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-company">Company *</Label>
                  <Input
                    id="exp-company"
                    value={expForm.company}
                    onChange={(e) =>
                      setExpForm((p) => ({ ...p, company: e.target.value }))
                    }
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-type">Employment Type</Label>
                  <Select
                    id="exp-type"
                    value={expForm.employment_type}
                    onChange={(e) =>
                      setExpForm((p) => ({
                        ...p,
                        employment_type: e.target.value,
                      }))
                    }
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-location">Location</Label>
                  <Input
                    id="exp-location"
                    value={expForm.location}
                    onChange={(e) =>
                      setExpForm((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="Remote / San Francisco, CA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-start">Start Date</Label>
                  <Input
                    id="exp-start"
                    type="date"
                    value={expForm.start_date}
                    onChange={(e) =>
                      setExpForm((p) => ({ ...p, start_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-end">End Date</Label>
                  <Input
                    id="exp-end"
                    type="date"
                    disabled={expForm.currently_working}
                    value={expForm.end_date}
                    onChange={(e) =>
                      setExpForm((p) => ({ ...p, end_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={expForm.currently_working}
                  onChange={(e) =>
                    setExpForm((p) => ({
                      ...p,
                      currently_working: e.target.checked,
                    }))
                  }
                />
                I currently work here
              </label>
              <div className="space-y-1.5">
                <Label htmlFor="exp-desc">Highlights / Description</Label>
                <Textarea
                  id="exp-desc"
                  rows={4}
                  value={expForm.description}
                  onChange={(e) =>
                    setExpForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Write one bullet point per line describing measurable outcomes."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={expSaving}>
                  {expSaving ? "Saving..." : "Save Experience"}
                </Button>
              </div>
            </form>
          ) : null}

          {experience.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No work experience added yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {experience.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.job_title} · {item.company}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.start_date || "Start N/A"} —{" "}
                      {item.currently_working
                        ? "Present"
                        : item.end_date || "End N/A"}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    {item.description ? (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Edit ${item.job_title}`}
                      onClick={() => {
                        setExpEditingId(item.id)
                        setExpForm({
                          company: item.company,
                          job_title: item.job_title,
                          employment_type: item.employment_type ?? "Full-time",
                          location: item.location ?? "",
                          start_date: item.start_date ?? "",
                          end_date: item.end_date ?? "",
                          currently_working: item.currently_working,
                          description: item.description ?? "",
                        })
                        setExpOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${item.job_title}`}
                      onClick={() =>
                        setDeleteTarget({
                          table: "experience",
                          id: item.id,
                          label: `${item.job_title} at ${item.company}`,
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Education</CardTitle>
            <CardDescription>
              Degrees, institutions, and academic background
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEduEditingId(null)
              setEduForm({
                institution: "",
                degree: "",
                field_of_study: "",
                start_date: "",
                end_date: "",
                grade: "",
                description: "",
              })
              setEduOpen((v) => !v)
            }}
          >
            <Plus className="size-3.5" />
            Add Education
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {eduOpen ? (
            <form
              onSubmit={saveEducation}
              className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edu-institution">Institution *</Label>
                  <Input
                    id="edu-institution"
                    value={eduForm.institution}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, institution: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-degree">Degree *</Label>
                  <Input
                    id="edu-degree"
                    value={eduForm.degree}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, degree: e.target.value }))
                    }
                    placeholder="B.S."
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-field">Field of Study</Label>
                  <Input
                    id="edu-field"
                    value={eduForm.field_of_study}
                    onChange={(e) =>
                      setEduForm((p) => ({
                        ...p,
                        field_of_study: e.target.value,
                      }))
                    }
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-grade">Grade / GPA</Label>
                  <Input
                    id="edu-grade"
                    value={eduForm.grade}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, grade: e.target.value }))
                    }
                    placeholder="3.8 / 4.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-start">Start Date</Label>
                  <Input
                    id="edu-start"
                    type="date"
                    value={eduForm.start_date}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, start_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-end">End Date</Label>
                  <Input
                    id="edu-end"
                    type="date"
                    value={eduForm.end_date}
                    onChange={(e) =>
                      setEduForm((p) => ({ ...p, end_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edu-desc">Details</Label>
                <Textarea
                  id="edu-desc"
                  rows={3}
                  value={eduForm.description}
                  onChange={(e) =>
                    setEduForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEduOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={eduSaving}>
                  {eduSaving ? "Saving..." : "Save Education"}
                </Button>
              </div>
            </form>
          ) : null}

          {education.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No education entries added yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {education.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.degree}
                      {item.field_of_study ? ` in ${item.field_of_study}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.institution}
                      {item.grade ? ` · ${item.grade}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Edit ${item.institution}`}
                      onClick={() => {
                        setEduEditingId(item.id)
                        setEduForm({
                          institution: item.institution,
                          degree: item.degree,
                          field_of_study: item.field_of_study ?? "",
                          start_date: item.start_date ?? "",
                          end_date: item.end_date ?? "",
                          grade: item.grade ?? "",
                          description: item.description ?? "",
                        })
                        setEduOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${item.institution}`}
                      onClick={() =>
                        setDeleteTarget({
                          table: "education",
                          id: item.id,
                          label: `${item.degree} at ${item.institution}`,
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Technical and domain skills used across your resumes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addSkill} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="TypeScript, PostgreSQL, Product Strategy..."
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="skill-level">Proficiency</Label>
              <Select
                id="skill-level"
                value={skillProficiency}
                onChange={(e) => setSkillProficiency(e.target.value)}
              >
                <option value="Expert">Expert</option>
                <option value="Proficient">Proficient</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Familiar">Familiar</option>
              </Select>
            </div>
            <Button type="submit" disabled={skillSaving || !skillName.trim()}>
              <Plus className="size-3.5" />
              {skillSaving ? "Adding..." : "Add Skill"}
            </Button>
          </form>

          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pr-2 pl-3 text-xs"
                >
                  <span className="font-medium text-foreground">
                    {item.skill_name}
                  </span>
                  {item.proficiency ? (
                    <span className="text-muted-foreground">
                      ({item.proficiency})
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Remove ${item.skill_name}`}
                    onClick={() =>
                      setDeleteTarget({
                        table: "skills",
                        id: item.id,
                        label: item.skill_name,
                      })
                    }
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Notable projects, repositories, and launched products
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setProjEditingId(null)
              setProjForm({
                project_name: "",
                description: "",
                technologies: "",
                project_url: "",
                github_url: "",
                start_date: "",
                end_date: "",
              })
              setProjOpen((v) => !v)
            }}
          >
            <Plus className="size-3.5" />
            Add Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {projOpen ? (
            <form
              onSubmit={saveProject}
              className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-name">Project Name *</Label>
                  <Input
                    id="proj-name"
                    value={projForm.project_name}
                    onChange={(e) =>
                      setProjForm((p) => ({
                        ...p,
                        project_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-tech">Technologies (comma separated)</Label>
                  <Input
                    id="proj-tech"
                    value={projForm.technologies}
                    onChange={(e) =>
                      setProjForm((p) => ({
                        ...p,
                        technologies: e.target.value,
                      }))
                    }
                    placeholder="Next.js, TypeScript, Supabase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-url">Project URL</Label>
                  <Input
                    id="proj-url"
                    type="url"
                    value={projForm.project_url}
                    onChange={(e) =>
                      setProjForm((p) => ({ ...p, project_url: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-github">GitHub URL</Label>
                  <Input
                    id="proj-github"
                    type="url"
                    value={projForm.github_url}
                    onChange={(e) =>
                      setProjForm((p) => ({ ...p, github_url: e.target.value }))
                    }
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-desc">Description</Label>
                <Textarea
                  id="proj-desc"
                  rows={3}
                  value={projForm.description}
                  onChange={(e) =>
                    setProjForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProjOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={projSaving}>
                  {projSaving ? "Saving..." : "Save Project"}
                </Button>
              </div>
            </form>
          ) : null}

          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects added yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {projects.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.project_name}
                    </p>
                    {item.technologies?.length ? (
                      <p className="text-xs text-muted-foreground">
                        {item.technologies.join(", ")}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Edit ${item.project_name}`}
                      onClick={() => {
                        setProjEditingId(item.id)
                        setProjForm({
                          project_name: item.project_name,
                          description: item.description ?? "",
                          technologies: (item.technologies ?? []).join(", "),
                          project_url: item.project_url ?? "",
                          github_url: item.github_url ?? "",
                          start_date: item.start_date ?? "",
                          end_date: item.end_date ?? "",
                        })
                        setProjOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${item.project_name}`}
                      onClick={() =>
                        setDeleteTarget({
                          table: "projects",
                          id: item.id,
                          label: item.project_name,
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete profile entry?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.label}" from your profile.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

