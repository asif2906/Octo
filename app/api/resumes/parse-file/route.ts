import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseResumeTextToStructured } from "@/lib/resume/parser"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const textOverride = formData.get("text") as string | null

    let rawText = ""

    if (textOverride && textOverride.trim()) {
      rawText = textOverride.trim()
    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = file.name.toLowerCase()

      if (filename.endsWith(".pdf")) {
        try {
          const { PDFParse } = await import("pdf-parse")
          const parser = new PDFParse({ data: buffer })
          const parsed = await parser.getText()
          rawText = parsed.text
        } catch (pdfErr) {
          console.warn("[PDF Parse] Failed with PDFParse:", pdfErr)
          // Fallback to text decoding
          rawText = buffer.toString("utf-8")
        }
      } else {
        // Plain text, markdown, json, etc.
        rawText = buffer.toString("utf-8")
      }
    } else {
      return NextResponse.json(
        { error: "No resume file or text provided." },
        { status: 400 }
      )
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from the uploaded file." },
        { status: 422 }
      )
    }

    const result = parseResumeTextToStructured(rawText)

    return NextResponse.json({
      success: true,
      data: result.content,
      skillsCount: result.detectedSkillsCount,
      rawText: result.rawText.slice(0, 5000),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse failed"
    console.error("[Resume Parse API] Error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

