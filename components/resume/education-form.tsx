"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientId } from "@/lib/resume/defaults"
import type { ResumeEducationItem } from "@/types/database"

export function EducationForm({
  items,
  onChange,
}: {
  items: ResumeEducationItem[]
  onChange: (next: ResumeEducationItem[]) => void
}) {
  function addItem() {
    onChange([
      ...items,
      {
        id: createClientId("edu"),
        institution: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        grade: "",
        description: "",
      },
    ])
  }

  function updateItem(id: string, patch: Partial<ResumeEducationItem>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Include degrees, universities, graduation dates, and relevant honors.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-3.5" />
          Add Education
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No education entries on this resume yet.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Education #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove education entry"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Institution</Label>
                  <Input
                    value={item.institution}
                    onChange={(e) =>
                      updateItem(item.id, { institution: e.target.value })
                    }
                    placeholder="State University"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Degree</Label>
                  <Input
                    value={item.degree}
                    onChange={(e) =>
                      updateItem(item.id, { degree: e.target.value })
                    }
                    placeholder="B.S."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Field of Study</Label>
                  <Input
                    value={item.fieldOfStudy}
                    onChange={(e) =>
                      updateItem(item.id, { fieldOfStudy: e.target.value })
                    }
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Grade / GPA</Label>
                  <Input
                    value={item.grade}
                    onChange={(e) =>
                      updateItem(item.id, { grade: e.target.value })
                    }
                    placeholder="3.8 / 4.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input
                    value={item.startDate}
                    onChange={(e) =>
                      updateItem(item.id, { startDate: e.target.value })
                    }
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input
                    value={item.endDate}
                    onChange={(e) =>
                      updateItem(item.id, { endDate: e.target.value })
                    }
                    placeholder="2024"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Additional Details</Label>
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  placeholder="Relevant coursework, honors, thesis..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

