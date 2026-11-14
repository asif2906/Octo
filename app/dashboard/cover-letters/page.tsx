import { Suspense } from "react"
import { getDashboardContext } from "@/lib/dashboard/data"
import { createClient } from "@/lib/supabase/server"
import { CoverLetterClient } from "@/components/cover-letters/cover-letter-client"
import type { CoverLetterRow } from "@/types/database"

async function CoverLettersPageContent() {
  const ctx = await getDashboardContext()
  const supabase = await createClient()

  let initialLetters: CoverLetterRow[] = []
  let candidateSkills: string[] = []

  if (ctx.schemaReady) {
    const [lettersRes, skillsRes] = await Promise.all([
      supabase
        .from("cover_letters")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("skills")
        .select("skill_name")
        .eq("user_id", ctx.user.id),
    ])

    initialLetters = (lettersRes.data as CoverLetterRow[] | null) ?? []
    candidateSkills = (skillsRes.data || []).map((s: any) => s.skill_name).filter(Boolean)
  }

  return (
    <CoverLetterClient
      initialLetters={initialLetters}
      candidateName={ctx.profile?.full_name || ""}
      candidateSkills={candidateSkills}
      candidateSummary={ctx.profile?.professional_summary || ""}
      userId={ctx.user.id}
    />
  )
}

export default function CoverLettersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <CoverLettersPageContent />
    </Suspense>
  )
}

