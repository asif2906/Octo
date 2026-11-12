import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function getSafeNextPath(nextParam: string | null): string {
  if (!nextParam) {
    return "/"
  }

  // Only allow safe internal paths (reject protocol-relative '//' or backslash escapes)
  if (
    !nextParam.startsWith("/") ||
    nextParam.startsWith("//") ||
    nextParam.startsWith("/\\")
  ) {
    return "/"
  }

  return nextParam
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

