import {
  BellRing,
  ClipboardCheck,
  FileText,
  Kanban,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FeatureItem {
  title: string
  description: string
  icon: LucideIcon
  status: string
}

const FEATURES: FeatureItem[] = [
  {
    title: "AI Resume Builder",
    description:
      "Build professional resumes using customizable templates.",
    icon: FileText,
    status: "Coming Soon",
  },
  {
    title: "AI Resume Tailoring",
    description:
      "Customize your resume for individual job descriptions.",
    icon: Sparkles,
    status: "Coming Soon",
  },
  {
    title: "Assisted Auto-Apply",
    description:
      "Reduce repetitive application work with assisted form filling and user confirmation.",
    icon: ClipboardCheck,
    status: "Coming Soon",
  },
  {
    title: "Cold Email Outreach",
    description:
      "Reach founders, CEOs, and hiring managers through personalized emails.",
    icon: Mail,
    status: "Coming Soon",
  },
  {
    title: "Application Tracker",
    description:
      "Track applications, outreach messages, rejections, and successful outcomes.",
    icon: Kanban,
    status: "Coming Soon",
  },
  {
    title: "Smart Follow-ups",
    description:
      "Manage follow-up reminders and avoid losing track of opportunities.",
    icon: BellRing,
    status: "Coming Soon",
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-border/60 bg-zinc-50/60 py-20 dark:bg-zinc-950/40 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Platform Capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for every step of your job search.
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Create your profile once and reuse it across resumes, applications,
            direct outreach, and progress tracking.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                      <Icon className="size-4" />
                    </div>
                    <Badge variant="subtle" className="text-[11px]">
                      {feature.status}
                    </Badge>
                  </div>

                  <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

