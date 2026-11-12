"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientId } from "@/lib/resume/defaults"
import type { ResumeProjectItem } from "@/types/database"

export function ProjectsForm({
  items,
  onChange,
}: {
  items: ResumeProjectItem[]
  onChange: (next: ResumeProjectItem[]) => void
}) {
  function addItem() {
    onChange([
      ...items,
      {
        id: createClientId("proj"),
        projectName: "",
        description: "",
        technologies: [],
        projectUrl: "",
        githubUrl: "",
        startDate: "",
        endDate: "",
      },
    ])
  }

  function updateItem(id: string, patch: Partial<ResumeProjectItem>) {
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
          Highlight relevant engineering, product, or research projects.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-3.5" />
          Add Project
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No projects on this resume yet.
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
                  Project #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove project"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Project Name</Label>
                  <Input
                    value={item.projectName}
                    onChange={(e) =>
                      updateItem(item.id, { projectName: e.target.value })
                    }
                    placeholder="Octo Resume Engine"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Technologies (comma separated)</Label>
                  <Input
                    value={item.technologies.join(", ")}
                    onChange={(e) =>
                      updateItem(item.id, {
                        technologies: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Next.js, TypeScript, Postgres"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Project URL</Label>
                  <Input
                    value={item.projectUrl}
                    onChange={(e) =>
                      updateItem(item.id, { projectUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>GitHub URL</Label>
                  <Input
                    value={item.githubUrl}
                    onChange={(e) =>
                      updateItem(item.id, { githubUrl: e.target.value })
                    }
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description / Bullets</Label>
                <Textarea
                  rows={3}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  placeholder="Describe architecture, scale, or impact..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

