import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateFollowUpEmailAI } from "@/lib/ai/provider"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      candidateName = "Candidate",
      company,
      jobTitle,
      applicationDate,
      lastCommunicationDays = 7,
      stage = "applied",
    } = body

    if (!company || !jobTitle) {
      return NextResponse.json(
        { error: "Company and jobTitle are required." },
        { status: 400 }
      )
    }

    const email = await generateFollowUpEmailAI({
      candidateName,
      company,
      jobTitle,
      applicationDate,
      lastCommunicationDays,
      stage,
    })

    return NextResponse.json({ email })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating follow-up"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
