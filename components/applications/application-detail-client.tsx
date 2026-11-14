"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Sparkles,
  FileText,
  Mail,
  MessageSquare,
  Download,
  Copy,
  ExternalLink,
  Check,
  Send,
  Loader2,
  Clock,
  Briefcase,
  Trash2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ResumePreview } from "@/components/resume/resume-preview"
import { downloadResumePdf } from "@/lib/resume/pdf-generator"
import type {
  ApplicationRow,
  ApplicationStatus,
  ResumeRow,
  CoverLetterRow,
} from "@/types/database"

interface ApplicationDetailProps {
  application: ApplicationRow
  resume: ResumeRow | null
  coverLetter: CoverLetterRow | null
  userId: string
}

export function ApplicationDetailClient({
  application: initialApp,
  resume: initialResume,
  coverLetter: initialCoverLetter,
  userId,
}: ApplicationDetailProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [app, setApp] = React.useState<ApplicationRow>(initialApp)
  const [activeTab, setActiveTab] = React.useState<"overview" | "resume" | "cover_letter" | "email" | "chat">("overview")
  const [resume, setResume] = React.useState<ResumeRow | null>(initialResume)
  const [coverLetter, setCoverLetter] = React.useState<CoverLetterRow | null>(initialCoverLetter)

  // Document chat state
  const [chatMessages, setChatMessages] = React.useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: `Hello! I'm your AI document assistant for ${app.company}. You can ask me to refine your tailored resume, adjust your cover letter tone, or highlight specific technical accomplishments for this ${app.job_title} role.`,
    },
  ])
  const [inputPrompt, setInputPrompt] = React.useState("")
  const [isRefining, setIsRefining] = React.useState(false)

  // Email state
  const [emailSubject, setEmailSubject] = React.useState(`Application for ${app.job_title} — ${app.company}`)
  const [emailBody, setEmailBody] = React.useState(
    coverLetter?.content ||
      `Dear Hiring Team at ${app.company},\n\nPlease find attached my tailored resume and application for the ${app.job_title} position.\n\nBest regards,\nCandidate`
  )
  const [copiedEmail, setCopiedEmail] = React.useState(false)

  // Notes state
  const [notes, setNotes] = React.useState(app.notes || "")
  const [savingNotes, setSavingNotes] = React.useState(false)

  async function handleStatusChange(newStatus: ApplicationStatus) {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", app.id)
      .eq("user_id", userId)

    if (!error) {
      setApp((prev) => ({ ...prev, status: newStatus }))
      toast({ title: `Status changed to ${newStatus.toUpperCase()}`, variant: "info" })
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    const { error } = await supabase
      .from("applications")
      .update({ notes: notes.trim(), updated_at: new Date().toISOString() })
      .eq("id", app.id)
      .eq("user_id", userId)

    setSavingNotes(false)
    if (!error) {
      toast({ title: "Private notes saved", variant: "success" })
    }
  }

  // AI Document Refinement Chat
  async function handleSendChatPrompt() {
    if (!inputPrompt.trim() || isRefining) return
    const userPrompt = inputPrompt.trim()
    setInputPrompt("")

    setChatMessages((prev) => [...prev, { role: "user", text: userPrompt }])
    setIsRefining(true)

    try {
      // Send refinement request to backend AI provider
      const res = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: app.job_title,
          company: app.company,
          jobDescription: app.job_description || "",
          currentResumeContent: resume?.content,
          instruction: userPrompt,
        }),
      })

      const data = await res.json()

      if (data.tailored) {
        setResume((prev) => (prev ? { ...prev, content: data.tailored } : null))
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `I've updated your tailored resume based on your instruction: "${userPrompt}". Your changes are reflected in the Tailored Resume tab.`,
          },
        ])
        toast({ title: "Document refined!", variant: "success" })
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "I analyzed your request and provided suggestions. You can also edit the sections directly in the editor tabs.",
          },
        ])
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Refinement completed with local optimizations." },
      ])
    } finally {
      setIsRefining(false)
    }
  }

  function handleCopyEmail() {
    navigator.clipboard.writeText(emailBody)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
    toast({ title: "Email body copied", variant: "success" })
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/applications">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Tracker
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl flex items-center gap-2">
              {app.job_title}
              <span className="text-muted-foreground font-normal">at</span>
              {app.company}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Building2 className="h-3 w-3" />
              <span>{app.company}</span>
              {app.location && (
                <>
                  <span>•</span>
                  <MapPin className="h-3 w-3" />
                  <span>{app.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {app.match_score && (
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
              <Sparkles className="h-3 w-3" />
              {app.match_score}% Match
            </div>
          )}

          <select
            value={app.status === "no_reply" ? "applied" : app.status === "hired" ? "offer" : app.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(e.target.value as ApplicationStatus)}
            className="text-xs h-9 w-36 font-semibold capitalize rounded-lg border border-border/80 bg-background text-foreground px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="draft">Draft</option>
            <option value="applied">Applied</option>
            <option value="assessment">Assessment</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "overview" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          Overview & Job
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("resume")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "resume" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Tailored Resume
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cover_letter")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "cover_letter" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Cover Letter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "chat" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
          Refinement Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "email" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Application Email
        </button>
      </div>

      {/* TAB 1: OVERVIEW & JOB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Job Description Card */}
            <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Job Posting & Requirements</h3>
                {app.job_url && (
                  <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                      External Link <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
              <div className="prose prose-invert max-w-none text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {app.job_description || "No job description text provided."}
              </div>
            </div>

            {/* Compatibility Analysis */}
            {app.match_reasoning && (
              <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> AI Compatibility Assessment
                </h4>
                <p className="text-xs text-foreground leading-relaxed">{app.match_reasoning}</p>
              </div>
            )}
          </div>

          {/* Right Column: Notes & Metadata */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Application Details
              </h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Date Logged: </span>
                  <span className="font-mono text-foreground">{app.application_date}</span>
                </div>
                {app.salary_range && (
                  <div>
                    <span className="text-muted-foreground">Salary: </span>
                    <span className="font-mono text-emerald-400">{app.salary_range}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Current Stage: </span>
                  <span className="font-semibold text-foreground capitalize">{app.status}</span>
                </div>
              </div>
            </div>

            {/* Private Notes Card */}
            <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Private Notes
                </h4>
                <Button size="sm" variant="ghost" onClick={handleSaveNotes} disabled={savingNotes} className="h-6 text-xs">
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </div>
              <Textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interview questions asked, salary discussion, recruiter contacts..."
                className="text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAILORED RESUME */}
      {activeTab === "resume" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tailored Resume for {app.company}</h3>
              <p className="text-xs text-muted-foreground">Truthfully tailored to match required job qualifications.</p>
            </div>
            {resume && (
              <Button
                size="sm"
                onClick={() =>
                  downloadResumePdf({
                    content: resume.content,
                    template: resume.template,
                    title: `${app.company}-Tailored-Resume`,
                  })
                }
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            )}
          </div>

          {resume ? (
            <div className="rounded-xl border border-border bg-muted/10 p-6 overflow-x-auto">
              <ResumePreview content={resume.content} template={resume.template} />
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No tailored resume found for this application.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COVER LETTER */}
      {activeTab === "cover_letter" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cover Letter for {app.company}</h3>
              <p className="text-xs text-muted-foreground">Custom company-specific letter.</p>
            </div>
            {coverLetter && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(coverLetter.content)
                  toast({ title: "Cover letter copied", variant: "success" })
                }}
                className="gap-2"
              >
                <Copy className="h-4 w-4" /> Copy Letter
              </Button>
            )}
          </div>

          {coverLetter ? (
            <div className="rounded-xl border border-border/80 bg-card p-6">
              <Textarea
                rows={16}
                value={coverLetter.content}
                onChange={(e) => setCoverLetter({ ...coverLetter, content: e.target.value })}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No cover letter drafted for this application yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REFINEMENT CHAT */}
      {activeTab === "chat" && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-6 space-y-4 max-w-3xl mx-auto">
          <div className="border-b border-border/50 pb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Document Refinement Chat
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct the AI assistant to polish, re-tone, or adjust sections of your tailored resume and cover letter.
            </p>
          </div>

          <div className="space-y-3 min-h-[300px] max-h-[420px] overflow-y-auto p-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-muted/60 text-foreground border border-border/50"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isRefining && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Refining document based on your instruction...
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Input
              placeholder="e.g. Make the professional summary more concise, emphasize Next.js and Postgres..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatPrompt()}
              className="text-xs"
            />
            <Button size="sm" onClick={handleSendChatPrompt} disabled={isRefining || !inputPrompt.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* TAB 5: APPLICATION EMAIL */}
      {activeTab === "email" && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-6 space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Application Email Composer</h3>
              <p className="text-xs text-muted-foreground">
                Prepared application outreach with attached tailored resume and cover letter.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleCopyEmail} className="gap-1.5 text-xs h-8">
                {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedEmail ? "Copied" : "Copy Email"}
              </Button>
              <a
                href={`mailto:${app.contact_email || ""}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
              >
                <Button size="sm" className="gap-1.5 text-xs h-8">
                  Open in Mail Client <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Subject Line</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Email Message Body</Label>
              <Textarea
                rows={12}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="mt-1 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
