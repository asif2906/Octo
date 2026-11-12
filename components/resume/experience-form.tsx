"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientId } from "@/lib/resume/defaults"
import type { ResumeExperienceItem } from "@/types/database"

export function ExperienceForm({
  items,
  onChange,
}: {
  items: ResumeExperienceItem[]
  onChange: (next: ResumeExperienceItem[]) => void
}) {
  function addItem() {
    onChange([
      ...items,
      {
        id: createClientId("exp"),
        company: "",
        jobTitle: "",
        employmentType: "Full-time",
        location: "",
        startDate: "",
        endDate: "",
        currentlyWorking: false,
        description: "",
      },
    ])
  }

  function updateItem(
    id: string,
    patch: Partial<ResumeExperienceItem>
  ) {
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
          Add one bullet point per line for best ATS readability.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-3.5" />
          Add Role
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No experience entries on this resume yet.
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
                  Experience #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove experience entry"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Job Title</Label>
                  <Input
                    value={item.jobTitle}
                    onChange={(e) =>
                      updateItem(item.id, { jobTitle: e.target.value })
                    }
                    placeholder="Software Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Input
                    value={item.company}
                    onChange={(e) =>
                      updateItem(item.id, { company: e.target.value })
                    }
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={item.location}
                    onChange={(e) =>
                      updateItem(item.id, { location: e.target.value })
                    }
                    placeholder="Remote / New York, NY"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Employment Type</Label>
                  <Input
                    value={item.employmentType}
                    onChange={(e) =>
                      updateItem(item.id, { employmentType: e.target.value })
                    }
                    placeholder="Full-time"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input
                    value={item.startDate}
                    onChange={(e) =>
                      updateItem(item.id, { startDate: e.target.value })
                    }
                    placeholder="Jan 2023"
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input
                    value={item.endDate}
                    disabled={item.currentlyWorking}
                    onChange={(e) =>
                      updateItem(item.id, { endDate: e.target.value })
                    }
                    placeholder="Present or Dec 2024"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={item.currentlyWorking}
                  onChange={(e) =>
                    updateItem(item.id, { currentlyWorking: e.target.checked })
                  }
                />
                Currently working in this role
              </label>
              <div className="space-y-1">
                <Label>Accomplishments / Bullets</Label>
                <Textarea
                  rows={4}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  placeholder="Built API endpoints reducing latency by 35%..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

