import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateCoverLetter } from "@/lib/ai/provider"

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
      company,
      jobTitle,
      jobDescription = "",
      tone = "Professional",
      skills = [],
      fullName = "Candidate",
      experienceSummary = "",
    } = body

    if (!company || !jobTitle) {
      return NextResponse.json(
        { error: "Company and jobTitle are required." },
        { status: 400 }
      )
    }

    const content = await generateCoverLetter({
      fullName,
      company,
      jobTitle,
      skills,
      jobDescription,
      tone,
      experienceSummary,
    })

    return NextResponse.json({ content })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating cover letter"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

