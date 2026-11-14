"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Wrench,
  Loader2,
  X,
} from "lucide-react"
import type { ResumeContent } from "@/types/database"

interface ResumeUploadDialogProps {
  userId: string
  onComplete?: (parsedContent: ResumeContent) => void
  buttonVariant?: "default" | "outline"
  buttonText?: string
}

export function ResumeUploadDialog({
  userId,
  onComplete,
  buttonVariant = "outline",
  buttonText = "Upload Existing Resume",
}: ResumeUploadDialogProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [pasteText, setPasteText] = React.useState("")
  const [mode, setMode] = React.useState<"file" | "paste">("file")
  const [loading, setLoading] = React.useState(false)
  const [parsedData, setParsedData] = React.useState<ResumeContent | null>(null)
  const [resumeTitle, setResumeTitle] = React.useState("Imported Resume")
  const [syncToProfile, setSyncToProfile] = React.useState(true)
  const [savingResume, setSavingResume] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      const cleanTitle = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      setResumeTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1))
    }
  }

  async function handleExtract() {
    setLoading(true)
    setParsedData(null)

    try {
      const formData = new FormData()
      if (mode === "file") {
        if (!file) {
          toast({ title: "Please choose a file first", variant: "error" })
          setLoading(false)
          return
        }
        formData.append("file", file)
      } else {
        if (!pasteText.trim()) {
          toast({ title: "Please paste your resume text", variant: "error" })
          setLoading(false)
          return
        }
        formData.append("text", pasteText.trim())
      }

      const res = await fetch("/api/resumes/parse-file", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to extract resume info.")
      }

      setParsedData(data.data as ResumeContent)
      toast({
        title: "Resume parsed successfully",
        description: `Found ${data.skillsCount || 0} skills and ${data.data.experience?.length || 0} experience records.`,
        variant: "success",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error parsing resume"
      toast({ title: "Extraction error", description: msg, variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNewResume() {
    if (!parsedData) return
    setSavingResume(true)

    try {
      // 1. Create new resume record
      const { data: newResume, error: resumeErr } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          title: resumeTitle.trim() || "Uploaded Resume",
          template: "modern",
          content: parsedData,
          is_primary: false,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (resumeErr || !newResume) {
        throw new Error(resumeErr?.message || "Failed to save resume.")
      }

      // 2. Optionally sync to user's Career Profile
      if (syncToProfile) {
        const p = parsedData.personalInfo
        const profileUpdates: Record<string, any> = {
          id: userId,
          updated_at: new Date().toISOString(),
        }
        if (p.fullName) profileUpdates.full_name = p.fullName
        if (p.email) profileUpdates.email = p.email
        if (p.phone) profileUpdates.phone = p.phone
        if (p.location) profileUpdates.location = p.location
        if (p.headline) profileUpdates.headline = p.headline
        if (p.summary) profileUpdates.professional_summary = p.summary
        if (p.linkedinUrl) profileUpdates.linkedin_url = p.linkedinUrl
        if (p.githubUrl) profileUpdates.github_url = p.githubUrl
        if (p.portfolioUrl) profileUpdates.portfolio_url = p.portfolioUrl

        await supabase.from("profiles").upsert(profileUpdates, { onConflict: "id" })

        // Sync skills
        for (const skill of parsedData.skills) {
          if (skill.skillName) {
            await supabase.from("skills").insert({
              user_id: userId,
              skill_name: skill.skillName,
              proficiency: skill.proficiency || "Intermediate",
            })
          }
        }

        // Sync experiences
        for (const exp of parsedData.experience) {
          if (exp.company && exp.jobTitle) {
            await supabase.from("experience").insert({
              user_id: userId,
              company: exp.company,
              job_title: exp.jobTitle,
              location: exp.location || null,
              start_date: exp.startDate || null,
              end_date: exp.endDate || null,
              currently_working: exp.currentlyWorking || false,
              description: exp.description || null,
            })
          }
        }

        // Sync education
        for (const edu of parsedData.education) {
          if (edu.institution && edu.degree) {
            await supabase.from("education").insert({
              user_id: userId,
              institution: edu.institution,
              degree: edu.degree,
              field_of_study: edu.fieldOfStudy || null,
              start_date: edu.startDate || null,
              end_date: edu.endDate || null,
            })
          }
        }
      }

      toast({
        title: "Resume created & ready!",
        description: `Saved "${newResume.title}". Redirecting to editor...`,
        variant: "success",
      })

      if (onComplete) {
        onComplete(parsedData)
      }

      setOpen(false)
      router.push(`/dashboard/resumes/${newResume.id}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failure"
      toast({ title: "Could not save resume", description: msg, variant: "error" })
    } finally {
      setSavingResume(false)
    }
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Upload className="size-4" />
        {buttonText}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Upload & Extract Old Resume
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Upload your existing PDF or text resume to automatically parse and extract your experience, skills, and background.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input tabs: File or Paste */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  mode === "file"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Upload File (PDF / Word / Text)
              </button>
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  mode === "paste"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Paste Plain Text
              </button>
            </div>

            {mode === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-all space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  {file ? (
                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        Click to select or drag and drop your old resume
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Supports PDF (.pdf), Text (.txt), or Markdown (.md)
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs">Paste Resume Content</Label>
                <Textarea
                  rows={8}
                  placeholder="Paste the full text of your existing resume here..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            )}

            {!parsedData && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleExtract}
                  disabled={loading || (mode === "file" ? !file : !pasteText.trim())}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Extracting Info..." : "Extract Resume Data"}
                </Button>
              </div>
            )}

            {/* Extracted Preview & Save options */}
            {parsedData && (
              <div className="space-y-4 rounded-xl border border-border/80 bg-muted/30 p-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Extracted Information Preview
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setParsedData(null)} className="h-7 text-xs">
                    Re-upload
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">New Resume Title</Label>
                    <Input
                      value={resumeTitle}
                      onChange={(e) => setResumeTitle(e.target.value)}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Candidate Name</Label>
                    <Input
                      value={parsedData.personalInfo.fullName}
                      onChange={(e) =>
                        setParsedData({
                          ...parsedData,
                          personalInfo: { ...parsedData.personalInfo, fullName: e.target.value },
                        })
                      }
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      Experience: {parsedData.experience.length} roles found
                    </span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pl-5">
                    {parsedData.experience.map((exp, idx) => (
                      <div key={idx} className="text-muted-foreground">
                        <strong className="text-foreground">{exp.jobTitle}</strong> at {exp.company} ({exp.startDate} - {exp.endDate})
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      Skills Extracted ({parsedData.skills.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-5 max-h-24 overflow-y-auto">
                    {parsedData.skills.map((s, idx) => (
                      <span key={idx} className="rounded bg-muted px-2 py-0.5 text-[10px] text-foreground font-medium">
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Profile sync checkbox */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <input
                    type="checkbox"
                    id="sync-profile"
                    checked={syncToProfile}
                    onChange={(e) => setSyncToProfile(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="sync-profile" className="text-xs cursor-pointer text-foreground">
                    Also synchronize extracted background into my <strong>Career Profile</strong>
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNewResume}
                    disabled={savingResume}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {savingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {savingResume ? "Saving Resume..." : "Save as New Resume & Edit"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

