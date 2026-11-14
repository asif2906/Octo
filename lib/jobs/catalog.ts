// Job Discovery & Startup Catalog Engine ($0 Cost Architecture)
// Powered by Hacker News "Who is Hiring" public Firebase API and Curated Open Tech Job Feeds

export interface DiscoveredJob {
  externalId: string
  source: "hackernews" | "freehire" | "ycombinator" | "manual"
  title: string
  company: string
  location: string
  isRemote: boolean
  employmentType: string
  experienceLevel: string
  description: string
  salaryRange?: string
  applyUrl?: string
  companyUrl?: string
  skillsRequired: string[]
  isStartup: boolean
  postedAt: string
}

// Curated Startups for Startup Discovery (Module D)
export const CURATED_STARTUPS: DiscoveredJob[] = [
  {
    externalId: "startup-octo-01",
    source: "ycombinator",
    title: "Senior Full Stack Engineer (Next.js & Supabase)",
    company: "Synthetix AI (YC W24)",
    location: "San Francisco, CA",
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
    location: "New York, NY",
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
    location: "Remote / London, UK",
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
    location: "Austin, TX",
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

// Fetch jobs from Hacker News Who is Hiring public API
export async function fetchHackerNewsJobs(): Promise<DiscoveredJob[]> {
  try {
    // 1. Get user 'whoishiring' submitted stories
    const userRes = await fetch("https://hacker-news.firebaseio.com/v0/user/whoishiring.json", {
      next: { revalidate: 3600 },
    })
    if (!userRes.ok) return []
    const userData = await userRes.json()
    const submittedIds: number[] = userData.submitted || []

    // 2. Find the latest "Ask HN: Who is hiring?" thread
    for (const id of submittedIds.slice(0, 5)) {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      if (!itemRes.ok) continue
      const item = await itemRes.json()
      if (item && item.title && item.title.includes("Who is hiring")) {
        const commentKids: number[] = item.kids || []
        // Fetch top 15 comments
        const jobs: DiscoveredJob[] = []
        for (const kidId of commentKids.slice(0, 15)) {
          const kidRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${kidId}.json`)
          if (!kidRes.ok) continue
          const kid = await kidRes.json()
          if (!kid || !kid.text || kid.deleted) continue

          // Parse raw HN comment text (usually "Company | Role | Location | Remote/ONSITE")
          const cleanText = kid.text.replace(/<[^>]*>?/gm, " ").trim()
          const firstLine = cleanText.split("\n")[0] || ""
          const parts = firstLine.split("|").map((p: string) => p.trim())

          const company = parts[0] || "Tech Startup"
          const title = parts[1] || "Software Engineer"
          const location = parts[2] || "Remote"
          const isRemote = cleanText.toLowerCase().includes("remote")

          // Extract basic skills
          const skillsMatch = ["react", "typescript", "python", "node", "go", "sql", "aws", "docker"].filter((s) =>
            cleanText.toLowerCase().includes(s)
          )

          jobs.push({
            externalId: `hn-${kid.id}`,
            source: "hackernews",
            title,
            company,
            location,
            isRemote,
            employmentType: "Full-time",
            experienceLevel: "Mid-Senior",
            description: cleanText.slice(0, 800),
            applyUrl: `https://news.ycombinator.com/item?id=${kid.id}`,
            skillsRequired: skillsMatch.length > 0 ? skillsMatch : ["Software Engineering"],
            isStartup: true,
            postedAt: new Date(kid.time * 1000).toISOString(),
          })
        }
        return jobs
      }
    }
  } catch (err) {
    console.warn("[Job Discovery] HN fetch error:", err)
  }
  return []
}
