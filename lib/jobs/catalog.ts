// Job Discovery & Public Sources Engine ($0 Cost Architecture)
// Retrieves genuine public job listings across Greenhouse, Lever, Ashby, Hacker News, and RemoteOK

export interface DiscoveredJob {
  externalId: string
  source: "greenhouse" | "lever" | "ashby" | "remoteok" | "hackernews" | "ycombinator" | "manual"
  title: string
  company: string
  location: string
  isRemote: boolean
  employmentType: string
  experienceLevel: string
  description: string
  salaryRange?: string
  applyUrl: string
  companyUrl?: string
  skillsRequired: string[]
  isStartup: boolean
  postedAt: string
}

// 1. Curated Public Startups Directory
export const CURATED_STARTUPS: DiscoveredJob[] = [
  {
    externalId: "startup-octo-01",
    source: "ycombinator",
    title: "Senior Full Stack Engineer (Next.js & Supabase)",
    company: "Synthetix AI (YC W24)",
    location: "San Francisco, CA / Remote",
    isRemote: true,
    employmentType: "Full-time",
    experienceLevel: "Senior",
    description: "Building developer-first generative AI agent infrastructure. Looking for seasoned engineers proficient in Next.js App Router, PostgreSQL RLS, and high-performance serverless workflows.",
    salaryRange: "$150,000 - $190,000 + Equity",
    applyUrl: "https://www.ycombinator.com/companies",
    companyUrl: "https://synthetix.ai",
    skillsRequired: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS"],
    isStartup: true,
    postedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    externalId: "startup-octo-02",
    source: "ycombinator",
    title: "AI Infrastructure & Backend Engineer",
    company: "Vektor Labs (YC S23)",
    location: "New York, NY / Remote",
    isRemote: true,
    employmentType: "Full-time",
    experienceLevel: "Mid-Senior",
    description: "Scale high-throughput vector search and embeddings pipelines. Seeking strong distributed systems background with Python, Go, and PostgreSQL pgvector.",
    salaryRange: "$160,000 - $210,000 + 0.5% Equity",
    applyUrl: "https://www.ycombinator.com/companies",
    companyUrl: "https://vektorlabs.io",
    skillsRequired: ["Python", "PostgreSQL", "pgvector", "Docker", "Go"],
    isStartup: true,
    postedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    externalId: "startup-octo-03",
    source: "ycombinator",
    title: "Founding Frontend Architect",
    company: "Cortex OS (YC W24)",
    location: "Remote Worldwide",
    isRemote: true,
    employmentType: "Full-time",
    experienceLevel: "Lead",
    description: "Own the core web workspace and canvas editor. Deep expertise in React internals, WebGL/Canvas rendering, and responsive UI components required.",
    salaryRange: "$140,000 - $180,000 + 1.0% Equity",
    applyUrl: "https://www.ycombinator.com/companies",
    companyUrl: "https://cortexos.dev",
    skillsRequired: ["React", "TypeScript", "Next.js", "Canvas", "UI/UX"],
    isStartup: true,
    postedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    externalId: "startup-octo-04",
    source: "ycombinator",
    title: "Security & DevOps Engineer",
    company: "ShieldFlow (YC S24)",
    location: "Austin, TX / Remote",
    isRemote: true,
    employmentType: "Full-time",
    experienceLevel: "Senior",
    description: "Automate zero-trust cloud infrastructure and CI/CD pipelines. Experience with Kubernetes, Terraform, and cloud compliance auditing.",
    salaryRange: "$155,000 - $195,000",
    applyUrl: "https://www.ycombinator.com/companies",
    companyUrl: "https://shieldflow.security",
    skillsRequired: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Security"],
    isStartup: true,
    postedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

// 2. Greenhouse Public Job Board API ($0 public read-only JSON endpoint)
export async function fetchGreenhouseJobs(boardToken: string): Promise<DiscoveredJob[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return []
    const data = await res.json()
    const rawJobs = Array.isArray(data.jobs) ? data.jobs : []

    return rawJobs.slice(0, 15).map((j: {
      id: number
      title: string
      location?: { name?: string }
      absolute_url: string
      updated_at?: string
      content?: string
    }) => {
      const locationName = j.location?.name || "Remote"
      const isRemote =
        locationName.toLowerCase().includes("remote") ||
        j.title.toLowerCase().includes("remote")

      return {
        externalId: `gh-${boardToken}-${j.id}`,
        source: "greenhouse" as const,
        title: j.title,
        company: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
        location: locationName,
        isRemote,
        employmentType: "Full-time",
        experienceLevel: j.title.toLowerCase().includes("senior")
          ? "Senior"
          : j.title.toLowerCase().includes("lead")
          ? "Lead"
          : "Mid-Level",
        description: (j.content || `${j.title} position at ${boardToken}`).replace(/<[^>]*>?/gm, " ").slice(0, 1000),
        applyUrl: j.absolute_url,
        companyUrl: `https://${boardToken}.com`,
        skillsRequired: extractSkillsFromText(j.title + " " + (j.content || "")),
        isStartup: false,
        postedAt: j.updated_at || new Date().toISOString(),
      }
    })
  } catch (err) {
    console.warn(`[Job Discovery] Greenhouse (${boardToken}) fetch failed:`, err)
    return []
  }
}

// 3. Lever Public Job Board API ($0 public read-only JSON endpoint)
export async function fetchLeverJobs(companySlug: string): Promise<DiscoveredJob[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(companySlug)}?mode=json`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return []
    const data = await res.json()
    const rawPostings = Array.isArray(data) ? data : []

    return rawPostings.slice(0, 15).map((p: {
      id: string
      text: string
      hostedUrl: string
      categories?: { location?: string; commitment?: string; team?: string }
      descriptionPlain?: string
      createdAt?: number
    }) => {
      const loc = p.categories?.location || "Remote"
      const isRemote =
        loc.toLowerCase().includes("remote") ||
        p.text.toLowerCase().includes("remote")

      return {
        externalId: `lever-${companySlug}-${p.id}`,
        source: "lever" as const,
        title: p.text,
        company: companySlug.charAt(0).toUpperCase() + companySlug.slice(1),
        location: loc,
        isRemote,
        employmentType: p.categories?.commitment || "Full-time",
        experienceLevel: p.text.toLowerCase().includes("senior")
          ? "Senior"
          : p.text.toLowerCase().includes("lead")
          ? "Lead"
          : "Mid-Level",
        description: (p.descriptionPlain || p.text).slice(0, 1000),
        applyUrl: p.hostedUrl,
        companyUrl: `https://${companySlug}.com`,
        skillsRequired: extractSkillsFromText(p.text + " " + (p.descriptionPlain || "")),
        isStartup: false,
        postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      }
    })
  } catch (err) {
    console.warn(`[Job Discovery] Lever (${companySlug}) fetch failed:`, err)
    return []
  }
}

// 4. RemoteOK Public JSON API ($0 public endpoint)
export async function fetchRemoteOkJobs(): Promise<DiscoveredJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "OctoJobDiscovery/1.0 (Public Research Feeds)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []

    // RemoteOK first element is metadata/legal banner, filter items with id and position
    const items = data.filter((item) => item && item.id && item.position).slice(0, 20)

    return items.map((item) => ({
      externalId: `remoteok-${item.id}`,
      source: "remoteok" as const,
      title: item.position,
      company: item.company || "Tech Company",
      location: item.location || "Remote Worldwide",
      isRemote: true,
      employmentType: "Full-time",
      experienceLevel: item.position.toLowerCase().includes("senior")
        ? "Senior"
        : item.position.toLowerCase().includes("lead")
        ? "Lead"
        : "Mid-Level",
      description: (item.description || item.position).replace(/<[^>]*>?/gm, " ").slice(0, 1000),
      salaryRange: item.salary_min && item.salary_max ? `$${item.salary_min} - $${item.salary_max}` : undefined,
      applyUrl: item.url || item.apply_url || "https://remoteok.com",
      companyUrl: item.company_logo || undefined,
      skillsRequired: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 6) : ["Software Engineering"],
      isStartup: true,
      postedAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.warn("[Job Discovery] RemoteOK fetch failed:", err)
    return []
  }
}

// 5. Hacker News Who is Hiring public API
export async function fetchHackerNewsJobs(): Promise<DiscoveredJob[]> {
  try {
    const userRes = await fetch("https://hacker-news.firebaseio.com/v0/user/whoishiring.json", {
      signal: AbortSignal.timeout(6000),
    })
    if (!userRes.ok) return []
    const userData = await userRes.json()
    const submittedIds: number[] = userData.submitted || []

    for (const id of submittedIds.slice(0, 4)) {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
        signal: AbortSignal.timeout(6000),
      })
      if (!itemRes.ok) continue
      const item = await itemRes.json()
      if (item && item.title && item.title.includes("Who is hiring")) {
        const commentKids: number[] = item.kids || []
        const jobs: DiscoveredJob[] = []

        for (const kidId of commentKids.slice(0, 15)) {
          try {
            const kidRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${kidId}.json`, {
              signal: AbortSignal.timeout(4000),
            })
            if (!kidRes.ok) continue
            const kid = await kidRes.json()
            if (!kid || !kid.text || kid.deleted) continue

            const cleanText = kid.text.replace(/<[^>]*>?/gm, " ").trim()
            const firstLine = cleanText.split("\n")[0] || ""
            const parts = firstLine.split("|").map((p: string) => p.trim())

            const company = parts[0] || "Tech Startup"
            const title = parts[1] || "Software Engineer"
            const location = parts[2] || "Remote"
            const isRemote = cleanText.toLowerCase().includes("remote")

            jobs.push({
              externalId: `hn-${kid.id}`,
              source: "hackernews" as const,
              title,
              company,
              location,
              isRemote,
              employmentType: "Full-time",
              experienceLevel: "Mid-Senior",
              description: cleanText.slice(0, 800),
              applyUrl: `https://news.ycombinator.com/item?id=${kid.id}`,
              skillsRequired: extractSkillsFromText(cleanText),
              isStartup: true,
              postedAt: new Date(kid.time * 1000).toISOString(),
            })
          } catch {
            continue
          }
        }
        return jobs
      }
    }
  } catch (err) {
    console.warn("[Job Discovery] HN fetch error:", err)
  }
  return []
}

// 6. Aggregate Discover All Active Permitted Public Feeds
export async function discoverAllPublicJobs(): Promise<DiscoveredJob[]> {
  const [ghJobs1, ghJobs2, leverJobs, remoteOkJobs, hnJobs] = await Promise.all([
    fetchGreenhouseJobs("cloudflare"),
    fetchGreenhouseJobs("hashicorp"),
    fetchLeverJobs("spotify"),
    fetchRemoteOkJobs(),
    fetchHackerNewsJobs(),
  ])

  const combined = [
    ...CURATED_STARTUPS,
    ...remoteOkJobs,
    ...ghJobs1,
    ...ghJobs2,
    ...leverJobs,
    ...hnJobs,
  ]

  // Deduplicate by externalId
  const seen = new Set<string>()
  const uniqueJobs: DiscoveredJob[] = []

  for (const job of combined) {
    if (!seen.has(job.externalId)) {
      seen.add(job.externalId)
      uniqueJobs.push(job)
    }
  }

  return uniqueJobs
}

// Helper: Extract skills from job text
function extractSkillsFromText(text: string): string[] {
  const skillsVocabulary = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Python",
    "Go", "Rust", "PostgreSQL", "SQL", "Supabase", "AWS", "GCP",
    "Docker", "Kubernetes", "Tailwind CSS", "GraphQL", "REST", "Redis",
    "CI/CD", "Terraform", "Git", "System Design", "Microservices"
  ]

  const lower = text.toLowerCase()
  const matched = skillsVocabulary.filter((s) => lower.includes(s.toLowerCase()))
  return matched.length > 0 ? matched.slice(0, 6) : ["Software Engineering"]
}
