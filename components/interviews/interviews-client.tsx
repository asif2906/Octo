"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { generateInterviewPrepDeterministic } from "@/lib/ai/provider"
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import type { InterviewRow } from "@/types/database"

interface InterviewsClientProps {
  initialInterviews: InterviewRow[]
  candidateSkills: string[]
  userId: string
}

export function InterviewsClient({
  initialInterviews,
  candidateSkills,
  userId,
}: InterviewsClientProps) {
  const [interviews, setInterviews] = React.useState<InterviewRow[]>(initialInterviews)
  const [showAdd, setShowAdd] = React.useState(false)
  const [selectedInterview, setSelectedInterview] = React.useState<InterviewRow | null>(
    initialInterviews[0] || null
  )

  const [form, setForm] = React.useState({
    company: "",
    position: "",
    interview_date: "",
    round_type: "Technical",
    location_or_link: "",
    notes: "",
  })

  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  async function handleAdd() {
    if (!form.company || !form.position || !form.interview_date) {
      toast({ title: "Please fill required fields", variant: "error" })
      return
    }

    const prep = generateInterviewPrepDeterministic(form.position, candidateSkills)

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        user_id: userId,
        company: form.company.trim(),
        position: form.position.trim(),
        interview_date: new Date(form.interview_date).toISOString(),
        round_type: form.round_type,
        location_or_link: form.location_or_link.trim() || null,
        notes: form.notes.trim() || null,
        prep_questions: prep,
      })
      .select()
      .single()

    if (!error && data) {
      const created = data as InterviewRow
      setInterviews((prev) => [created, ...prev])
      setSelectedInterview(created)
      setShowAdd(false)
      setForm({ company: "", position: "", interview_date: "", round_type: "Technical", location_or_link: "", notes: "" })
      toast({ title: "Interview scheduled & prep questions generated", variant: "success" })
    }
  }

  async function toggleComplete(id: string, current: boolean) {
    const { error } = await supabase
      .from("interviews")
      .update({ completed: !current })
      .eq("id", id)

    if (!error) {
      setInterviews((prev) =>
        prev.map((i) => (i.id === id ? { ...i, completed: !current } : i))
      )
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("interviews").delete().eq("id", id)
    if (!error) {
      setInterviews((prev) => prev.filter((i) => i.id !== id))
      if (selectedInterview?.id === id) setSelectedInterview(null)
      toast({ title: "Interview removed", variant: "info" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Interview Management & Prep
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track interview rounds and review tailored technical and behavioral prep questions.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="h-4 w-4" /> Schedule Interview
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Add Interview Round</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Company *</Label>
              <Input
                placeholder="e.g. Stripe"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Position *</Label>
              <Input
                placeholder="e.g. Senior Software Engineer"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Round Type</Label>
              <Select
                value={form.round_type}
                onChange={(e) => setForm({ ...form, round_type: e.target.value })}
                className="mt-1"
              >
                <option value="Screening">Recruiter Screening</option>
                <option value="Technical">Technical Coding</option>
                <option value="System Design">System Design Architecture</option>
                <option value="Behavioral">Behavioral & Values</option>
                <option value="Final">Executive Final Round</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date & Time *</Label>
              <Input
                type="datetime-local"
                value={form.interview_date}
                onChange={(e) => setForm({ ...form, interview_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Meeting Link or Location</Label>
              <Input
                placeholder="https://meet.google.com/... or Zoom link"
                value={form.location_or_link}
                onChange={(e) => setForm({ ...form, location_or_link: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd}>Save & Generate Prep</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Interviews List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scheduled Rounds ({interviews.length})
          </h4>
          {interviews.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No upcoming interviews recorded.</p>
          ) : (
            interviews.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedInterview(item)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedInterview?.id === item.id
                    ? "border-primary bg-primary/10"
                    : "border-border/70 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{item.company}</h4>
                    <p className="text-xs text-muted-foreground">{item.position}</p>
                  </div>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {item.round_type}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.interview_date).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    className="hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Interview Details & Prep Q&A */}
        <div className="md:col-span-2 rounded-xl border border-border/70 bg-card/60 p-6 space-y-6">
          {selectedInterview ? (
            <>
              <div className="flex items-start justify-between border-b border-border/50 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedInterview.company} — {selectedInterview.position}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Round: <strong>{selectedInterview.round_type}</strong></span>
                    <span>•</span>
                    <span>Date: {new Date(selectedInterview.interview_date).toLocaleString()}</span>
                  </div>
                  {selectedInterview.location_or_link && (
                    <div className="mt-2 text-xs text-primary flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" />
                      <a href={selectedInterview.location_or_link} target="_blank" rel="noopener noreferrer" className="underline">
                        Join Meeting Link
                      </a>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={selectedInterview.completed ? "default" : "outline"}
                  onClick={() => toggleComplete(selectedInterview.id, selectedInterview.completed)}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedInterview.completed ? "Completed" : "Mark as Done"}
                </Button>
              </div>

              {/* Prep Q&A Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Interview Prep Questions & Recommended Strategy
                </h4>

                <div className="space-y-3">
                  {(selectedInterview.prep_questions || []).map((q: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                        {q.question}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                        <strong>Recommended Strategy:</strong> {q.suggestedAnswer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-muted-foreground text-xs">
              Select an interview on the left to review round details and preparation strategy.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

