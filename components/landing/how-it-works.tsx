import {
  FileCheck2,
  LineChart,
  Send,
  UserCheck,
  type LucideIcon,
} from "lucide-react"

interface StepItem {
  number: string
  title: string
  description: string
  icon: LucideIcon
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Create your profile.",
    description:
      "Add your education, experience, projects, and skills once so you never have to re-enter the same details.",
    icon: UserCheck,
  },
  {
    number: "02",
    title: "Build your resume.",
    description:
      "Generate structured resumes from clean templates and tailor versions for specific roles.",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Apply and reach decision-makers.",
    description:
      "Speed up repetitive forms with your confirmation and send personalized cold emails directly.",
    icon: Send,
  },
  {
    number: "04",
    title: "Track your progress.",
    description:
      "Keep every application, outreach thread, follow-up reminder, and outcome organized in one view.",
    icon: LineChart,
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-zinc-800 bg-zinc-950 py-20 text-zinc-50 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-xs font-medium tracking-wider text-zinc-400 uppercase">
            How It Works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From profile setup to offer, without the chaos.
          </h2>
          <p className="text-base leading-relaxed text-zinc-400">
            A focused four-step workflow designed for students, graduates, and
            early-career candidates.
          </p>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-zinc-400">
                    Step {step.number}
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200">
                    <Icon className="size-4" />
                  </div>
                </div>

                <h3 className="mt-5 text-base font-semibold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {step.description}
                </p>

                {index < STEPS.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -right-3 hidden h-px w-6 bg-zinc-800 lg:block"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

