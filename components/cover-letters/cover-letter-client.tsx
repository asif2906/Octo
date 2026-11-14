"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { generateCoverLetterDeterministic } from "@/lib/ai/provider"
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  Trash2,
  Clock,
  Plus,
  Check,
} from "lucide-react"
import type { CoverLetterRow } from "@/types/database"

interface CoverLetterClientProps {
  initialLetters: CoverLetterRow[]
  candidateName: string
  candidateSkills: string[]
  candidateSummary: string
  userId: string
}

export function CoverLetterClient({
  initialLetters,
  candidateName,
  candidateSkills,
  candidateSummary,
  userId,
}: CoverLetterClientProps) {
  const [letters, setLetters] = React.useState<CoverLetterRow[]>(initialLetters)
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialLetters[0]?.id || null
  )

  const selectedLetter = letters.find((l) => l.id === selectedId) || null

  const [company, setCompany] = React.useState("")
  const [jobTitle, setJobTitle] = React.useState("")
  const [tone, setTone] = React.useState("Professional")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  async function handleGenerate() {
    if (!company.trim() || !jobTitle.trim()) {
      toast({ title: "Please provide Company and Job Title", variant: "error" })
      return
    }

    setIsGenerating(true)

    // Call zero-cost deterministic or AI generation
    const generatedContent = generateCoverLetterDeterministic({
      fullName: candidateName || "Candidate",
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      skills: candidateSkills,
      tone,
      experienceSummary: candidateSummary,
    })

    const title = `${company.trim()} — ${jobTitle.trim()}`

    const { data, error } = await supabase
      .from("cover_letters")
      .insert({
        user_id: userId,
        title,
        company: company.trim(),
        job_title: jobTitle.trim(),
        tone,
        content: generatedContent,
      })
      .select()
      .single()

    setIsGenerating(false)

    if (error || !data) {
      toast({ title: "Failed to save cover letter", variant: "error" })
      return
    }

    const created = data as CoverLetterRow
    setLetters((prev) => [created, ...prev])
    setSelectedId(created.id)
    setCompany("")
    setJobTitle("")
    toast({ title: "Cover letter generated successfully", variant: "success" })
  }

  async function handleSaveEdits(newContent: string) {
    if (!selectedId) return
    const { error } = await supabase
      .from("cover_letters")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", selectedId)

    if (!error) {
      setLetters((prev) =>
        prev.map((l) => (l.id === selectedId ? { ...l, content: newContent } : l))
      )
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("cover_letters").delete().eq("id", id)
    if (!error) {
      setLetters((prev) => prev.filter((l) => l.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast({ title: "Cover letter deleted", variant: "info" })
    }
  }

  function handleCopy() {
    if (!selectedLetter) return
    navigator.clipboard.writeText(selectedLetter.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied to clipboard", variant: "success" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AI Cover Letters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate truthful, company-tailored letters using multiple strategic tones.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" /> Generate New Cover Letter
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Company Name *</Label>
            <Input
              placeholder="e.g. Stripe, Linear"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Target Job Title *</Label>
            <Input
              placeholder="e.g. Senior Frontend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Voice & Tone</Label>
            <Select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 text-sm"
            >
              <option value="Professional">Professional (Corporate & Standard)</option>
              <option value="Enthusiastic">Enthusiastic (High-energy Startup)</option>
              <option value="Executive">Executive (Authoritative & Strategic)</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Cover Letter"}
          </Button>
        </div>
      </div>

      {/* Letter Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saved letters sidebar */}
        <div className="rounded-xl border border-border/70 bg-card/40 p-4 space-y-2 max-h-[600px] overflow-y-auto">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Your Documents ({letters.length})
          </h4>
          {letters.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No letters generated yet.</p>
          ) : (
            letters.map((l) => (
              <div
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                  selectedId === l.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/50 hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <div className="truncate mr-2">
                  <p className="text-xs font-medium text-foreground truncate">{l.title}</p>
                  <p className="text-[10px] text-muted-foreground">{l.tone} · {new Date(l.created_at).toLocaleDateString()}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(l.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Editor Area */}
        <div className="md:col-span-2 rounded-xl border border-border/70 bg-card/60 p-6 space-y-4">
          {selectedLetter ? (
            <>
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <h3 className="font-bold text-foreground text-base">{selectedLetter.title}</h3>
                  <span className="text-xs text-muted-foreground">Tone: {selectedLetter.tone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 h-8">
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <Textarea
                rows={18}
                value={selectedLetter.content}
                onChange={(e) => handleSaveEdits(e.target.value)}
                className="font-mono text-xs leading-relaxed resize-y bg-background"
              />
            </>
          ) : (
            <div className="py-24 text-center text-muted-foreground text-xs">
              Select or generate a cover letter to view and edit.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

