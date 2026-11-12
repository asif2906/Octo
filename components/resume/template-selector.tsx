"use client"

import { cn } from "@/lib/utils"
import { RESUME_TEMPLATES } from "@/lib/resume/defaults"
import type { ResumeTemplateId } from "@/types/database"

export function TemplateSelector({
  value,
  onChange,
}: {
  value: ResumeTemplateId
  onChange: (next: ResumeTemplateId) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {RESUME_TEMPLATES.map((tpl) => {
        const selected = tpl.id === value
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(tpl.id)}
            className={cn(
              "rounded-xl border p-3.5 text-left transition-all",
              selected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-foreground/30 hover:bg-muted/30"
            )}
          >
            <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {tpl.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

