# OCTO.TECH — DOSSIER FEATURE INTEGRATION MASTER IMPLEMENTATION

## ROLE

Act as a senior full-stack engineer, SaaS architect, AI engineer and security engineer.

You are working on my existing SaaS application, **Octo.tech**.

Your task is to integrate the complete relevant feature set of the open-source project Dossier into Octo.tech, while preserving and improving the existing application.

Dossier repository:
https://github.com/AienTech/dossier

Dossier documentation:
https://github.com/AienTech/dossier/wiki

Existing application:
https://octo-pi-nine.vercel.app/

This is an existing application, NOT a new project.

---

# 1. NON-NEGOTIABLE PROJECT RULES

### Budget: $0

I have absolutely no budget to invest in this project.

You MUST follow these restrictions:

- Use only free APIs and genuinely free service tiers.
- Do not introduce paid APIs.
- Do not require OpenAI paid API credits.
- Do not require Anthropic paid API credits.
- Do not introduce paid job-search APIs.
- Do not introduce paid email services.
- Do not introduce paid automation platforms.
- Do not introduce paid database services.
- Do not introduce paid hosting infrastructure.
- Do not introduce paid PDF-generation services.
- Do not introduce paid third-party integrations.

Before integrating any external service, verify whether it has a usable free tier or free alternative.

Never assume that an API is free simply because registration is free.

Do not introduce dependencies that require a credit card, paid subscription or mandatory payment to operate.

If a free tier has strict quotas, implement rate limiting, caching and usage management.

If a feature cannot be implemented reliably within a zero-dollar budget, implement a functional alternative and clearly document the limitation.

Do not pretend a paid service is free.

### Existing infrastructure must be preserved

My existing application has already completed four development phases.

The existing technology and infrastructure include:

- Next.js
- TypeScript
- Supabase
- Supabase Authentication
- Existing PostgreSQL database
- Vercel deployment
- Dodo Payments integration
- Existing user accounts
- Existing subscription system
- Existing dashboard and application functionality

IMPORTANT:

Inspect the actual repository before assuming any additional technologies, components or database structures.

Do not replace working infrastructure.

Do not rebuild the application.

Do not create another Supabase project.

Do not replace the existing authentication system.

Do not change the production domain.

Do not remove existing features.

Do not modify existing payment configurations unless absolutely necessary.

---

# 2. FIRST TASK: COMPLETE CODEBASE AUDIT

Before writing or modifying code, inspect the entire Octo.tech repository.

Identify:

1. Existing frontend architecture.
2. Existing backend architecture.
3. Existing authentication implementation.
4. Existing database schema.
5. Existing database relationships.
6. Existing subscription and payment implementation.
7. Existing Basic and Pro entitlements.
8. Existing dashboard components.
9. Existing job application functionality.
10. Existing resume functionality.
11. Existing email and automation functionality.
12. Existing API integrations.
13. Existing scheduled jobs or background processing.
14. Existing UI components and design system.
15. Existing environment variables.
16. Existing deployment configuration.

Produce a concise implementation audit.

Identify which Dossier features already exist in Octo.tech, which partially exist and which are missing.

Do not create duplicate functionality.

Do not overwrite existing functionality simply because Dossier implements it differently.

Create a feature-parity checklist and use it throughout implementation.

---

# 3. DOSSIER FEATURE IMPLEMENTATION

Use the Dossier repository and its current documentation as the functional reference.

Implement the following features natively inside Octo.tech.

## MODULE A — COMPLETE CAREER PROFILE

Create a comprehensive user career profile.

Each authenticated user must have an independent profile.

Include:

- Personal information.
- Professional headline.
- Professional summary.
- Contact information.
- Location.
- Skills.
- Languages and proficiency.
- Work experience.
- Volunteering experience.
- Projects.
- Education.
- Certifications.
- Publications.
- Professional references.
- Custom resume sections.

Requirements:

- Allow users to add, edit and delete individual entries.
- Allow users to reorder sections.
- Allow users to reorder skills.
- Support multiple projects and employment records.
- Allow users to add certification verification links.
- Allow users to store project links.
- Implement a profile completeness or strength indicator.
- Allow users to import an existing resume in PDF, DOCX or Markdown where technically supported.
- Extract available information into structured profile fields.
- Let users review and correct extracted information before saving.

IMPORTANT:

AI must never invent professional experience, qualifications, certifications, employment dates or achievements.

If information is missing, leave it missing.

All profile data must be isolated between users.

## MODULE B — BASE RESUME BUILDER

Implement a complete resume builder.

Requirements:

- Generate a resume from the user's career profile.
- Provide 12 professionally designed resume themes inspired by Dossier's theme system.
- Build a custom resume theme editor.
- Support different layouts and typography.
- Allow users to customize spacing, section ordering and formatting.
- Support live resume previews.
- Allow users to duplicate and customize themes.
- Allow users to save multiple resume versions.
- Support PDF downloads.
- Support printing.
- Ensure generated PDFs have proper spacing, typography and pagination.
- Support one-page and two-page resumes.
- Preserve links in generated PDFs where possible.

The resume builder must work without a paid external PDF service.

Investigate free server-side PDF generation compatible with the existing Vercel environment.

Avoid introducing unnecessarily large or expensive infrastructure.

## MODULE C — JOB DISCOVERY

Implement a dedicated job discovery module.

Users should be able to:

- Search jobs by role.
- Search by skills.
- Search by company.
- Search by location.
- Search for remote opportunities.
- Filter by employment type.
- Filter by experience level.
- View job descriptions.
- View company information.
- Save interesting opportunities.
- Dismiss irrelevant opportunities.
- Open original job listings.
- Start an application directly from a job listing.

Investigate the following sources:

1. FreeHire — prioritize this because its documented open catalogue does not require an API key.
2. Company career pages.
3. YC startup job listings.
4. Hacker News monthly Who is Hiring discussions.
5. Other genuinely free and permitted job sources.

JSearch and Adzuna must remain optional if their usable access requires paid plans or limited credits.

Build a modular job-source architecture.

Each source should have its own adapter.

Normalize all results into one internal job-posting structure.

Implement:

- Duplicate detection.
- Result caching.
- Search rate limiting.
- Source failure handling.
- Job expiration handling.
- Pagination.
- Search history.

Respect robots.txt, source terms and applicable access restrictions.

Do not scrape websites aggressively or bypass access controls.

If a source is unavailable, the application must continue working with other sources.

Provide manual job-description input as a permanent fallback.

## MODULE D — STARTUP DISCOVERY

Create a startup discovery section.

Use publicly available information from:

- Y Combinator hiring resources.
- Hacker News Who is Hiring discussions.
- Public startup career pages.

Display:

- Company name.
- Company website.
- Job title.
- Job description.
- Location.
- Remote eligibility.
- Application URL.
- Relevant skills.
- Match score.

Allow users to:

- Save startups.
- Save individual opportunities.
- Dismiss listings.
- Start an application.

Only display verified information.

Do not fabricate contact information or claim that a startup is hiring without evidence.

## MODULE E — AI JOB MATCHING

Implement an AI-assisted job compatibility system.

Every job should be comparable against the user's career profile.

Generate a score from 0–100.

Evaluate:

- Required skills.
- Preferred skills.
- Work experience.
- Relevant projects.
- Education requirements.
- Certifications.
- Seniority.
- Location compatibility.
- Employment type.

Display:

- Overall compatibility score.
- Matching skills.
- Missing skills.
- Relevant experience.
- Qualification gaps.
- Reasons for the score.
- Areas requiring improvement.

Never present a compatibility score as a guarantee of selection.

Use deterministic matching as a fallback when no AI provider is configured.

Cache scores so that the same job and unchanged profile do not repeatedly consume AI usage.

## MODULE F — AI RESUME TAILORING

This is one of the most important modules.

Allow users to paste a job description or select a job from the discovery module.

The system should:

1. Extract job requirements.
2. Analyse the user's career profile.
3. Identify matching qualifications.
4. Identify missing qualifications.
5. Rewrite relevant resume sections.
6. Reorder relevant skills.
7. Tailor project descriptions.
8. Improve experience bullet points.
9. Generate a professional summary.
10. Produce a job-specific resume.

The result must remain truthful.

STRICT RULE:

Never create fake work experience, skills, certifications, numbers, achievements or qualifications.

Only use facts supplied by the user.

Allow users to:

- Edit generated content.
- Regenerate individual sections.
- Accept or reject AI suggestions.
- Compare the original and tailored resumes.
- Save different tailored versions.
- Download the final resume as PDF.

## MODULE G — AI COVER LETTER GENERATOR

Generate job-specific cover letters.

Use:

- User's career profile.
- Job description.
- Company information.
- Relevant projects.
- Relevant experience.
- Selected writing tone.
- Selected language.

Allow:

- Formal tone.
- Professional tone.
- Concise tone.
- Personalized tone.
- Custom instructions.

Allow editing of every section.

Do not invent personal connections to employers or claim experience the user does not possess.

Support PDF export and copying.

## MODULE H — AI DOCUMENT EDITOR AND VERSION HISTORY

Create an AI-assisted document refinement interface.

Users should be able to communicate with an AI assistant to refine:

- Resume summaries.
- Experience descriptions.
- Project descriptions.
- Skills sections.
- Cover letters.
- Individual document sections.

Example instructions:

- Make this more concise.
- Improve the wording.
- Emphasize leadership.
- Make it more technical.
- Adapt this to the job description.
- Improve ATS readability.

Requirements:

- Preserve the original document.
- Store generated versions.
- Allow undo.
- Allow restoration of previous versions.
- Allow comparison between versions.
- Allow individual section regeneration.
- Allow users to accept or reject changes.

Never overwrite a user's document without their action or confirmation.

## MODULE I — JOB APPLICATION MANAGEMENT

Create a comprehensive application tracker.

Provide:

1. Kanban board.
2. Table view.
3. Application detail view.
4. Search and filtering.
5. Application notes.
6. Activity history.
7. Interview dates.
8. Resume and cover-letter attachments.
9. Company details.
10. Application source.

Support application stages such as:

- Draft.
- Ready to apply.
- Applied.
- Assessment.
- Interview.
- Offer.
- Rejected.
- Withdrawn.

Allow drag-and-drop between stages.

Persist changes in Supabase.

Implement an application activity timeline.

Allow users to record private notes for every application.

## MODULE J — JOB SEARCH AGENT

Implement a background job-search assistant.

This feature should:

- Allow users to save up to three named job searches.
- Allow searches to be enabled or disabled.
- Run enabled searches on a scheduled basis.
- Find new job postings.
- Skip previously seen or dismissed jobs.
- Score new postings against the user's profile.
- Rank the most relevant opportunities.
- Show why each opportunity matches.
- Identify potential qualification gaps.
- Optionally prepare tailored resume and cover-letter drafts.

IMPORTANT:

The agent must NEVER automatically send emails or submit applications.

All generated applications must remain drafts until the user reviews and approves them.

Implement:

- Per-user scheduling.
- Duplicate prevention.
- Usage limits.
- Rate limiting.
- Job-search execution logs.
- Retry handling.
- Failure reporting.
- User-controlled pause and resume.

Respect the existing Basic and Pro subscription limits.

Do not introduce a paid automation service.

Use existing infrastructure where possible.

If Vercel execution limits make a particular scheduling approach unsuitable, investigate free alternatives compatible with the existing project.

Do not assume background jobs can run indefinitely inside a serverless function.

## MODULE K — EMAIL ASSISTANT

Build an email drafting and application communication module.

Allow users to generate:

- Job application emails.
- Recruiter outreach emails.
- Follow-up emails.
- Interview confirmation emails.
- Thank-you emails.
- Professional replies.

Use the relevant application, company and career profile as context.

Support editing and AI refinement.

Optional Gmail integration:

- Allow users to connect their own Gmail account.
- Use Google OAuth.
- Read relevant employer replies with user authorization.
- Link messages to applications.
- Summarize employer messages.
- Draft suggested responses.
- Allow users to review before sending.

Do not send messages without explicit user approval.

Do not require paid email APIs.

Use Gmail's official APIs and applicable quotas.

If Gmail integration cannot be configured, provide a functional copy/open-in-mail fallback.

## MODULE L — GOOGLE CALENDAR AND INTERVIEW MANAGEMENT

Optional Google Calendar integration.

Allow users to:

- Connect their own Google account.
- View upcoming interviews.
- View interview dates on a calendar.
- See relevant application information.
- Prepare interview schedules.
- Generate suggested interview responses.
- Synchronize authorized calendar events.

Do not create or modify calendar events without appropriate user authorization.

Provide manual interview scheduling when Google integration is unavailable.

Do not require paid calendar services.

## MODULE M — ANALYTICS DASHBOARD

Expand the existing dashboard.

Include:

- Total applications.
- Applications submitted.
- Interviews.
- Offers.
- Rejections.
- Response rate.
- Interview conversion rate.
- Application funnel.
- Weekly application activity.
- Monthly application activity.
- Upcoming interviews.
- Recently updated applications.
- Recommended next actions.

Support time filters:

- Last 30 days.
- Last 90 days.
- All time.

Provide charts and useful insights.

Calculate analytics using actual database records.

Do not generate fake statistics.

Respect subscription entitlements for advanced analytics.

## MODULE N — MULTILINGUAL DOCUMENT GENERATION

Support multilingual resumes and cover letters.

Implement language selection.

Prioritize commonly used professional languages and ensure the system can handle other languages where the selected AI provider supports them.

Requirements:

- Correct language-specific headings.
- Appropriate date formatting.
- Consistent formatting.
- Unicode support.
- Correct PDF rendering.
- Preserve the original profile information.

Do not translate technical names, company names or qualifications incorrectly.

## MODULE O — DATA MANAGEMENT AND PRIVACY

Implement:

- Complete user data export.
- Data import.
- Resume export.
- Application export.
- User-controlled deletion.
- Backup and restore strategy.
- AI usage history.
- Integration management.
- Privacy disclosures.

Clearly identify what data is sent to external AI providers.

Do not send user data to third-party services without appropriate disclosure and authorization.

Implement secure storage for OAuth tokens and API credentials.

Never expose secret keys to the frontend.

---

# 4. ZERO-COST AI ARCHITECTURE

AI is essential to this product, but we cannot depend on paid API credits.

Build a provider-independent AI architecture.

Investigate and evaluate:

- Google Gemini API free tier, if currently available and eligible.
- Other genuinely free hosted AI API tiers.
- OpenAI-compatible free providers, if available.
- Ollama for local inference.
- LM Studio for local inference.

Do not hardcode one AI provider throughout the application.

Create a centralized AI provider abstraction.

Requirements:

- Provider selection.
- Model selection.
- Secure API key configuration.
- Provider health checks.
- Token usage tracking.
- Request limits.
- Error handling.
- Retry handling.
- Response validation.
- Fallback to other configured providers.
- Deterministic non-AI fallback for basic matching.

Do not send requests to a paid provider when free providers are unavailable.

If all configured providers are unavailable, inform the user and preserve the ability to use non-AI features.

Do not falsely describe a free quota as unlimited.

For local models, explain that Ollama or LM Studio requires the user's own machine or a separately available machine. Do not assume they can run continuously on Vercel.

---

# 5. PRESERVE OCTO.TECH'S EXISTING FEATURES

Dossier integration must not remove Octo.tech's existing functionality.

Preserve:

- Basic and Pro subscription plans.
- Existing weekly and monthly billing.
- Existing Dodo Payments integration.
- Existing authentication.
- Existing user profiles and data.
- Existing auto-application functionality.
- Existing cold-email functionality.
- Existing recipient database.
- Existing resume functionality.
- Existing dashboard.
- Existing feature entitlements.

Existing subscription pricing:

Basic:
- $5 weekly.
- $12 monthly.

Pro:
- $11 weekly.
- $24 monthly.

Prices are tax-inclusive.

Existing entitlements:

Basic:
- 10 successful auto-applications per day.
- 15 successful cold emails per day.
- User's own recipient list.
- Basic follow-ups.
- Full application tracker.
- Standard resume and AI tailoring access under configurable fair-use limits.

Pro:
- 20 successful auto-applications per day.
- 20 successful cold emails per day.
- User's own recipient list plus founder/CEO database.
- Advanced follow-ups.
- Full application tracker with advanced analytics.
- Higher configurable resume and AI tailoring fair-use limits.

Do not invent new numerical fair-use limits.

Integrate new features into the existing entitlement system.

Where Dossier features overlap with existing Octo.tech features, extend the existing implementation rather than creating competing systems.

IMPORTANT:

Dossier's job agent only prepares drafts and does not automatically apply or send.

Preserve Octo.tech's existing auto-application functionality separately, with its existing permissions, limits and safeguards.

Do not accidentally convert Dossier's draft-only agent into an unrestricted auto-apply system.

---

# 6. DATABASE AND MULTI-TENANCY

Before making schema changes, inspect the existing Supabase schema.

Design new tables only when necessary.

Potential entities include:

- career_profiles
- profile_experience
- profile_education
- profile_skills
- profile_projects
- profile_certifications
- profile_publications
- resume_themes
- resumes
- resume_versions
- cover_letters
- cover_letter_versions
- job_postings
- saved_jobs
- dismissed_jobs
- job_searches
- job_search_runs
- job_match_scores
- applications
- application_activities
- application_notes
- interviews
- email_drafts
- connected_integrations
- ai_usage_logs

These are proposed logical entities, not instructions to blindly create every table.

Reuse existing tables and relationships where possible.

Requirements:

- Every user-owned record must have correct ownership.
- Implement Supabase Row Level Security.
- Prevent cross-user access.
- Validate ownership server-side.
- Protect sensitive integration credentials.
- Add appropriate indexes.
- Avoid duplicate records.
- Use transactions for related database changes.
- Create reversible migrations where practical.

Do not expose the Supabase service-role key to the browser.

---

# 7. UI/UX REQUIREMENTS

The application must feel like one cohesive premium SaaS product.

Do not simply copy Dossier's interface.

Use its functionality as inspiration.

Maintain Octo.tech's existing brand identity and design system.

Create a modern, polished, responsive interface.

Suggested navigation:

- Overview
- Find Jobs
- Startups
- Job Agent
- My Profile
- Resume Builder
- Applications
- Email Assistant
- Calendar
- Analytics
- Settings

Only add navigation entries for features that are actually implemented.

Requirements:

- Responsive desktop and mobile layouts.
- Consistent spacing and typography.
- Clear navigation.
- Loading states.
- Empty states.
- Error states.
- Success feedback.
- Accessible components.
- Proper form validation.
- Smooth interactions.
- Consistent visual language.

Do not build non-functional buttons or placeholder dashboards.

Every implemented control must have a working action.

---

# 8. IMPLEMENTATION STRATEGY

Do not attempt a risky, massive rewrite.

Implement in controlled phases.

### Phase 1 — Foundation

- Repository audit.
- Dossier feature-parity checklist.
- Database architecture.
- Multi-tenant data isolation.
- AI provider abstraction.
- Free-tier feasibility analysis.

### Phase 2 — Career profile and resume

- Career profile.
- Resume import.
- Base resume builder.
- Twelve themes.
- Theme editor.
- PDF export.

### Phase 3 — Job discovery

- Job-source adapters.
- FreeHire.
- Manual job posting.
- Startup discovery.
- Saved and dismissed jobs.
- Job matching and scoring.

### Phase 4 — AI documents

- Tailored resumes.
- Cover letters.
- AI refinement.
- Version history.
- Document export.

### Phase 5 — Application management

- Kanban.
- Table view.
- Application timeline.
- Notes.
- Analytics.
- Interview tracking.

### Phase 6 — Automation and integrations

- Job-search agent.
- Scheduled searches.
- Draft preparation.
- Email assistant.
- Optional Gmail integration.
- Optional Google Calendar integration.

### Phase 7 — Advanced functionality

- Multilingual support.
- Data export/import.
- Backups.
- Privacy controls.
- Optional MCP connector.

Do not start a later phase while the current phase has unresolved critical bugs.

---

# 9. TESTING AND SECURITY

Test every new feature.

At minimum:

- Authentication.
- User isolation.
- Database access.
- RLS policies.
- Resume creation.
- Resume editing.
- PDF generation.
- Job search.
- Duplicate detection.
- Job scoring.
- AI tailoring.
- Cover letter generation.
- Version restoration.
- Application tracking.
- Analytics.
- Background scheduling.
- Email drafting.
- Integration authorization.
- Subscription restrictions.
- Basic and Pro entitlements.
- Existing payment functionality.

Run:

npx tsc --noEmit

npm run build

Run the existing project's tests and add tests for the new modules.

Do not claim a feature works without testing it.

Do not deploy directly to production.

Use a Vercel Preview deployment.

Never modify production database records during development tests.

---

# 10. IMPLEMENTATION REPORTING

After each phase, provide:

1. Features completed.
2. Features still pending.
3. Existing files modified.
4. New files created.
5. Database migrations.
6. New environment variables.
7. External integrations.
8. Free-tier limitations.
9. Security considerations.
10. Test results.
11. Build results.
12. Deployment status.
13. Any owner actions required.

Maintain a persistent implementation checklist.

Never mark a feature completed merely because its UI exists.

A feature is complete only when its frontend, backend, database operations, authorization, error handling and testing are functional.

---

# 11. COPYRIGHT AND LICENSE COMPLIANCE

Dossier is licensed under AGPL-3.0.

Before copying or adapting any of its source code:

- Review the license.
- Preserve required copyright and license notices.
- Determine whether the resulting application is a derivative work.
- Comply with applicable source-code disclosure requirements, including network-use requirements where applicable.

Do not copy source code while ignoring the license.

You may independently implement equivalent functionality using Octo.tech's existing architecture.

---

# FINAL INSTRUCTION

My objective is to make Octo.tech a comprehensive AI-powered job-search SaaS that incorporates the relevant functionality of Dossier while retaining Octo.tech's existing features and subscription system.

The total additional project budget is $0.

Prioritize free and open-source solutions.

Do not introduce paid dependencies.

Do not rebuild working infrastructure.

Do not sacrifice security for convenience.

Do not invent features or claim implementation success without verification.

**Start with the complete repository audit and feature-parity checklist. Then implement Phase 1 and proceed sequentially.**

Before making destructive changes or changing production configuration, obtain my approval.

Work incrementally, test thoroughly and keep the existing application operational.   

and dont include dossier name in our project as we are inspired of this open source tool but it would not look good on our site if its written that we have copied.