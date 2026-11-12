import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeResumeContent } from "@/lib/resume/defaults"
import type { ResumeContent, ResumeRow, SubscriptionRow } from "@/types/database"

interface TailorRequestBody {
  resumeId?: string
  jobTitle?: string
  company?: string
  jobDescription?: string
}

function buildTailorPrompt({
  resumeContent,
  jobTitle,
  company,
  jobDescription,
}: {
  resumeContent: ResumeContent
  jobTitle: string
  company: string
  jobDescription: string
}): string {
  return [
    "You are an expert ATS resume editor.",
    "Rewrite the provided candidate resume JSON so it is tailored to the target job description.",
    "STRICT TRUTHFULNESS RULES:",
    "1. NEVER invent employers, job titles, degrees, dates, projects, or metrics not already present in the input resume.",
    "2. Keep all personalInfo contact fields (fullName, email, phone, location, linkedinUrl, githubUrl, portfolioUrl) unchanged.",
    "3. You MAY refine personalInfo.headline, personalInfo.summary, experience bullet wording, project descriptions, and skill ordering/grouping to align terminology with the job description while remaining 100% factual.",
    "4. Output ONLY valid JSON matching the exact input ResumeContent structure (keys: personalInfo, experience, education, skills, projects, sectionOrder). Do not include markdown fences.",
    "",
    `TARGET ROLE: ${jobTitle || "Not specified"}`,
    `TARGET COMPANY: ${company || "Not specified"}`,
    `JOB DESCRIPTION:\n${jobDescription}`,
    "",
    `CANDIDATE RESUME JSON:\n${JSON.stringify(resumeContent)}`,
  ].join("\n")
}

async function callOpenAiTailor(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TAILOR_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return strictly valid JSON with no markdown or extra commentary.",
        },
        { role: "user", content: prompt },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errText}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error("OpenAI returned an empty tailoring response.")
  }
  return text
}

async function callGeminiTailor(prompt: string, apiKey: string): Promise<string> {
  const model = process.env.GEMINI_TAILOR_MODEL || "gemini-2.5-flash"
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini request failed (${response.status}): ${errText}`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("Gemini returned an empty tailoring response.")
  }
  return text
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as TailorRequestBody
    const resumeId = body.resumeId?.trim() ?? ""
    const jobTitle = body.jobTitle?.trim() ?? ""
    const company = body.company?.trim() ?? ""
    const jobDescription = body.jobDescription?.trim() ?? ""

    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: "Source resume and job description are required." },
        { status: 400 }
      )
    }

    const [subRes, resumeRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

    if (subRes.error) {
      return NextResponse.json(
        { error: subRes.error.message },
        { status: 500 }
      )
    }

    const subscription = subRes.data as SubscriptionRow | null
    const plan = subscription?.plan ?? "free"
    if (plan === "free") {
      return NextResponse.json(
        {
          error:
            "AI resume tailoring is available on Basic and Pro plans. Upgrade on the Subscription page to unlock it.",
          code: "PLAN_REQUIRED",
        },
        { status: 403 }
      )
    }

    const resume = resumeRes.data as ResumeRow | null
    if (!resume) {
      return NextResponse.json(
        { error: "Selected resume was not found." },
        { status: 404 }
      )
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim()
    const openAiKey = process.env.OPENAI_API_KEY?.trim()

    if (!geminiKey && !openAiKey) {
      return NextResponse.json(
        {
          error:
            "AI provider API key is not configured on this server. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local to enable live AI resume tailoring.",
          code: "AI_KEY_MISSING",
        },
        { status: 503 }
      )
    }

    const quotaRes = await supabase.rpc("consume_ai_tailor_quota", {
      p_reference_id: resume.id,
    })

    if (quotaRes.error) {
      const msg = quotaRes.error.message || "Usage limit reached."
      const status =
        msg.includes("LIMIT_EXCEEDED") || msg.toLowerCase().includes("limit")
          ? 429
          : 403
      return NextResponse.json({ error: msg, code: "QUOTA_BLOCKED" }, { status })
    }

    const normalizedSource = normalizeResumeContent(resume.content)
    const prompt = buildTailorPrompt({
      resumeContent: normalizedSource,
      jobTitle,
      company,
      jobDescription,
    })

    const rawJson = geminiKey
      ? await callGeminiTailor(prompt, geminiKey)
      : await callOpenAiTailor(prompt, openAiKey!)

    const parsed = JSON.parse(rawJson) as Partial<ResumeContent>
    const tailoredContent = normalizeResumeContent(parsed)

    // Preserve contact info strictly from the source resume
    tailoredContent.personalInfo = {
      ...normalizedSource.personalInfo,
      headline: tailoredContent.personalInfo.headline || normalizedSource.personalInfo.headline,
      summary: tailoredContent.personalInfo.summary || normalizedSource.personalInfo.summary,
    }

    return NextResponse.json({
      tailoredContent,
      provider: geminiKey ? "gemini" : "openai",
    })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unexpected error during resume tailoring.",
      },
      { status: 500 }
    )
  }
}

