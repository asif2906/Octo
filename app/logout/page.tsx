import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function PerformLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect("/")
}

export default function LogoutPage() {
  return (
    <Suspense fallback={null}>
      <PerformLogout />
    </Suspense>
  )
}

