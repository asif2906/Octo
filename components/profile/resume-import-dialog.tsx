"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"

interface ResumeImportDialogProps {
  userId: string
  onImportSuccess: () => void
}

export function ResumeImportDialog({ userId, onImportSuccess }: ResumeImportDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [resumeText, setResumeText] = React.useState("")
  const [parsing, setParsing] = React.useState(false)
  const [parsedData, setParsedData] = React.useState<{
    fullName: string
    email: string
    phone: string
    summary: string
    skills: string[]
  } | null>(null)
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  function handleParse() {
    if (!resumeText.trim()) return
    setParsing(true)

    // Deterministic Client-side Resume Text Extraction
    const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean)

    // Name extraction heuristic: usually first line
    const fullName = lines[0] || ""

    // Email extraction
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    const email = emailMatch ? emailMatch[0] : ""

    // Phone extraction
    const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    const phone = phoneMatch ? phoneMatch[0] : ""

    // Summary extraction (look for Summary / Objective section)
    let summary = ""
    const summaryIndex = lines.findIndex((l) => /summary|objective|about/i.test(l))
    if (summaryIndex !== -1 && lines[summaryIndex + 1]) {
      summary = lines[summaryIndex + 1]
    }

    // Skills extraction: match common tech skills or comma-separated lines under "Skills"
    const commonTechSkills = [
      "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
      "Java", "C++", "Go", "SQL", "PostgreSQL", "Docker", "Kubernetes", "AWS",
      "Git", "Tailwind CSS", "HTML", "CSS", "GraphQL", "REST API", "Linux"
    ]
    const detectedSkills = commonTechSkills.filter((s) =>
      new RegExp(`\\b${s}\\b`, "i").test(resumeText)
    )

    setParsedData({
      fullName,
      email,
      phone,
      summary,
      skills: detectedSkills,
    })
    setParsing(false)
  }

  async function handleApplyToProfile() {
    if (!parsedData) return

    // Update profile
    const updates: Record<string, any> = { id: userId, updated_at: new Date().toISOString() }
    if (parsedData.fullName) updates.full_name = parsedData.fullName
    if (parsedData.email) updates.email = parsedData.email
    if (parsedData.phone) updates.phone = parsedData.phone
    if (parsedData.summary) updates.professional_summary = parsedData.summary

    await supabase.from("profiles").upsert(updates, { onConflict: "id" })

    // Insert detected skills
    if (parsedData.skills.length > 0) {
      for (const skill of parsedData.skills) {
        await supabase.from("skills").insert({
          user_id: userId,
          skill_name: skill,
          proficiency: "Intermediate",
        })
      }
    }

    toast({
      title: "Profile populated successfully",
      description: `Extracted details and ${parsedData.skills.length} skills added to your profile.`,
      variant: "success",
    })
    setOpen(false)
    setParsedData(null)
    setResumeText("")
    onImportSuccess()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" /> Import Resume Text
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-foreground">
                  Zero-Cost Resume Parser
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste your existing resume in plain text or Markdown format. Our client-side parser will extract your contact info, summary, and skills directly without uploading your documents to any paid API.
            </p>

            <div>
              <Label className="text-xs font-medium">Resume Text</Label>
              <Textarea
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume content here..."
                className="mt-1 font-mono text-xs"
              />
            </div>

            {!parsedData ? (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleParse} disabled={parsing || !resumeText.trim()}>
                  {parsing ? "Parsing..." : "Extract Profile Fields"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/40 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Profile Preview
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-medium text-foreground">{parsedData.fullName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium text-foreground">{parsedData.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="font-medium text-foreground">{parsedData.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skills Found: </span>
                    <span className="font-medium text-foreground">{parsedData.skills.join(", ") || "None"}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                  <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}>
                    Re-extract
                  </Button>
                  <Button size="sm" onClick={handleApplyToProfile}>
                    Apply to My Profile
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

