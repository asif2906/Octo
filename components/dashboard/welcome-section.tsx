import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeSectionProps {
  fullName: string | null
  email: string
  primaryResumeId: string | null
  hasProfileBasics: boolean
}

export function WelcomeSection({
  fullName,
  email,
  primaryResumeId,
  hasProfileBasics,
}: WelcomeSectionProps) {
  const firstName = fullName?.trim().split(/\s+/)[0] || email.split("@")[0]

  return (
    <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasProfileBasics
            ? "Track your applications, keep your ATS resumes ready, and manage outreach drafts from one workspace."
            : "Start by completing your profile details so your resumes auto-fill with your experience and education."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {!hasProfileBasics ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/profile" />}
          >
            Complete Profile
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
        <Button
          nativeButton={false}
          render={
            <Link
              href={
                primaryResumeId
                  ? `/dashboard/resumes/${primaryResumeId}`
                  : "/dashboard/resumes/new"
              }
            />
          }
        >
          <Plus className="size-4" />
          {primaryResumeId ? "Open Primary Resume" : "Create Resume"}
        </Button>
      </div>
    </section>
  )
}
