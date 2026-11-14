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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          Resume Theme (12 Styles)
        </label>
        <span className="text-xs text-muted-foreground">Zero-cost client export</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 max-h-64 overflow-y-auto pr-1">
        {RESUME_TEMPLATES.map((tpl) => {
          const selected = tpl.id === value
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onChange(tpl.id)}
              className={cn(
                "rounded-lg border p-2.5 text-left transition-all duration-150 relative group",
                selected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border/70 hover:border-foreground/30 hover:bg-muted/40"
              )}
            >
              <p className="text-xs font-semibold text-foreground truncate">{tpl.name}</p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground line-clamp-2">
                {tpl.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
