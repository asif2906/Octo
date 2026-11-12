import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { OutreachClient } from "@/components/outreach/outreach-client"
import type {
  EmailTemplateRow,
  OutreachMessageRow,
  OutreachRecipientRow,
} from "@/types/database"

async function OutreachPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let recipients: OutreachRecipientRow[] = []
  let templates: EmailTemplateRow[] = []
  let messages: OutreachMessageRow[] = []

  if (ctx.schemaReady) {
    const [recRes, tplRes, msgRes] = await Promise.all([
      supabase
        .from("outreach_recipients")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("email_templates")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("outreach_messages")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
    ])

    recipients = (recRes.data as OutreachRecipientRow[] | null) ?? []
    templates = (tplRes.data as EmailTemplateRow[] | null) ?? []
    messages = (msgRes.data as OutreachMessageRow[] | null) ?? []
  }

  return (
    <OutreachClient
      userId={ctx.user.id}
      usage={ctx.usage}
      initialRecipients={recipients}
      initialTemplates={templates}
      initialMessages={messages}
    />
  )
}

export default function OutreachPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <OutreachPageContent />
    </Suspense>
  )
}

