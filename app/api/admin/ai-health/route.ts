import { NextRequest, NextResponse } from "next/server"
import { getActiveAiApiKey, getActiveAiModel } from "@/lib/ai/provider"
import { createClient } from "@/lib/supabase/server"

interface HealthStatus {
  provider: string
  model: string
  status: "healthy" | "degraded" | "down"
  hasKeyConfigured: boolean
  latencyMs: number | null
  lastSuccessfulRequest: string | null
  lastFailure: string | null
  quotaStatus: string
  featuresConnected: string[]
}

// In-memory cache of last health result to track last successful/failed request timestamps
let lastSuccessful: string | null = null
let lastFailureMsg: string | null = null

export async function GET(req: NextRequest) {
  try {
    // 1. Verify caller has admin rights or authenticated session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    const isBearerAuthorized =
      cronSecret && authHeader === `Bearer ${cronSecret}`
    const isAuthenticated = Boolean(user)

    if (!isAuthenticated && !isBearerAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized access to admin AI health check" },
        { status: 401 }
      )
    }

    const apiKey = getActiveAiApiKey()
    const model = getActiveAiModel()

    const featuresConnected = [
      "Resume Tailoring (/api/resumes/tailor)",
      "Cover Letter Generation (/api/cover-letters/generate)",
      "Follow-up Email Generation (/api/follow-ups/generate)",
      "Job Match Scoring (lib/ai/provider.ts:calculateJobMatch)",
      "AI Refinement Chat (lib/ai/provider.ts:refineDocumentWithChatAI)",
      "Cold Approach Email Personalization (lib/ai/provider.ts:generateColdEmailAI)",
      "Application Packet Automation (/api/applications/create-from-job)",
    ]

    if (!apiKey) {
      lastFailureMsg = "Missing GEMINI_API_KEY / OCTO_AI_API_KEY on server backend"
      const status: HealthStatus = {
        provider: "Google Gemini",
        model,
        status: "down",
        hasKeyConfigured: false,
        latencyMs: null,
        lastSuccessfulRequest: lastSuccessful,
        lastFailure: lastFailureMsg,
        quotaStatus: "Key not configured",
        featuresConnected,
      }
      return NextResponse.json(status, { status: 503 })
    }

    // 2. Perform live, minimal health ping against Google Gemini
    const startTime = Date.now()
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const testRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "Respond only with: OCTO_OK" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      }),
    })

    const latencyMs = Date.now() - startTime

    if (!testRes.ok) {
      const errText = await testRes.text()
      lastFailureMsg = `HTTP ${testRes.status}: ${errText.slice(0, 300)}`

      let quotaStatus = "Error encountered"
      if (testRes.status === 429) {
        quotaStatus = "Rate limit or quota exceeded (HTTP 429)"
      } else if (testRes.status === 403 || testRes.status === 401) {
        quotaStatus = "Authentication / authorization rejected"
      }

      const status: HealthStatus = {
        provider: "Google Gemini",
        model,
        status: testRes.status === 429 ? "degraded" : "down",
        hasKeyConfigured: true,
        latencyMs,
        lastSuccessfulRequest: lastSuccessful,
        lastFailure: lastFailureMsg,
        quotaStatus,
        featuresConnected,
      }
      return NextResponse.json(status, { status: 502 })
    }

    const testData = await testRes.json()
    const candidateText =
      testData.candidates?.[0]?.content?.parts?.[0]?.text || ""

    lastSuccessful = new Date().toISOString()
    lastFailureMsg = null

    const status: HealthStatus = {
      provider: "Google Gemini",
      model,
      status: "healthy",
      hasKeyConfigured: true,
      latencyMs,
      lastSuccessfulRequest: lastSuccessful,
      lastFailure: null,
      quotaStatus: "Active & Accepting Requests",
      featuresConnected,
    }

    return NextResponse.json(status, { status: 200 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    lastFailureMsg = errorMsg
    return NextResponse.json(
      {
        provider: "Google Gemini",
        model: getActiveAiModel(),
        status: "down",
        hasKeyConfigured: Boolean(getActiveAiApiKey()),
        latencyMs: null,
        lastSuccessfulRequest: lastSuccessful,
        lastFailure: errorMsg,
        quotaStatus: "Network or runtime exception",
        featuresConnected: [],
      },
      { status: 500 }
    )
  }
}
