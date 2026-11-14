"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Ban,
  FileSpreadsheet,
  Info,
  Mail,
  Plus,
  Send,
  Trash2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logUserActivity } from "@/lib/dashboard/activity"
import type { UsageSummary } from "@/lib/plans"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  EmailTemplateRow,
  OutreachMessageRow,
  OutreachRecipientRow,
} from "@/types/database"

interface OutreachClientProps {
  userId: string
  usage: UsageSummary
  initialRecipients: OutreachRecipientRow[]
  initialTemplates: EmailTemplateRow[]
  initialMessages: OutreachMessageRow[]
}

const OPT_OUT_LINE =
  "\n\n---\nIf you'd prefer not to receive future emails from me, just reply and I will immediately remove your address."

function parseCsvRecipients(raw: string): {
  name: string
  email: string
  company: string | null
  job_title: string | null
  linkedin_url: string | null
  notes: string | null
}[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const splitRow = (line: string) => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const firstCols = splitRow(lines[0]).map((c) => c.toLowerCase())
  const hasHeader = firstCols.some(
    (c) => c.includes("email") || c.includes("name")
  )
  const startIndex = hasHeader ? 1 : 0

  const nameIdx = hasHeader
    ? Math.max(0, firstCols.findIndex((c) => c.includes("name")))
    : 0
  const emailIdx = hasHeader
    ? firstCols.findIndex((c) => c.includes("email"))
    : 1
  const companyIdx = hasHeader
    ? firstCols.findIndex((c) => c.includes("company"))
    : 2
  const titleIdx = hasHeader
    ? firstCols.findIndex((c) => c.includes("title") || c.includes("role"))
    : 3

  const rows: {
    name: string
    email: string
    company: string | null
    job_title: string | null
    linkedin_url: string | null
    notes: string | null
  }[] = []

  for (let i = startIndex; i < lines.length; i += 1) {
    const cols = splitRow(lines[i])
    const email = (emailIdx >= 0 ? cols[emailIdx] : cols[1]) ?? ""
    if (!email || !email.includes("@")) continue
    const name = cols[nameIdx] || email.split("@")[0]
    rows.push({
      name,
      email,
      company: companyIdx >= 0 ? cols[companyIdx] || null : null,
      job_title: titleIdx >= 0 ? cols[titleIdx] || null : null,
      linkedin_url: null,
      notes: null,
    })
  }
  return rows
}

function interpolateTemplate(
  raw: string,
  recipient: OutreachRecipientRow | null
): string {
  if (!recipient) return raw
  return raw
    .replace(/\{\{\s*name\s*\}\}/gi, recipient.name)
    .replace(/\{\{\s*company\s*\}\}/gi, recipient.company || "your team")
    .replace(/\{\{\s*job_title\s*\}\}/gi, recipient.job_title || "your role")
}

export function OutreachClient({
  userId,
  usage,
  initialRecipients,
  initialTemplates,
  initialMessages,
}: OutreachClientProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [recipients, setRecipients] =
    React.useState<OutreachRecipientRow[]>(initialRecipients)
  const [templates, setTemplates] =
    React.useState<EmailTemplateRow[]>(initialTemplates)
  const [messages, setMessages] =
    React.useState<OutreachMessageRow[]>(initialMessages)

  // Recipient form
  const [recipientForm, setRecipientForm] = React.useState({
    name: "",
    email: "",
    company: "",
    job_title: "",
    linkedin_url: "",
    notes: "",
  })
  const [addingRecipient, setAddingRecipient] = React.useState(false)
  const [importingCsv, setImportingCsv] = React.useState(false)

  // Template form
  const [templateForm, setTemplateForm] = React.useState({
    name: "",
    subject: "",
    body: "",
  })
  const [savingTemplate, setSavingTemplate] = React.useState(false)

  // Composer state
  const [selectedRecipientId, setSelectedRecipientId] = React.useState(
    initialRecipients[0]?.id ?? ""
  )
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    initialTemplates[0]?.id ?? ""
  )
  const [draftSubject, setDraftSubject] = React.useState(
    initialTemplates[0]?.subject ??
      "Quick note regarding engineering opportunities at {{company}}"
  )
  const [draftBody, setDraftBody] = React.useState(
    initialTemplates[0]?.body ??
      "Hi {{name}},\n\nI noticed your work at {{company}} and would appreciate connecting about potential opportunities where my background fits.\n\nBest regards,"
  )
  const [savingDraft, setSavingDraft] = React.useState(false)

  // Automated Cold Approach Campaign State (Section 4)
  const [campaignRoles, setCampaignRoles] = React.useState(
    "Software Engineer, Backend Developer, Full Stack Developer"
  )
  const [isDiscovering, setIsDiscovering] = React.useState(false)
  const [discoveredContacts, setDiscoveredContacts] = React.useState<Array<{
    company: string
    companyDomain: string
    targetRole: string
    contactRole: string
    contactEmail: string
    sourceUrl: string
    verificationStatus: "verified"
    emailSubject: string
    emailBody: string
  }>>([])

  async function handleDiscoverContacts() {
    setIsDiscovering(true)
    try {
      const roles = campaignRoles.split(",").map((r) => r.trim()).filter(Boolean)
      const res = await fetch("/api/automation/cold-approach/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRoles: roles }),
      })

      if (!res.ok) {
        throw new Error("Failed to discover hiring contacts.")
      }

      const data = await res.json()
      setDiscoveredContacts(data.contacts || [])
      toast({
        title: "Hiring Contacts Discovered",
        description: `Found ${data.contacts?.length || 0} verified public recruitment contacts with AI personalized outreach.`,
        variant: "success",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Discovery failed"
      toast({ title: "Discovery Error", description: msg, variant: "error" })
    } finally {
      setIsDiscovering(false)
    }
  }

  async function handleApproveAndQueue(contact: (typeof discoveredContacts)[0]) {
    try {
      // 1. Add to recipients
      const { data: recData, error: recErr } = await supabase
        .from("outreach_recipients")
        .insert({
          user_id: userId,
          name: `${contact.company} Talent Team`,
          email: contact.contactEmail,
          company: contact.company,
          job_title: contact.contactRole,
          notes: `Discovered from public posting: ${contact.sourceUrl}`,
        })
        .select("*")
        .single()

      if (recErr || !recData) throw recErr || new Error("Could not add recipient")

      const savedRec = recData as OutreachRecipientRow
      setRecipients((prev) => [savedRec, ...prev])

      // 2. Add draft message
      const { data: msgData, error: msgErr } = await supabase
        .from("outreach_messages")
        .insert({
          user_id: userId,
          recipient_id: savedRec.id,
          recipient_name: savedRec.name,
          recipient_email: savedRec.email,
          subject: contact.emailSubject,
          body: contact.emailBody + OPT_OUT_LINE,
          status: "draft",
        })
        .select("*")
        .single()

      if (msgErr || !msgData) throw msgErr || new Error("Could not create message draft")

      const savedMsg = msgData as OutreachMessageRow
      setMessages((prev) => [savedMsg, ...prev])

      // Remove from pending discovered list
      setDiscoveredContacts((prev) => prev.filter((c) => c.contactEmail !== contact.contactEmail))

      toast({
        title: "Contact Approved & Queued",
        description: `AI message for ${contact.company} saved to active drafts.`,
        variant: "success",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed"
      toast({ title: "Failed to Queue", description: msg, variant: "error" })
    }
  }

  const [deleteTarget, setDeleteTarget] = React.useState<
    | { table: "outreach_recipients"; id: string; label: string }
    | { table: "email_templates"; id: string; label: string }
    | { table: "outreach_messages"; id: string; label: string }
    | null
  >(null)
  const [deleting, setDeleting] = React.useState(false)

  const selectedRecipient =
    recipients.find((r) => r.id === selectedRecipientId) ?? null
  const previewSubject = interpolateTemplate(draftSubject, selectedRecipient)
  const previewBody =
    interpolateTemplate(draftBody, selectedRecipient) + OPT_OUT_LINE

  async function handleAddRecipient(e: React.FormEvent) {
    e.preventDefault()
    if (!recipientForm.name.trim() || !recipientForm.email.trim()) {
      toast({
        title: "Name and email are required",
        variant: "error",
      })
      return
    }

    setAddingRecipient(true)
    const { data, error } = await supabase
      .from("outreach_recipients")
      .insert({
        user_id: userId,
        name: recipientForm.name.trim(),
        email: recipientForm.email.trim(),
        company: recipientForm.company.trim() || null,
        job_title: recipientForm.job_title.trim() || null,
        linkedin_url: recipientForm.linkedin_url.trim() || null,
        notes: recipientForm.notes.trim() || null,
      })
      .select("*")
      .single()
    setAddingRecipient(false)

    if (error || !data) {
      toast({
        title: "Failed to add recipient",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = data as OutreachRecipientRow
    setRecipients((prev) => [saved, ...prev])
    if (!selectedRecipientId) setSelectedRecipientId(saved.id)
    setRecipientForm({
      name: "",
      email: "",
      company: "",
      job_title: "",
      linkedin_url: "",
      notes: "",
    })
    toast({ title: "Recipient added", variant: "success" })
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setImportingCsv(true)
    try {
      const text = await file.text()
      const parsed = parseCsvRecipients(text)
      if (parsed.length === 0) {
        toast({
          title: "No valid contacts found in CSV",
          description:
            "Include at least columns for name and email (e.g. name,email,company,title).",
          variant: "error",
        })
        return
      }

      const payload = parsed.map((row) => ({
        user_id: userId,
        ...row,
      }))
      const { data, error } = await supabase
        .from("outreach_recipients")
        .insert(payload)
        .select("*")

      if (error || !data) {
        toast({
          title: "CSV import failed",
          description: error?.message ?? "Could not import rows.",
          variant: "error",
        })
        return
      }

      const imported = data as OutreachRecipientRow[]
      setRecipients((prev) => [...imported, ...prev])
      await logUserActivity(supabase, {
        userId,
        activityType: "outreach_csv_imported",
        description: `Imported ${imported.length} outreach recipients from CSV`,
      })
      toast({
        title: `Imported ${imported.length} contacts`,
        variant: "success",
      })
    } finally {
      setImportingCsv(false)
    }
  }

  async function handleToggleDnc(recipient: OutreachRecipientRow) {
    const nextDnc = !recipient.do_not_contact
    const { error } = await supabase
      .from("outreach_recipients")
      .update({
        do_not_contact: nextDnc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recipient.id)
      .eq("user_id", userId)

    if (error) {
      toast({
        title: "Failed to update Do Not Contact status",
        description: error.message,
        variant: "error",
      })
      return
    }

    setRecipients((prev) =>
      prev.map((item) =>
        item.id === recipient.id ? { ...item, do_not_contact: nextDnc } : item
      )
    )
    toast({
      title: nextDnc
        ? `${recipient.name} marked Do Not Contact`
        : `${recipient.name} removed from Do Not Contact`,
      variant: "info",
    })
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (
      !templateForm.name.trim() ||
      !templateForm.subject.trim() ||
      !templateForm.body.trim()
    ) {
      toast({
        title: "Template name, subject, and body are required",
        variant: "error",
      })
      return
    }

    setSavingTemplate(true)
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        user_id: userId,
        name: templateForm.name.trim(),
        subject: templateForm.subject.trim(),
        body: templateForm.body.trim(),
      })
      .select("*")
      .single()
    setSavingTemplate(false)

    if (error || !data) {
      toast({
        title: "Could not save template",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = data as EmailTemplateRow
    setTemplates((prev) => [saved, ...prev])
    setTemplateForm({ name: "", subject: "", body: "" })
    toast({ title: "Email template saved", variant: "success" })
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    const tpl = templates.find((t) => t.id === templateId)
    if (tpl) {
      setDraftSubject(tpl.subject)
      setDraftBody(tpl.body)
    }
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRecipient) {
      toast({
        title: "Select a recipient first",
        variant: "error",
      })
      return
    }
    if (selectedRecipient.do_not_contact) {
      toast({
        title: "Recipient is marked Do Not Contact",
        description: "Remove the Do Not Contact flag before drafting outreach.",
        variant: "error",
      })
      return
    }
    if (!previewSubject.trim() || !previewBody.trim()) {
      toast({ title: "Subject and body are required", variant: "error" })
      return
    }

    setSavingDraft(true)
    const { data, error } = await supabase
      .from("outreach_messages")
      .insert({
        user_id: userId,
        recipient_id: selectedRecipient.id,
        template_id: selectedTemplateId || null,
        recipient_name: selectedRecipient.name,
        recipient_email: selectedRecipient.email,
        subject: previewSubject.trim(),
        body: previewBody.trim(),
        status: "draft",
      })
      .select("*")
      .single()
    setSavingDraft(false)

    if (error || !data) {
      toast({
        title: "Failed to save draft",
        description: error?.message ?? "Please try again.",
        variant: "error",
      })
      return
    }

    const saved = data as OutreachMessageRow
    setMessages((prev) => [saved, ...prev])
    await logUserActivity(supabase, {
      userId,
      activityType: "outreach_draft_created",
      description: `Saved cold outreach draft for ${saved.recipient_name}`,
    })
    toast({ title: "Outreach draft saved", variant: "success" })
    router.refresh()
  }

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
        title: "Delete failed",
        description: error.message,
        variant: "error",
      })
      return
    }

    if (deleteTarget.table === "outreach_recipients") {
      setRecipients((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    } else if (deleteTarget.table === "email_templates") {
      setTemplates((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    } else if (deleteTarget.table === "outreach_messages") {
      setMessages((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    }

    toast({ title: "Deleted", description: deleteTarget.label, variant: "success" })
    setDeleteTarget(null)
  }

  const remainingSends = Math.max(
    0,
    usage.coldEmailsLimit - usage.coldEmailsUsedInPeriod
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cold Outreach
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage recipients, reusable templates, opt-out compliance, and personalized email drafts.
          </p>
        </div>
        <Badge variant="outline">
          {remainingSends}/{usage.coldEmailsLimit} sends left today
        </Badge>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-foreground" />
        <div>
          <p className="font-medium text-foreground">
            Gmail sending integration is Coming Soon
          </p>
          <p className="mt-1">
            You can organize recipients, import CSV lists, manage Do Not Contact flags, build templates, and store personalized drafts now. No emails are sent without an authorized Gmail connection.
            {usage.plan === "pro"
              ? " Founder & CEO curated contact database is also planned for Pro."
              : ""}
          </p>
        </div>
      </div>

      {/* Automated Cold Approach Campaign (Section 4) */}
      <Card className="border-primary/30 bg-card/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span>AI Automated Cold Approach</span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px]">
                  Targeted Discovery
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Select your target roles. Octo discovers matching hiring companies, finds verified public recruitment contact addresses, and drafts personalized emails with Gemini.
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              {usage.plan === "pro" ? "Pro Plan (20/day max)" : "Basic Plan (15/day max)"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full space-y-1">
              <Label className="text-xs font-semibold">Target Job Roles</Label>
              <Input
                value={campaignRoles}
                onChange={(e) => setCampaignRoles(e.target.value)}
                placeholder="e.g. Software Engineer, Backend Developer, Data Analyst"
                className="text-xs h-9"
              />
            </div>
            <Button
              onClick={handleDiscoverContacts}
              disabled={isDiscovering}
              className="w-full sm:w-auto text-xs h-9 mt-auto font-semibold gap-1.5"
            >
              {isDiscovering ? (
                <span className="inline-block animate-spin mr-1">⏳</span>
              ) : (
                <Send className="size-3.5" />
              )}
              {isDiscovering ? "Discovering & Generating..." : "Discover Hiring Contacts"}
            </Button>
          </div>

          {discoveredContacts.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="font-semibold text-foreground text-xs">
                Discovered Hiring Contacts & AI Drafts ({discoveredContacts.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {discoveredContacts.map((contact) => (
                  <div
                    key={contact.contactEmail}
                    className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{contact.company}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Target Vacancy: {contact.targetRole}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                        Verified Public Contact
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/40 space-y-1 text-[11px]">
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Contact: </span>
                        {contact.contactEmail} ({contact.contactRole})
                      </p>
                      <p className="text-muted-foreground truncate">
                        <span className="font-semibold text-foreground">Source: </span>
                        <a
                          href={contact.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {contact.sourceUrl}
                        </a>
                      </p>
                      <div className="pt-1.5 border-t border-border/40">
                        <p className="font-semibold text-foreground">Subject: {contact.emailSubject}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-3 italic">
                          "{contact.emailBody}"
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApproveAndQueue(contact)}
                      className="w-full text-xs h-8 font-semibold gap-1"
                    >
                      <span>Approve & Add to Outreach Queue</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recipients & CSV Import */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Recipient List ({recipients.length})</CardTitle>
            <CardDescription>
              Add contacts manually or import a CSV (columns: name, email, company, title)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddRecipient} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={recipientForm.name}
                  onChange={(e) =>
                    setRecipientForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Recipient Name *"
                  required
                />
                <Input
                  type="email"
                  value={recipientForm.email}
                  onChange={(e) =>
                    setRecipientForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="Email Address *"
                  required
                />
                <Input
                  value={recipientForm.company}
                  onChange={(e) =>
                    setRecipientForm((p) => ({ ...p, company: e.target.value }))
                  }
                  placeholder="Company"
                />
                <Input
                  value={recipientForm.job_title}
                  onChange={(e) =>
                    setRecipientForm((p) => ({
                      ...p,
                      job_title: e.target.value,
                    }))
                  }
                  placeholder="Role / Title"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <FileSpreadsheet className="size-3.5" />
                  <span>{importingCsv ? "Importing..." : "Upload CSV"}</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={handleCsvUpload}
                    disabled={importingCsv}
                  />
                </label>
                <Button type="submit" size="sm" disabled={addingRecipient}>
                  <Plus className="size-3.5" />
                  {addingRecipient ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </form>

            {recipients.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No contacts added yet.
              </p>
            ) : (
              <div className="max-h-72 divide-y divide-border overflow-y-auto pr-1">
                {recipients.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {rec.name}
                        {rec.do_not_contact ? (
                          <span className="ml-2 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">
                            DNC
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-muted-foreground">
                        {rec.email}
                        {rec.company ? ` · ${rec.company}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant={rec.do_not_contact ? "secondary" : "ghost"}
                        size="icon-xs"
                        onClick={() => handleToggleDnc(rec)}
                        title="Toggle Do Not Contact"
                        aria-label={`Toggle Do Not Contact for ${rec.name}`}
                      >
                        <Ban className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          setDeleteTarget({
                            table: "outreach_recipients",
                            id: rec.id,
                            label: `${rec.name} (${rec.email})`,
                          })
                        }
                        aria-label={`Delete ${rec.name}`}
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

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Email Templates ({templates.length})</CardTitle>
            <CardDescription>
              Use placeholders like {"{{name}}"}, {"{{company}}"}, and{" "}
              {"{{job_title}}"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <Input
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Template Name (e.g. Founder Intro) *"
                required
              />
              <Input
                value={templateForm.subject}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, subject: e.target.value }))
                }
                placeholder="Subject line *"
                required
              />
              <Textarea
                rows={3}
                value={templateForm.body}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, body: e.target.value }))
                }
                placeholder="Hi {{name}}, noticed {{company}} is scaling..."
                required
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={savingTemplate}>
                  <Plus className="size-3.5" />
                  {savingTemplate ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>

            {templates.length > 0 ? (
              <div className="max-h-56 divide-y divide-border overflow-y-auto pr-1">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => applyTemplate(tpl.id)}
                      className="min-w-0 flex-1 text-left hover:underline"
                    >
                      <p className="truncate font-medium text-foreground">
                        {tpl.name}
                      </p>
                      <p className="truncate text-muted-foreground">
                        {tpl.subject}
                      </p>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setDeleteTarget({
                          table: "email_templates",
                          id: tpl.id,
                          label: tpl.name,
                        })
                      }
                      aria-label={`Delete ${tpl.name}`}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Personalized Draft Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Draft & Personalized Preview</CardTitle>
          <CardDescription>
            Opt-out text is appended automatically. Saved drafts stay ready for Gmail integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveDraft} className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="outreach-recipient">Recipient</Label>
                  <Select
                    id="outreach-recipient"
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                  >
                    <option value="">Select recipient...</option>
                    {recipients.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.name} ({rec.email})
                        {rec.do_not_contact ? " [DNC]" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="outreach-template">Apply Template</Label>
                  <Select
                    id="outreach-template"
                    value={selectedTemplateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                  >
                    <option value="">Custom message</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="draft-subject">Subject</Label>
                <Input
                  id="draft-subject"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="draft-body">Message Body</Label>
                <Textarea
                  id="draft-body"
                  rows={6}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  disabled={savingDraft || !selectedRecipient}
                >
                  <Mail className="size-4" />
                  {savingDraft ? "Saving Draft..." : "Save Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Gmail OAuth sending is coming soon"
                >
                  <Send className="size-4" />
                  Send via Gmail (Coming Soon)
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Personalized Preview
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">To: </span>
                  {selectedRecipient
                    ? `${selectedRecipient.name} <${selectedRecipient.email}>`
                    : "Select a recipient"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Subject:{" "}
                  </span>
                  <span className="font-medium text-foreground">
                    {previewSubject}
                  </span>
                </p>
                <hr className="border-border" />
                <pre className="font-sans text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                  {previewBody}
                </pre>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Saved Drafts & History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Drafts & Outreach History ({messages.length})</CardTitle>
            <CardDescription>
              Saved drafts and recorded outreach messages
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/subscription" />}
          >
            View Plan Limits
          </Button>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No outreach drafts or sent messages recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {msg.subject}
                      </p>
                      <Badge variant="outline">{msg.status}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      To: {msg.recipient_name} ({msg.recipient_email}) ·{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: usage.timezone || "UTC",
                      }).format(new Date(msg.created_at))}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      setDeleteTarget({
                        table: "outreach_messages",
                        id: msg.id,
                        label: msg.subject,
                      })
                    }
                    aria-label="Delete message draft"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
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
        title="Delete entry?"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.label}"?`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
