import Link from "next/link"
import { FilePlus2, Sparkles, BriefcaseBusiness, MailPlus } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const ACTIONS = [
  {
    href: "/dashboard/resumes/new",
    title: "Create Resume",
    description: "Build an ATS-friendly resume with PDF export",
    icon: FilePlus2,
  },
  {
    href: "/dashboard/resumes/tailor",
    title: "Tailor Resume",
    description: "Customize your resume for a specific job description",
    icon: Sparkles,
  },
  {
    href: "/dashboard/applications",
    title: "Add Application",
    description: "Log a new application and set its initial status",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/outreach",
    title: "Draft Cold Email",
    description: "Prepare recipient lists, templates, and outreach drafts",
    icon: MailPlus,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump directly to your core workflows</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-foreground/30 hover:bg-muted/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:underline">
                  {action.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

