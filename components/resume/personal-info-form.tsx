"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ResumePersonalInfo } from "@/types/database"

export function PersonalInfoForm({
  value,
  onChange,
}: {
  value: ResumePersonalInfo
  onChange: (next: ResumePersonalInfo) => void
}) {
  const update = (field: keyof ResumePersonalInfo, nextVal: string) => {
    onChange({ ...value, [field]: nextVal })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="resume-full-name">Full Name</Label>
          <Input
            id="resume-full-name"
            value={value.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-headline">Headline / Target Title</Label>
          <Input
            id="resume-headline"
            value={value.headline}
            onChange={(e) => update("headline", e.target.value)}
            placeholder="Senior Backend Engineer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-email">Email</Label>
          <Input
            id="resume-email"
            type="email"
            value={value.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="alex@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-phone">Phone</Label>
          <Input
            id="resume-phone"
            value={value.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-location">Location</Label>
          <Input
            id="resume-location"
            value={value.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Austin, TX"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-linkedin">LinkedIn URL</Label>
          <Input
            id="resume-linkedin"
            value={value.linkedinUrl}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-github">GitHub URL</Label>
          <Input
            id="resume-github"
            value={value.githubUrl}
            onChange={(e) => update("githubUrl", e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resume-portfolio">Portfolio URL</Label>
          <Input
            id="resume-portfolio"
            value={value.portfolioUrl}
            onChange={(e) => update("portfolioUrl", e.target.value)}
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resume-summary">Professional Summary</Label>
        <Textarea
          id="resume-summary"
          rows={4}
          value={value.summary}
          onChange={(e) => update("summary", e.target.value)}
          placeholder="Concise 2-4 sentence summary tailored to your target role."
        />
      </div>
    </div>
  )
}

