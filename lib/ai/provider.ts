// Zero-Cost Multi-Engine AI Provider
// $0 Budget Directive:
// 1. Google Gemini free-tier (gemini-2.5-flash / gemini-1.5-flash) if GEMINI_API_KEY is present
// 2. Local OpenAI-compatible endpoint (Ollama / LM Studio) if LOCAL_AI_URL is present
// 3. Algorithmic Deterministic Engine: operates completely offline with 0 API keys

export interface GenerateTextOptions {
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxTokens?: number
}

export async function generateAIText(options: GenerateTextOptions): Promise<string> {
  const { prompt, systemInstruction } = options

  // 1. Try Gemini Free Tier
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (geminiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...(systemInstruction
              ? [{ role: "user", parts: [{ text: `System Instructions: ${systemInstruction}` }] }]
              : []),
            { role: "user", parts: [{ text: prompt }] },
          ],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim().length > 0) {
          return text.trim()
        }
      }
    } catch (geminiErr) {
      console.warn("[AI Provider] Gemini free-tier call failed, falling back:", geminiErr)
    }
  }

  // 2. Try Local AI (Ollama / LM Studio)
  const localUrl = process.env.LOCAL_AI_URL // e.g. http://localhost:11434/v1
  if (localUrl) {
    try {
      const res = await fetch(`${localUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.LOCAL_AI_MODEL || "llama3",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text && text.trim().length > 0) {
          return text.trim()
        }
      }
    } catch (localErr) {
      console.warn("[AI Provider] Local AI call failed, falling back:", localErr)
    }
  }

  // 3. Fallback: Return empty to signal algorithmic fallback handling
  return ""
}

// Algorithmic Fallback Engine for Job Match & Skill Gap Analysis
export function calculateJobMatchDeterministic(
  candidateSkills: string[],
  jobTitle: string,
  jobDescription: string,
  requiredSkills: string[] = []
): {
  score: number
  matchingSkills: string[]
  missingSkills: string[]
  reasoning: string
} {
  const normCandidate = candidateSkills.map((s) => s.toLowerCase().trim()).filter(Boolean)
  const descLower = jobDescription.toLowerCase()
  const titleLower = jobTitle.toLowerCase()

  // Extract skills from requiredSkills or search candidate skills in description
  const targetSkills = requiredSkills.length > 0
    ? requiredSkills.map((s) => s.toLowerCase().trim())
    : normCandidate.filter((s) => descLower.includes(s))

  const matching: string[] = []
  const missing: string[] = []

  // Check which candidate skills match the job description
  normCandidate.forEach((skill) => {
    if (descLower.includes(skill) || targetSkills.includes(skill)) {
      if (!matching.includes(skill)) matching.push(skill)
    }
  })

  // Check which target skills the candidate is missing
  targetSkills.forEach((skill) => {
    if (!normCandidate.includes(skill)) {
      if (!missing.includes(skill)) missing.push(skill)
    }
  })

  // Title alignment score
  let titleBonus = 0
  const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 3)
  const matchesTitle = titleWords.some((w) => normCandidate.some((s) => s.includes(w)))
  if (matchesTitle) titleBonus = 15

  // Calculate percentage
  const totalRelevant = Math.max(matching.length + missing.length, 1)
  const baseSkillScore = Math.round((matching.length / totalRelevant) * 75)
  const finalScore = Math.min(Math.max(baseSkillScore + titleBonus + 10, 25), 98)

  const reasoning =
    matching.length > 0
      ? `Strong alignment on core competencies (${matching.slice(0, 4).join(", ")}). Recommend highlighting hands-on project accomplishments matching ${jobTitle}.`
      : `Moderate transferable background. Consider developing experience in ${missing.slice(0, 3).join(", ")} to maximize interview conversion.`

  return {
    score: finalScore,
    matchingSkills: matching.slice(0, 10),
    missingSkills: missing.slice(0, 10),
    reasoning,
  }
}

// Algorithmic Fallback Engine for Cover Letter Generation
export function generateCoverLetterDeterministic(params: {
  fullName: string
  company: string
  jobTitle: string
  skills: string[]
  tone?: string
  experienceSummary?: string
}): string {
  const { fullName, company, jobTitle, skills, tone = "Professional", experienceSummary } = params
  const topSkills = skills.slice(0, 4).join(", ") || "problem-solving and software engineering"

  if (tone.toLowerCase() === "enthusiastic") {
    return `Dear Hiring Team at ${company},

I am thrilled to submit my application for the ${jobTitle} position at ${company}. Having followed your recent growth and engineering trajectory, I am deeply inspired by the high standard of excellence your team demonstrates.

${experienceSummary ? experienceSummary : `Throughout my career, I have dedicated myself to mastering ${topSkills}, delivering high-impact solutions with measurable outcomes.`}

What excites me most about joining ${company} is the opportunity to apply these skills in a high-velocity environment where technical rigor and user empathy drive business results. I look forward to contributing immediately to your milestones.

Thank you for your time and consideration.

Warm regards,
${fullName}`
  }

  if (tone.toLowerCase() === "executive") {
    return `Dear Leadership Team at ${company},

Please accept this letter as an expression of my serious interest in the ${jobTitle} role at ${company}. My background has been defined by architecting scalable systems, aligning technical execution with strategic company objectives, and driving delivery across ${topSkills}.

${experienceSummary ? experienceSummary : `In my previous work, I have focused on optimizing engineering workflows, accelerating release cadence, and cultivating a culture of technical excellence.`}

I am confident that my operational discipline and background make me an asset to ${company}'s forward-looking initiatives. I welcome the opportunity to discuss how my expertise can serve your organizational goals.

Sincerely,
${fullName}`
  }

  // Default Professional Tone
  return `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} opportunity at ${company}. With proven expertise across ${topSkills}, I am eager to bring my capabilities to your team.

${experienceSummary ? experienceSummary : `My background includes building robust end-to-end solutions, collaborating across cross-functional teams, and consistently meeting demanding technical deliverables.`}

I am particularly drawn to ${company} because of your clear commitment to delivering high-quality products. I am excited about the chance to leverage my experience to help achieve your upcoming engineering milestones.

Thank you for your consideration. I look forward to the possibility of discussing this role with you.

Sincerely,
${fullName}`
}

// Algorithmic Fallback Engine for Interview Preparation
export function generateInterviewPrepDeterministic(jobTitle: string, skills: string[]): Array<{
  question: string
  suggestedAnswer: string
}> {
  const primarySkill = skills[0] || "core technologies"
  const secondarySkill = skills[1] || "system architecture"

  return [
    {
      question: `Can you walk me through your experience as a ${jobTitle} and a significant project you led?`,
      suggestedAnswer: `Structure your response using the STAR method (Situation, Task, Action, Result). Highlight your specific contribution, the technical trade-offs you made, and quantify the business impact (e.g., % latency reduction, throughput increase, or user adoption).`,
    },
    {
      question: `How do you approach working with ${primarySkill} in production environments, and what common pitfalls do you guard against?`,
      suggestedAnswer: `Discuss real-world constraints such as state management, concurrency, error handling, and testing strategies. Demonstrate familiarity with edge cases and explain how you write defensive, maintainable code.`,
    },
    {
      question: `Describe a situation where you had a technical disagreement with a team member. How was it resolved?`,
      suggestedAnswer: `Emphasize constructive communication, backing design choices with data and benchmarks, and prioritizing the overall user and team outcome rather than personal preferences.`,
    },
    {
      question: `How do you ensure reliability, security, and scalability when designing ${secondarySkill}?`,
      suggestedAnswer: `Walk through your checklist: least-privilege security access, proper indexing and data partitioning, rate limiting, observability with logs and metrics, and graceful degradation during partial outages.`,
    },
  ]
}
