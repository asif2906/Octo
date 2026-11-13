"use client"

import { Accordion } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"

interface FaqItem {
  value: string
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    value: "what-is-octo",
    question: "What is Octo.tech?",
    answer:
      "Octo.tech is an AI-powered job-search platform built for freshers, students, graduates, and early-career job seekers. You create your profile once and reuse it to build resumes, tailor applications, reach hiring managers directly, and track every result in one place.",
  },
  {
    value: "is-octo-free",
    question: "What subscription plans does Octo.tech offer?",
    answer:
      "Octo.tech offers three paid tiers: Lite ($2/week or $5/month), Basic ($4/week or $9/month), and Pro ($7/week or $19/month). There is no free tier. All plans include full ATS resume building, genuine PDF export, and verified outreach tracking with predictable daily quotas.",
  },
  {
    value: "ai-resume-tailoring",
    question: "How does AI resume tailoring work?",
    answer:
      "With your active subscription, you can paste any job description and generate an ATS-tailored resume version from your saved profile—highlighting relevant skills, projects, and experience without inventing facts.",
  },
  {
    value: "auto-apply",
    question: "Does Octo.tech automatically apply to jobs?",
    answer:
      "No unconfirmed mass-applying. Assisted auto-apply is designed to reduce repetitive form filling while always requiring your review and confirmation before submission. Octo.tech also does not use prohibited LinkedIn bot automation.",
  },
  {
    value: "contact-hiring-managers",
    question: "Can I contact hiring managers directly?",
    answer:
      "Yes. Cold email outreach lets you send personalized emails to founders, CEOs, and hiring managers from your personal recipient list, with built-in daily/weekly caps, opt-out lines, and do-not-contact controls.",
  },
  {
    value: "cancel-subscription",
    question: "Can I cancel my subscription?",
    answer:
      "Yes. Subscriptions can be cancelled at any time through the Dodo Payments customer portal with no lock-in or penalties. You retain full access to your plan until the end of your prepaid billing period.",
  },
  {
    value: "gmail-inbox-privacy",
    question: "Does Octo.tech read my Gmail inbox?",
    answer:
      "No. Gmail integration is strictly designed to use send-only permissions. Octo.tech will never read, scan, or store messages from your Gmail inbox.",
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-b border-border/60 bg-zinc-50/60 py-20 dark:bg-zinc-950/40 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-3 text-center">
          <p className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
            FAQ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-base text-muted-foreground">
            Clear answers on how Octo.tech works, pricing, and privacy.
          </p>
        </div>

        <Accordion.Root
          defaultValue={["what-is-octo"]}
          className="mt-10 divide-y divide-border rounded-xl border border-border bg-card"
        >
          {FAQ_ITEMS.map((item) => (
            <Accordion.Item key={item.value} value={item.value}>
              <Accordion.Header className="m-0">
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 sm:text-base">
                  <span>{item.question}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="overflow-hidden px-5 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-6">
                {item.answer}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}

