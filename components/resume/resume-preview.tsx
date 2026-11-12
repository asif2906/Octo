import { cn } from "@/lib/utils"
import { normalizeResumeContent } from "@/lib/resume/defaults"
import type { ResumeContent, ResumeTemplateId } from "@/types/database"

function parseBullets(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
}

function dateRange(
  startDate: string,
  endDate: string,
  currentlyWorking?: boolean
): string {
  const start = startDate.trim()
  const end = currentlyWorking ? "Present" : endDate.trim()
  if (!start && !end) return ""
  if (start && end) return `${start} — ${end}`
  return start || end
}

export function ResumePreview({
  content: rawContent,
  template,
}: {
  content: ResumeContent
  template: ResumeTemplateId
}) {
  const content = normalizeResumeContent(rawContent)
  const p = content.personalInfo

  const isModern = template === "modern-professional"
  const isClassic = template === "classic-professional"

  const contactItems = [
    p.email,
    p.phone,
    p.location,
    p.linkedinUrl,
    p.githubUrl,
    p.portfolioUrl,
  ]
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div
      id="resume-preview-sheet"
      className={cn(
        "mx-auto w-full max-w-[816px] rounded-xl border border-border bg-white p-8 text-zinc-900 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none",
        isClassic ? "font-serif" : "font-sans"
      )}
    >
      {isModern ? (
        <div className="mb-4 h-1 w-full rounded-full bg-slate-800" />
      ) : null}

      <header
        className={cn(
          "border-b pb-4",
          isModern ? "border-slate-300" : "border-zinc-300",
          isClassic && "text-center"
        )}
      >
        <h2
          className={cn(
            "text-2xl font-bold tracking-tight",
            isModern ? "text-slate-900" : "text-zinc-950"
          )}
        >
          {p.fullName.trim() || "Your Full Name"}
        </h2>
        {p.headline.trim() ? (
          <p className="mt-0.5 text-sm italic text-zinc-600">{p.headline}</p>
        ) : null}
        {contactItems.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-600 data-[centered=true]:justify-center" data-centered={isClassic}>
            {contactItems.join("  |  ")}
          </p>
        ) : null}
      </header>

      <div className="mt-5 space-y-5 text-[13px] leading-relaxed">
        {content.sectionOrder.map((sectionKey) => {
          if (sectionKey === "summary") {
            if (!p.summary.trim()) return null
            return (
              <section key="summary">
                <h3
                  className={cn(
                    "border-b pb-1 text-xs font-bold tracking-wider uppercase",
                    isModern
                      ? "border-slate-200 text-slate-800"
                      : "border-zinc-300 text-zinc-900"
                  )}
                >
                  Professional Summary
                </h3>
                <p className="mt-2 whitespace-pre-line text-zinc-800">
                  {p.summary}
                </p>
              </section>
            )
          }

          if (sectionKey === "experience") {
            if (content.experience.length === 0) return null
            return (
              <section key="experience">
                <h3
                  className={cn(
                    "border-b pb-1 text-xs font-bold tracking-wider uppercase",
                    isModern
                      ? "border-slate-200 text-slate-800"
                      : "border-zinc-300 text-zinc-900"
                  )}
                >
                  Work Experience
                </h3>
                <div className="mt-2.5 space-y-3.5">
                  {content.experience.map((item) => {
                    const bullets = parseBullets(item.description)
                    return (
                      <div key={item.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold text-zinc-950">
                            {[item.jobTitle, item.company]
                              .filter(Boolean)
                              .join(" — ") || "Role"}
                          </p>
                          <span className="text-xs text-zinc-600">
                            {dateRange(
                              item.startDate,
                              item.endDate,
                              item.currentlyWorking
                            )}
                          </span>
                        </div>
                        {item.employmentType || item.location ? (
                          <p className="text-xs italic text-zinc-600">
                            {[item.employmentType, item.location]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                        {bullets.length > 0 ? (
                          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-zinc-800">
                            {bullets.map((bullet, idx) => (
                              <li key={idx}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          }

          if (sectionKey === "education") {
            if (content.education.length === 0) return null
            return (
              <section key="education">
                <h3
                  className={cn(
                    "border-b pb-1 text-xs font-bold tracking-wider uppercase",
                    isModern
                      ? "border-slate-200 text-slate-800"
                      : "border-zinc-300 text-zinc-900"
                  )}
                >
                  Education
                </h3>
                <div className="mt-2.5 space-y-3">
                  {content.education.map((item) => (
                    <div key={item.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-zinc-950">
                          {item.degree}
                          {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ""}
                        </p>
                        <span className="text-xs text-zinc-600">
                          {dateRange(item.startDate, item.endDate)}
                        </span>
                      </div>
                      <p className="text-xs italic text-zinc-600">
                        {[
                          item.institution,
                          item.grade ? `GPA/Grade: ${item.grade}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {item.description.trim() ? (
                        <p className="mt-1 text-zinc-800">{item.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (sectionKey === "skills") {
            if (content.skills.length === 0) return null
            return (
              <section key="skills">
                <h3
                  className={cn(
                    "border-b pb-1 text-xs font-bold tracking-wider uppercase",
                    isModern
                      ? "border-slate-200 text-slate-800"
                      : "border-zinc-300 text-zinc-900"
                  )}
                >
                  Skills
                </h3>
                <p className="mt-2 text-zinc-800">
                  {content.skills
                    .map((s) =>
                      s.proficiency
                        ? `${s.skillName} (${s.proficiency})`
                        : s.skillName
                    )
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </section>
            )
          }

          if (sectionKey === "projects") {
            if (content.projects.length === 0) return null
            return (
              <section key="projects">
                <h3
                  className={cn(
                    "border-b pb-1 text-xs font-bold tracking-wider uppercase",
                    isModern
                      ? "border-slate-200 text-slate-800"
                      : "border-zinc-300 text-zinc-900"
                  )}
                >
                  Projects
                </h3>
                <div className="mt-2.5 space-y-3">
                  {content.projects.map((item) => {
                    const bullets = parseBullets(item.description)
                    const meta = [
                      item.technologies.length > 0
                        ? `Technologies: ${item.technologies.join(", ")}`
                        : "",
                      item.projectUrl,
                      item.githubUrl,
                    ]
                      .filter(Boolean)
                      .join(" · ")

                    return (
                      <div key={item.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold text-zinc-950">
                            {item.projectName || "Project"}
                          </p>
                          <span className="text-xs text-zinc-600">
                            {dateRange(item.startDate, item.endDate)}
                          </span>
                        </div>
                        {meta ? (
                          <p className="text-xs italic text-zinc-600">{meta}</p>
                        ) : null}
                        {bullets.length > 0 ? (
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-zinc-800">
                            {bullets.map((bullet, idx) => (
                              <li key={idx}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}

