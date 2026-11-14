import { redirect } from "next/navigation"

export default function AgentPage() {
  redirect("/dashboard/jobs?tab=agent")
}
