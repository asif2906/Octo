import type { ResumeContent, ResumeExperienceItem, ResumeEducationItem, ResumeSkillItem, ResumeProjectItem } from "@/types/database"

export interface ParsedResumeResult {
  content: ResumeContent
  detectedSkillsCount: number
  rawText: string
}

export function parseResumeTextToStructured(text: string): ParsedResumeResult {
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = cleanText.split("\n").map((l) => l.trim()).filter(Boolean)

  // 1. Personal Info Extraction
  const fullName = lines[0] || "Candidate"
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const email = emailMatch ? emailMatch[0] : ""

  const phoneMatch = cleanText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0] : ""

  const linkedinMatch = cleanText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)
  const linkedinUrl = linkedinMatch ? linkedinMatch[0] : ""

  const githubMatch = cleanText.match(/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+/i)
  const githubUrl = githubMatch ? githubMatch[0] : ""

  const portfolioMatch = cleanText.match(/https?:\/\/(?!www\.linkedin|www\.github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/i)
  const portfolioUrl = portfolioMatch ? portfolioMatch[0] : ""

  // Location heuristic (look for City, State / Country in top 5 lines)
  let location = ""
  for (const line of lines.slice(1, 6)) {
    if (/[a-zA-Z\s]+,\s*[A-Z]{2}\b|[a-zA-Z\s]+,\s*[a-zA-Z\s]+/i.test(line) && !line.includes("@") && !line.includes("http")) {
      location = line.replace(/\|/g, "").trim()
      break
    }
  }

  // 2. Identify Section Headers
  const sectionKeywords: Record<string, string[]> = {
    summary: ["summary", "professional summary", "about", "profile", "objective"],
    experience: ["experience", "work experience", "employment history", "professional experience", "work history"],
    education: ["education", "academic background", "academics"],
    skills: ["skills", "technical skills", "technologies", "core competencies", "tools & technologies"],
    projects: ["projects", "personal projects", "academic projects", "key projects"],
  }

  interface SectionBlock {
    type: string
    startIndex: number
    endIndex: number
  }

  const identifiedSections: Array<{ type: string; lineIndex: number }> = []

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase().replace(/[^a-z\s]/g, "").trim()
    for (const [secType, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.includes(lower)) {
        identifiedSections.push({ type: secType, lineIndex: idx })
        break
      }
    }
  })

  // Sort by lineIndex
  identifiedSections.sort((a, b) => a.lineIndex - b.lineIndex)

  // Map section text spans
  const sectionContent: Record<string, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
  }

  identifiedSections.forEach((sec, idx) => {
    const nextSec = identifiedSections[idx + 1]
    const end = nextSec ? nextSec.lineIndex : lines.length
    sectionContent[sec.type] = lines.slice(sec.lineIndex + 1, end)
  })

  // 3. Parse Summary
  const summary = sectionContent.summary.join(" ").slice(0, 1000)

  // 4. Parse Skills
  const commonTechSkills = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "C++", "C#", "Go",
    "Rust", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "Git", "GitHub", "CI/CD", "Tailwind CSS", "HTML5", "CSS3", "REST APIs", "GraphQL", "Linux",
    "FastAPI", "Django", "Flask", "Express.js", "Vue.js", "Angular", "Redux", "Jest", "Microservices"
  ]

  const extractedSkills: ResumeSkillItem[] = []
  const skillsText = (sectionContent.skills.join(" ") + " " + cleanText).toLowerCase()

  commonTechSkills.forEach((skill) => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    if (regex.test(skillsText)) {
      extractedSkills.push({
        id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        skillName: skill,
        proficiency: "Proficient",
      })
    }
  })

  // Also include any comma-delimited items directly listed under skills section
  if (sectionContent.skills.length > 0) {
    sectionContent.skills.forEach((line) => {
      if (line.includes(",") || line.includes("•") || line.includes("|")) {
        const parts = line.split(/[,•|]/).map((p) => p.trim()).filter((p) => p.length > 1 && p.length < 30)
        parts.forEach((p) => {
          if (!extractedSkills.some((s) => s.skillName.toLowerCase() === p.toLowerCase())) {
            extractedSkills.push({
              id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              skillName: p,
              proficiency: "Proficient",
            })
          }
        })
      }
    })
  }

  // 5. Parse Experience Items
  const experience: ResumeExperienceItem[] = []
  const expLines = sectionContent.experience

  let currentExp: Partial<ResumeExperienceItem> | null = null
  let currentBullets: string[] = []

  const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/)?\s*\d{4}\s*(?:-|–|—|to)\s*(?:present|current|\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/)?\s*\d{4})/i

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i]
    const hasDate = datePattern.test(line)

    if (hasDate || line.includes(" - ") || line.includes(" — ") || line.includes(" | ")) {
      if (currentExp && (currentExp.company || currentExp.jobTitle)) {
        experience.push({
          id: `exp-${Date.now()}-${experience.length}`,
          company: currentExp.company || "Company",
          jobTitle: currentExp.jobTitle || "Software Engineer",
          employmentType: "Full-time",
          location: currentExp.location || "",
          startDate: currentExp.startDate || "2022",
          endDate: currentExp.endDate || "Present",
          currentlyWorking: currentExp.currentlyWorking ?? true,
          description: currentBullets.join("\n"),
        })
        currentBullets = []
      }

      // Extract dates
      const dateMatch = line.match(datePattern)
      let startDate = ""
      let endDate = ""
      let currentlyWorking = false

      if (dateMatch) {
        const dateStr = dateMatch[0]
        const parts = dateStr.split(/(?:-|–|—|to)/i).map((s) => s.trim())
        startDate = parts[0] || ""
        endDate = parts[1] || ""
        currentlyWorking = /present|current/i.test(endDate)
      }

      // Title & Company
      const cleanLineWithoutDate = line.replace(datePattern, "").trim()
      const titleParts = cleanLineWithoutDate.split(/[-—|]/).map((s) => s.trim()).filter(Boolean)

      currentExp = {
        jobTitle: titleParts[0] || "Engineer",
        company: titleParts[1] || "Tech Co",
        startDate,
        endDate,
        currentlyWorking,
      }
    } else if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
      currentBullets.push(line.replace(/^[-•*]\s*/, ""))
    } else if (currentExp) {
      currentBullets.push(line)
    }
  }

  // Push last exp item
  if (currentExp && (currentExp.company || currentExp.jobTitle)) {
    experience.push({
      id: `exp-${Date.now()}-${experience.length}`,
      company: currentExp.company || "Company",
      jobTitle: currentExp.jobTitle || "Software Engineer",
      employmentType: "Full-time",
      location: currentExp.location || "",
      startDate: currentExp.startDate || "2022",
      endDate: currentExp.endDate || "Present",
      currentlyWorking: currentExp.currentlyWorking ?? true,
      description: currentBullets.join("\n"),
    })
  }

  // 6. Parse Education
  const education: ResumeEducationItem[] = []
  const eduLines = sectionContent.education

  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i]
    if (/bachelor|master|phd|b\.s|m\.s|b\.e|b\.tech|degree|university|college|institute/i.test(line)) {
      const dateMatch = line.match(/\b(19|20)\d{2}\b/g)
      education.push({
        id: `edu-${Date.now()}-${education.length}`,
        institution: line.split(/[-—|,]/)[0]?.trim() || "University",
        degree: line.split(/[-—|,]/)[1]?.trim() || "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        startDate: dateMatch?.[0] || "",
        endDate: dateMatch?.[1] || dateMatch?.[0] || "",
        grade: "",
        description: "",
      })
    }
  }

  // Fallback defaults if sections empty
  if (experience.length === 0 && cleanText.length > 50) {
    experience.push({
      id: `exp-auto-1`,
      company: "Previous Experience",
      jobTitle: "Software Developer",
      employmentType: "Full-time",
      location: location || "Remote",
      startDate: "2022",
      endDate: "Present",
      currentlyWorking: true,
      description: cleanText.slice(0, 300),
    })
  }

  return {
    content: {
      personalInfo: {
        fullName,
        email,
        phone,
        location,
        headline: lines[1] && !lines[1].includes("@") ? lines[1] : "Software Engineer",
        summary,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
      },
      experience,
      education,
      skills: extractedSkills.slice(0, 25),
      projects: [],
      sectionOrder: ["summary", "experience", "education", "skills", "projects"],
    },
    detectedSkillsCount: extractedSkills.length,
    rawText: cleanText,
  }
}

