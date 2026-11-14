import { cn } from "@/lib/utils"
import { normalizeResumeContent } from "@/lib/resume/defaults"
import type { ResumeContent, ResumeTemplateId, ResumeThemeConfig } from "@/types/database"

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
  themeConfig,
}: {
  content: ResumeContent
  template: ResumeTemplateId
  themeConfig?: Partial<ResumeThemeConfig>
}) {
  const content = normalizeResumeContent(rawContent)
  const p = content.personalInfo

  // Determine active theme style
  const theme = (template === "modern-professional" ? "modern" :
    template === "classic-professional" ? "classic" :
    template === "minimal-ats" ? "minimal" : template) || "modern"

  const isModern = theme === "modern"
  const isClassic = theme === "classic"
  const isMinimal = theme === "minimal"
  const isExecutive = theme === "executive"
  const isCreative = theme === "creative"
  const isCompact = theme === "compact"
  const isElegant = theme === "elegant"
  const isTechnical = theme === "technical"
  const isTimeline = theme === "timeline"
  const isBold = theme === "bold"
  const isSplit = theme === "split"
  const isNordic = theme === "nordic"

  const primaryColor = themeConfig?.primaryColor || (
    isCreative ? "#6366f1" :
    isModern ? "#0f172a" :
    isExecutive ? "#1e293b" :
    isTechnical ? "#0284c7" :
    isNordic ? "#475569" : "#09090b"
  )

  const contactItems = [
    p.email,
    p.phone,
    p.location,
    p.linkedinUrl,
    p.githubUrl,
    p.portfolioUrl,
  ]
    .map((item) => item?.trim())
    .filter(Boolean)

  return (
    <div
      id="resume-preview-sheet"
      className={cn(
        "mx-auto w-full max-w-[816px] rounded-xl border border-border bg-white text-zinc-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none transition-all",
        isCompact ? "p-6 text-[11.5px]" : "p-8 sm:p-10 text-[13px]",
        (isClassic || isElegant) ? "font-serif" : isTechnical ? "font-mono" : "font-sans"
      )}
    >
      {/* Bold Header Banner */}
      {isBold && (
        <div className="mb-6 -mx-8 -mt-8 sm:-mx-10 sm:-mt-10 bg-zinc-950 p-8 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">{p.fullName.trim() || "Your Full Name"}</h1>
          {p.headline.trim() && <p className="mt-1 text-sm text-zinc-300 font-medium">{p.headline}</p>}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
            {contactItems.join("  •  ")}
          </div>
        </div>
      )}

      {/* Modern Top Stripe */}
      {isModern && (
        <div className="mb-4 h-1.5 w-full rounded-full" style={{ backgroundColor: primaryColor }} />
      )}

      {/* Header for non-bold themes */}
      {!isBold && (
        <header
          className={cn(
            "border-b pb-4",
            isExecutive ? "border-zinc-800 border-b-2" : "border-zinc-200",
            (isClassic || isExecutive) && "text-center",
            isCreative && "border-l-4 pl-4 border-b-0",
            isNordic && "border-b-0 pb-2"
          )}
          style={isCreative ? { borderLeftColor: primaryColor } : undefined}
        >
          <h1
            className={cn(
              "font-bold tracking-tight",
              isCompact ? "text-xl" : "text-2xl sm:text-3xl",
              isExecutive && "uppercase tracking-widest font-serif"
            )}
            style={{ color: primaryColor }}
          >
            {p.fullName.trim() || "Your Full Name"}
          </h1>
          {p.headline.trim() ? (
            <p className={cn("mt-0.5 text-sm text-zinc-600", isExecutive ? "font-serif italic" : "font-medium")}>
              {p.headline}
            </p>
          ) : null}
          {contactItems.length > 0 ? (
            <p
              className={cn(
                "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-600",
                (isClassic || isExecutive) && "justify-center"
              )}
            >
              {contactItems.join("  |  ")}
            </p>
          ) : null}
        </header>
      )}

      {/* Split layout or regular flow */}
      <div className={cn("mt-5 space-y-5 leading-relaxed", isSplit && "grid grid-cols-1 md:grid-cols-3 gap-6 space-y-0")}>
        {/* Left column in Split mode */}
        {isSplit && (
          <aside className="space-y-5 border-r border-zinc-200 pr-5">
            {content.skills.length > 0 && (
              <section>
                <h3 className="border-b border-zinc-300 pb-1 text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Skills
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {content.skills.map((s) => (
                    <span key={s.id} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-800">
                      {s.skillName}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {content.education.length > 0 && (
              <section>
                <h3 className="border-b border-zinc-300 pb-1 text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Education
                </h3>
                <div className="mt-2 space-y-2">
                  {content.education.map((item) => (
                    <div key={item.id} className="text-xs">
                      <p className="font-semibold text-zinc-900">{item.degree}</p>
                      <p className="text-zinc-600">{item.institution}</p>
                      <p className="text-zinc-400">{dateRange(item.startDate, item.endDate)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        )}

        {/* Main Content Area */}
        <div className={cn("space-y-5", isSplit && "md:col-span-2")}>
          {content.sectionOrder.map((sectionKey) => {
            // Split mode handles education & skills on sidebar
            if (isSplit && (sectionKey === "skills" || sectionKey === "education")) {
              return null
            }

            if (sectionKey === "summary") {
              if (!p.summary.trim()) return null
              return (
                <section key="summary">
                  <h3
                    className={cn(
                      "border-b pb-1 text-xs font-bold tracking-wider uppercase",
                      isNordic ? "border-zinc-100 font-sans tracking-widest text-zinc-500 lowercase" : "border-zinc-200 text-zinc-900"
                    )}
                  >
                    Professional Summary
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-zinc-800">{p.summary}</p>
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
                      isNordic ? "border-zinc-100 font-sans tracking-widest text-zinc-500 lowercase" : "border-zinc-200 text-zinc-900"
                    )}
                  >
                    Work Experience
                  </h3>
                  <div className={cn("mt-3 space-y-4", isTimeline && "border-l-2 border-zinc-200 pl-4 space-y-5")}>
                    {content.experience.map((item) => {
                      const bullets = parseBullets(item.description)
                      return (
                        <div key={item.id} className="relative">
                          {isTimeline && (
                            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-900 ring-4 ring-white" />
                          )}
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-semibold text-zinc-950">
                              {[item.jobTitle, item.company].filter(Boolean).join(" — ") || "Role"}
                            </p>
                            <span className="text-xs text-zinc-600">
                              {dateRange(item.startDate, item.endDate, item.currentlyWorking)}
                            </span>
                          </div>
                          {item.employmentType || item.location ? (
                            <p className="text-xs italic text-zinc-600">
                              {[item.employmentType, item.location].filter(Boolean).join(" · ")}
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
                  <h3 className="border-b border-zinc-200 pb-1 text-xs font-bold tracking-wider uppercase text-zinc-900">
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
                          {[item.institution, item.grade ? `GPA: ${item.grade}` : ""].filter(Boolean).join(" · ")}
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
                  <h3 className="border-b border-zinc-200 pb-1 text-xs font-bold tracking-wider uppercase text-zinc-900">
                    Skills
                  </h3>
                  {isTechnical ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {content.skills.map((s) => (
                        <span key={s.id} className="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-xs font-mono text-zinc-800">
                          {s.skillName}
                        </span>
                      ))}
                    </div>
                  ) : isCreative ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {content.skills.map((s) => (
                        <span key={s.id} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {s.skillName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-zinc-800">
                      {content.skills
                        .map((s) => (s.proficiency ? `${s.skillName} (${s.proficiency})` : s.skillName))
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </section>
              )
            }

            if (sectionKey === "projects") {
              if (content.projects.length === 0) return null
              return (
                <section key="projects">
                  <h3 className="border-b border-zinc-200 pb-1 text-xs font-bold tracking-wider uppercase text-zinc-900">
                    Projects
                  </h3>
                  <div className="mt-2.5 space-y-3">
                    {content.projects.map((item) => {
                      const bullets = parseBullets(item.description)
                      return (
                        <div key={item.id}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-semibold text-zinc-950">{item.projectName}</p>
                            <span className="text-xs text-zinc-600">
                              {dateRange(item.startDate, item.endDate)}
                            </span>
                          </div>
                          {item.technologies.length > 0 ? (
                            <p className="text-xs font-medium text-zinc-600">
                              Technologies: {item.technologies.join(", ")}
                            </p>
                          ) : null}
                          {bullets.length > 0 ? (
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-zinc-800">
                              {bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
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
    </div>
  )
}
