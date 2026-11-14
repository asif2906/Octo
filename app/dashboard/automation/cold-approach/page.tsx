import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardContext } from "@/lib/dashboard/data"
import { OutreachClient } from "@/components/outreach/outreach-client"
import type {
  EmailTemplateRow,
  OutreachMessageRow,
  OutreachRecipientRow,
} from "@/types/database"

async function ColdApproachContent() {
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

export default function ColdApproachPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <ColdApproachContent />
    </Suspense>
  )
}

