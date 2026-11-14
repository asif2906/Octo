// Octo Central AI Engine
// Powered by Google Gemini 2.5 Flash with complete Algorithmic Deterministic Fallback Engine

export interface GenerateTextOptions {
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxTokens?: number
}

export function getActiveAiApiKey(): string {
  return (
    process.env.OCTO_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    ""
  )
}

export function getActiveAiModel(): string {
  return process.env.OCTO_AI_MODEL?.trim() || "gemini-2.5-flash"
}

export async function generateAIText(options: GenerateTextOptions): Promise<string> {
  const { prompt, systemInstruction, temperature = 0.7 } = options
  const apiKey = getActiveAiApiKey()
  const model = getActiveAiModel()

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
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
          generationConfig: {
            temperature,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim().length > 0) {
          return text.trim()
        }
      } else {
        const errBody = await res.text()
        console.warn("[AI Provider] Gemini API returned error:", res.status, errBody)
      }
    } catch (geminiErr) {
      console.warn("[AI Provider] Gemini call failed, falling back:", geminiErr)
    }
  }

  // Fallback: Local AI (Ollama / LM Studio)
  const localUrl = process.env.LOCAL_AI_URL
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
      console.warn("[AI Provider] Local AI call failed:", localErr)
    }
  }

  return ""
}

// 1. AI Job Match & Skill Gap Analysis
export async function calculateJobMatch(
  candidateSkills: string[],
  jobTitle: string,
  jobDescription: string,
  requiredSkills: string[] = []
): Promise<{
  score: number
  matchingSkills: string[]
  missingSkills: string[]
  reasoning: string
}> {
  // Try AI first
  const prompt = `You are an expert technical recruiter and resume screener.
Evaluate how well the candidate's skills match the job opportunity.

Job Title: ${jobTitle}
Required / Mentioned Skills: ${requiredSkills.join(", ") || "Analyze from description"}
Candidate Skills: ${candidateSkills.join(", ")}

Job Description:
${jobDescription.slice(0, 3000)}

Respond strictly in valid JSON format with this exact structure:
{
  "score": <number between 20 and 98>,
  "matchingSkills": ["<skill1>", "<skill2>"],
  "missingSkills": ["<skill3>", "<skill4>"],
  "reasoning": "<2-3 concise sentences explaining the fit, strengths, and specific areas for candidate emphasis>"
}`

  const aiResponse = await generateAIText({
    prompt,
    systemInstruction: "You are an objective hiring analyst. Only output valid JSON without markdown fences.",
    temperature: 0.2,
  })

  if (aiResponse) {
    try {
      const cleaned = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (typeof parsed.score === "number" && Array.isArray(parsed.matchingSkills)) {
        return {
          score: Math.min(Math.max(Math.round(parsed.score), 20), 98),
          matchingSkills: parsed.matchingSkills.slice(0, 10),
          missingSkills: (parsed.missingSkills || []).slice(0, 10),
          reasoning: parsed.reasoning || "Strong technical and domain alignment for this vacancy.",
        }
      }
    } catch {
      // Fall through to deterministic
    }
  }

  // Algorithmic Fallback
  return calculateJobMatchDeterministic(candidateSkills, jobTitle, jobDescription, requiredSkills)
}

// Algorithmic Deterministic Engine for Job Match & Skill Gap Analysis
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

  const targetSkills =
    requiredSkills.length > 0
      ? requiredSkills.map((s) => s.toLowerCase().trim())
      : normCandidate.filter((s) => descLower.includes(s))

  const matching: string[] = []
  const missing: string[] = []

  normCandidate.forEach((skill) => {
    if (descLower.includes(skill) || targetSkills.includes(skill)) {
      if (!matching.includes(skill)) matching.push(skill)
    }
  })

  targetSkills.forEach((skill) => {
    if (!normCandidate.includes(skill)) {
      if (!missing.includes(skill)) missing.push(skill)
    }
  })

  let titleBonus = 0
  const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 3)
  const matchesTitle = titleWords.some((w) => normCandidate.some((s) => s.includes(w)))
  if (matchesTitle) titleBonus = 15

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

// 2. AI Resume Tailoring
export async function tailorResumeAI(params: {
  baseResume: any
  jobTitle: string
  company: string
  jobDescription: string
  candidateSkills: string[]
}): Promise<any> {
  const { baseResume, jobTitle, company, jobDescription, candidateSkills } = params

  const prompt = `You are an executive resume writer and ATS specialist.
Tailor the candidate's professional resume for this specific position:
Company: ${company}
Job Title: ${jobTitle}

Job Description:
${jobDescription.slice(0, 2500)}

Candidate's Current Resume Content:
${JSON.stringify(baseResume, null, 2).slice(0, 4000)}

Instructions:
1. Refine the professional summary to highlight relevance to ${jobTitle} at ${company}.
2. Reorder and sharpen work experience bullet points: start with strong action verbs, quantify impact where possible, and align truthful skills with the job requirements. DO NOT invent fake companies, fake degrees, or unearned credentials.
3. Prioritize matching technical skills at the beginning of the skills list.
4. Output the complete updated resume structure in strictly valid JSON format matching the input fields (personalInfo, summary, experience, education, skills, projects).`

  const aiText = await generateAIText({
    prompt,
    systemInstruction: "You are a professional resume strategist. Return valid JSON only.",
    temperature: 0.3,
  })

  if (aiText) {
    try {
      const cleaned = aiText.replace(/```json/gi, "").replace(/```/g, "").trim()
      const tailored = JSON.parse(cleaned)
      if (tailored && (tailored.summary || tailored.experience || tailored.skills)) {
        return {
          ...baseResume,
          ...tailored,
          personalInfo: {
            ...baseResume.personalInfo,
            ...(tailored.personalInfo || {}),
          },
        }
      }
    } catch {
      // Fall through to deterministic
    }
  }

  // Deterministic Fallback: reorder skills and adjust summary
  const tailored = JSON.parse(JSON.stringify(baseResume))
  if (jobTitle && company) {
    tailored.summary = `Results-oriented software professional with proven expertise in ${candidateSkills.slice(0, 4).join(", ") || "modern software engineering"}. Dedicated to driving technical excellence and delivering high-impact solutions for the ${jobTitle} role at ${company}.`
  }
  return tailored
}

// 3. AI Document Refinement via Chat
export async function refineDocumentWithChatAI(params: {
  documentType: "resume" | "cover_letter"
  currentContent: string
  instruction: string
  jobContext?: string
}): Promise<string> {
  const { documentType, currentContent, instruction, jobContext } = params

  const prompt = `You are an AI document refinement assistant helping a job candidate.
The user wants to refine their ${documentType === "resume" ? "resume" : "cover letter"}.

User Instruction: "${instruction}"
${jobContext ? `Job / Role Context: ${jobContext}` : ""}

Current Document Content:
${currentContent.slice(0, 5000)}

Provide the refined version incorporating the user's instructions cleanly while maintaining professional tone, ATS readability, and factual integrity. Return ONLY the refined document content.`

  const res = await generateAIText({
    prompt,
    systemInstruction: "You are an expert resume editor and copywriter. Return the revised content directly.",
    temperature: 0.4,
  })

  return res || currentContent
}

// 4. AI Cover Letter Generation
export async function generateCoverLetter(params: {
  fullName: string
  company: string
  jobTitle: string
  skills: string[]
  jobDescription?: string
  tone?: string
  experienceSummary?: string
}): Promise<string> {
  const { fullName, company, jobTitle, skills, jobDescription = "", tone = "Professional", experienceSummary } = params

  const prompt = `Write a compelling, professional cover letter tailored for:
Applicant: ${fullName}
Company: ${company}
Position: ${jobTitle}
Key Candidate Skills: ${skills.join(", ")}
Chosen Tone: ${tone}
${experienceSummary ? `Candidate Experience Highlights: ${experienceSummary}` : ""}
${jobDescription ? `Job Description: ${jobDescription.slice(0, 1800)}` : ""}

Guidelines:
- Create a clear, engaging opening stating the role and enthusiasm for ${company}.
- Highlight 2-3 key accomplishments aligned with the role.
- Convey culture fit, problem-solving ability, and immediate contribution.
- Maintain a natural, authentic voice without clichés.
- Return the formatted cover letter directly.`

  const aiText = await generateAIText({
    prompt,
    systemInstruction: `You are an executive career advisor writing a top-tier ${tone} cover letter.`,
    temperature: 0.5,
  })

  if (aiText && aiText.length > 100) {
    return aiText
  }

  return generateCoverLetterDeterministic(params)
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

// 5. AI Cold Outreach Email Generation
export async function generateColdEmailAI(params: {
  candidateName: string
  recipientName: string
  recipientRole?: string
  company: string
  candidateSkills: string[]
  purpose?: string
}): Promise<{ subject: string; body: string }> {
  const { candidateName, recipientName, recipientRole, company, candidateSkills, purpose } = params

  const prompt = `Write a high-converting, personalized cold outreach email for a job candidate reaching out to a company leader or recruiter.
Candidate: ${candidateName}
Target Recipient: ${recipientName} (${recipientRole || "Hiring Manager"})
Company: ${company}
Key Skills: ${candidateSkills.slice(0, 4).join(", ")}
Purpose: ${purpose || "Explore engineering opportunities and express interest in the team"}

Return strictly valid JSON:
{
  "subject": "<Compelling, short subject line>",
  "body": "<Polite, concise 3-paragraph email under 150 words>"
}`

  const aiText = await generateAIText({
    prompt,
    systemInstruction: "You are an expert in executive job search outreach. Output valid JSON only.",
    temperature: 0.4,
  })

  if (aiText) {
    try {
      const cleaned = aiText.replace(/```json/gi, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.subject && parsed.body) {
        return parsed
      }
    } catch {}
  }

  // Fallback
  return {
    subject: `Exploring Opportunities at ${company} — ${candidateName}`,
    body: `Hi ${recipientName},

I hope this email finds you well. I have been following ${company}'s recent work and am very impressed by what your team is building.

With a background in ${candidateSkills.slice(0, 3).join(", ") || "software engineering"}, I specialize in building reliable, scalable products that drive tangible user value.

I would love to learn more about your team's upcoming engineering goals and explore if my background might be a fit for any upcoming roles. Are you open to a brief 10-minute introductory call next week?

Best regards,
${candidateName}`,
  }
}

// 6. AI Follow-up Email Generation
export async function generateFollowUpEmailAI(params: {
  candidateName: string
  company: string
  jobTitle: string
  applicationDate?: string
  lastCommunicationDays?: number
  stage?: string
}): Promise<{ subject: string; body: string }> {
  const { candidateName, company, jobTitle, applicationDate, lastCommunicationDays = 7, stage = "applied" } = params

  const prompt = `Write a polite, professional follow-up email for a candidate waiting on a job application.
Candidate: ${candidateName}
Company: ${company}
Job Title: ${jobTitle}
Application Date: ${applicationDate || "two weeks ago"}
Days Since Last Contact: ${lastCommunicationDays}
Current Stage: ${stage}

Return strictly valid JSON:
{
  "subject": "<Clear follow-up subject>",
  "body": "<Courteous, brief follow-up under 100 words>"
}`

  const aiText = await generateAIText({
    prompt,
    systemInstruction: "You are a job search communication coach. Output valid JSON only.",
    temperature: 0.3,
  })

  if (aiText) {
    try {
      const cleaned = aiText.replace(/```json/gi, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.subject && parsed.body) {
        return parsed
      }
    } catch {}
  }

  return {
    subject: `Following up on ${jobTitle} application — ${candidateName}`,
    body: `Hi Hiring Team,

I hope you are having a productive week.

I am following up on my application for the ${jobTitle} role at ${company} submitted on ${applicationDate || "recently"}. I remain very enthusiastic about the opportunity to contribute to your team with my engineering background.

Please let me know if there are any additional materials or details I can provide to assist in your review.

Thank you for your time and consideration.

Best regards,
${candidateName}`,
  }
}

// 7. Algorithmic Fallback Engine for Interview Preparation
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
