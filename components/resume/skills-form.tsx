"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { createClientId } from "@/lib/resume/defaults"
import type { ResumeSkillItem } from "@/types/database"

export function SkillsForm({
  items,
  onChange,
}: {
  items: ResumeSkillItem[]
  onChange: (next: ResumeSkillItem[]) => void
}) {
  const [skillName, setSkillName] = React.useState("")
  const [proficiency, setProficiency] = React.useState("Proficient")

  function addSkill() {
    const trimmed = skillName.trim()
    if (!trimmed) return
    onChange([
      ...items,
      {
        id: createClientId("skill"),
        skillName: trimmed,
        proficiency,
      },
    ])
    setSkillName("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addSkill()
            }
          }}
          placeholder="Add a skill (e.g. TypeScript, React, SQL)"
          className="min-w-44 flex-1"
        />
        <Select
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
          className="w-36"
          aria-label="Skill proficiency"
        >
          <option value="Expert">Expert</option>
          <option value="Proficient">Proficient</option>
          <option value="Intermediate">Intermediate</option>
          <option value="">No label</option>
        </Select>
        <Button type="button" variant="outline" onClick={addSkill}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No skills added to this resume yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 py-1 pr-2 pl-3 text-xs"
            >
              <span className="font-medium text-foreground">
                {item.skillName}
              </span>
              {item.proficiency ? (
                <span className="text-muted-foreground">
                  ({item.proficiency})
                </span>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  onChange(items.filter((s) => s.id !== item.id))
                }
                aria-label={`Remove ${item.skillName}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

