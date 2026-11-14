# OCTO.TECH — EXACT DOSSIER FUNCTIONALITY INTEGRATION
## Product parity implementation specification

**Primary reference:** https://github.com/AienTech/dossier

**Reference documentation:**
- https://github.com/AienTech/dossier/wiki
- https://github.com/AienTech/dossier/wiki/Choosing-an-AI-provider
- https://github.com/AienTech/dossier/wiki/Choosing-a-job-source
- https://github.com/AienTech/dossier/wiki/Connecting-Gmail-and-Calendar

**Existing application:** https://octo-pi-nine.vercel.app/

---

# 0. YOUR ROLE AND THE ACTUAL OBJECTIVE

Act as a senior full-stack engineer, SaaS architect, AI integration engineer and product engineer.

You are working on Octo.tech, an existing SaaS application that has already completed four development phases.

I want Octo.tech to have the same core functionality and user workflows as Dossier.

I do NOT want another generic job-search dashboard.

I do NOT want a collection of unrelated AI tools.

I want the actual Dossier experience integrated into Octo.tech:

1. Dashboard.
2. Career profile.
3. Base resume.
4. Resume themes and theme builder.
5. Discover jobs.
6. Discover startups.
7. AI job matching.
8. Create a new application from a job posting.
9. AI-tailored resume.
10. AI-generated cover letter.
11. AI document refinement through chat.
12. Application-specific emails.
13. Gmail integration.
14. Google Calendar integration.
15. Job-search automation agent.
16. Application tracking board and table.
17. Application history and notes.

The objective is functional parity with Dossier's workflows, adapted to Octo.tech's architecture.

Use Dossier as the source of truth.

Do not invent alternative workflows when Dossier already has a documented way of doing something.

Do not stop after creating frontend pages. Every feature must have its actual backend functionality.

---

# 1. CRITICAL PROJECT CONSTRAINTS

## A. Zero-dollar budget

The additional development and operating budget is $0.

Strict requirements:

- No paid API subscriptions.
- No OpenAI paid API dependency.
- No Anthropic paid API dependency.
- No paid job discovery API dependency.
- No paid automation platform.
- No paid email provider.
- No paid PDF service.
- No paid background job platform.
- No new paid database.
- No paid hosting infrastructure.

Only use:
- Existing Octo.tech infrastructure.
- Free API tiers that permit the intended use.
- Open-source libraries.
- Public sources whose terms permit the intended use.
- Existing services already available to Octo.tech.

Verify actual terms, limits and eligibility before integrating external services.

A free developer API key does not automatically grant permission to use the service commercially or for a multi-user SaaS.

Never silently introduce a paid dependency.

Never upgrade an account or enable billing.

If an API quota is exhausted, stop making requests until the quota resets.

Do not switch automatically to a paid model.

## B. AI API key management — absolutely important

AI must work through a centrally managed backend API key.

The customer must NEVER be asked to provide:

- An OpenAI API key.
- A Gemini API key.
- An Anthropic API key.
- An Ollama API key.
- Any other AI provider credential.

There must be no customer-facing AI API configuration screen.

The Octo.tech owner will configure the AI provider in backend environment secrets.

Use a centralized configuration such as:

AI_PROVIDER=
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=

Use actual variable names consistently throughout the implementation.

These variables are examples of the desired configuration, not permission to expose them publicly.

Requirements:

- The API key must exist only on the server.
- Store it through secure Vercel environment configuration.
- Never use NEXT_PUBLIC_ for AI credentials.
- Never commit real credentials.
- Do not print credentials in logs.
- Do not return keys in API responses.
- Do not store the key in user profiles.
- Do not ask individual users to configure their own model.
- All users should call the same centrally managed AI service, subject to individual usage limits.

Implement a central AI service that all AI features use.

Do not independently initialize an AI client inside every component.

Use server-side provider adapters, structured JSON outputs where appropriate, output validation, request timeouts and safe retry handling.

The AI system must support:

- Job parsing.
- Job matching.
- Resume tailoring.
- Cover letter creation.
- Document editing.
- Application email creation.
- Employer email analysis.
- Job-agent scoring and draft preparation.

If no valid free AI provider is configured, display an honest AI-unavailable state. Do not fabricate AI responses.

Do not use a provider whose free-tier terms make our intended processing of customer resumes or commercial use impermissible.

Where a provider uses submitted data to improve its models, assess privacy implications, disclose this clearly and obtain appropriate user consent before sending identifiable career information.

## C. Preserve existing Octo.tech infrastructure

Do not rebuild the application.

Preserve:

- Existing Next.js application.
- Existing Supabase database.
- Supabase authentication.
- Existing user accounts.
- Existing subscription system.
- Existing Dodo Payments implementation.
- Existing Vercel deployment.
- Existing domain.
- Existing application features.
- Existing Basic and Pro entitlements.

Do not import Dossier's single-user authentication system.

Do not replace Supabase with a separate PostgreSQL deployment.

Do not introduce Prisma just because Dossier uses Prisma, unless there is a demonstrated compatibility requirement and it is approved.

Use the actual existing Octo.tech architecture.

---

# 2. FIRST: STUDY DOSSIER PROPERLY

Before implementation, inspect the current Dossier GitHub repository.

Repository:
https://github.com/AienTech/dossier

Inspect:

- README.
- Wiki documentation.
- Screenshots.
- Source directory.
- Components.
- Application routes.
- Database schema.
- Job-source adapters.
- AI provider abstraction.
- Resume generation.
- PDF generation.
- Job agent.
- Email functionality.
- Gmail integration.
- Google Calendar integration.
- Application tracking logic.
- Tests.

Do not rely only on the repository description.

Understand how a user actually moves through Dossier.

Create a mapping document that connects each Dossier screen and workflow to the corresponding Octo.tech screen and backend functionality.

Compare the existing Octo implementation against this mapping.

Classify every feature as:

- Already working.
- Partially working.
- Missing.
- Broken.

Only modify what is necessary.

---

# 3. PRODUCT MODULE 1 — DASHBOARD

Build the Dossier-style dashboard inside Octo.tech.

The dashboard is the central page after login.

It must bring together the user's job-search progress, application funnel, next actions and upcoming interviews.

## Dashboard components

### A. Application funnel

Display actual application statistics.

Include:

- Total applications.
- Draft applications.
- Applied applications.
- Assessments.
- Interviews.
- Offers.
- Rejections.

Provide filters:

- Last 30 days.
- Last 90 days.
- All time.

All counts must come from actual database records.

### B. Weekly application chart

Build a week-by-week activity chart showing the user's application activity over time.

Use real application creation and status-history data.

Do not generate artificial data.

### C. What needs attention

Show useful next actions, including:

- Applications waiting for review.
- Upcoming interviews.
- Applications needing follow-up.
- Recently received employer replies.
- Jobs saved but not yet converted into applications.
- Drafts awaiting user approval.

Only show actions that are supported by actual records.

### D. Upcoming interviews

Display upcoming interviews with:

- Company.
- Position.
- Date.
- Time.
- Interview type.
- Application reference.

Allow users to open the corresponding application.

### E. Calendar widget

Reproduce Dossier's calendar experience.

Include:

- Month view.
- Markers on dates containing events.
- Week-ahead view.
- Interview events.
- Google Calendar events when connected.
- Links from interview events to the associated application.

On wide screens, the calendar should sit beside the other dashboard cards.

On smaller screens, it should stack underneath them.

### Definition of done

The dashboard must be functional, database-connected and responsive.

No static placeholder charts.

---

# 4. PRODUCT MODULE 2 — CAREER PROFILE

Dossier uses one centralized career profile as the source of truth for all generated documents.

Implement the same concept.

Each user has their own career profile.

Include:

- Basic information.
- Contact information.
- Professional headline.
- Professional summary.
- Skills.
- Languages and language levels.
- Work experience.
- Volunteering.
- Projects.
- Education.
- Certifications.
- Publications.
- References.

Allow the user to:

- Add sections.
- Edit entries.
- Delete entries.
- Reorder sections.
- Edit individual records.
- Add project links.
- Add certification verification links.
- Add publication information.
- Maintain multiple experiences and projects.

## Profile strength meter

Implement a profile strength indicator.

The score must reflect actual profile completeness.

Do not simply show an arbitrary 100% progress bar.

## Resume import

Allow a user to begin their profile by importing an existing:

- PDF resume.
- Word/DOCX resume.
- Markdown resume.

Extract information and map it into profile fields.

Show extracted information for review before saving.

Do not invent missing personal details or achievements.

All generated documents must use the selected user's profile, never another user's information.

---

# 5. PRODUCT MODULE 3 — BASE RESUME

This is separate from job-specific tailored resumes.

Implement the same Base Resume experience as Dossier.

## Required functionality

- Twelve professionally designed resume themes.
- Live resume preview.
- Resume section ordering.
- Theme builder.
- Theme duplication.
- Custom formatting.
- Typography and spacing controls.
- Save theme settings.
- Select and edit themes.
- Generate PDF on the server.
- Print-ready output.
- Download PDF.
- Share/export theme configuration as a file where appropriate.

Implement server-side PDF generation using an open-source solution compatible with the current hosting architecture.

Do not require a paid PDF API.

Resume themes must use the user's career profile.

A change to a base resume must not silently overwrite existing tailored application documents.

---

# 6. PRODUCT MODULE 4 — FIND JOBS

This must reproduce the actual Dossier Find Jobs workflow.

Build a dedicated job discovery page.

## A. Search controls

Allow users to search using:

- Current role.
- Job title.
- Keywords.
- Location.
- Country.
- Distance radius where supported.
- Posting recency.
- Remote-only filter.

Start with the user's profile location and current role when available.

Allow users to change them.

## B. Job source architecture

Build modular job-source adapters.

Dossier documents these sources:

1. JSearch.
2. Adzuna.
3. FreeHire.

Implement only sources that are legally and commercially usable within the $0 budget.

IMPORTANT SOURCE RESTRICTIONS:

- Do not scrape LinkedIn directly.
- Do not scrape Indeed directly.
- Do not bypass bot protections.
- Do not bypass authentication.
- Do not violate terms of service.
- Do not use FreeHire's personal no-key endpoint for Octo's multi-user SaaS unless its terms explicitly authorize this usage.
- Verify the actual free plan and multi-user commercial permissions of JSearch and Adzuna before enabling them.
- Do not assume an API is free for unlimited users.

Consider public company career-board sources, such as publicly available ATS job feeds, only when their access rules and terms permit the integration.

Provide manual job-description input as a permanent fallback.

## C. Normalize job results

All sources must return a common internal job structure.

Store:

- Source.
- External job ID.
- Job title.
- Company.
- Location.
- Remote status.
- Employment type, if available.
- Job description.
- Required skills.
- Posting date, if available.
- Original application URL.
- Company career URL.
- Actual published application email, if present.
- First-seen date.
- Expiration or last-verified date.

Avoid duplicate listings.

Do not fabricate missing fields.

## D. Job result cards

Every result should allow users to:

- View the job.
- Read the full description.
- See the company.
- Save the job.
- Dismiss the job.
- Score the job against their profile.
- Start a new application.

### Saved and dismissed jobs

Persist these actions.

Dismissed jobs should not repeatedly appear as new recommendations.

Saved jobs must be accessible later.

### Past searches

Implement Dossier-style Past Searches.

Store each search and its results.

Opening a past search should restore saved results rather than making another unnecessary external API request.

---

# 7. PRODUCT MODULE 5 — STARTUP DISCOVERY

Implement Dossier's startup discovery functionality.

Discover opportunities through:

- Y Combinator startup job listings.
- Hacker News monthly Who is Hiring discussions.
- Public startup career pages where access is permitted.

For each listing, show:

- Startup name.
- Role.
- Job details.
- Location.
- Remote eligibility.
- Application URL.
- Actual published application contact where available.
- Match score.

Rank results by the user's profile fit.

Apply location and country eligibility carefully.

Respect robots.txt and website access rules.

Do not fabricate an application email or invent active vacancies.

Allow users to save startup roles and create applications directly.

---

# 8. PRODUCT MODULE 6 — AI JOB MATCHING

The job scoring system must be AI-powered through the central backend AI provider.

Do not use a separate external paid scoring API.

When a user scores a job, compare the full job posting against their career profile.

Assess:

- Required skills.
- Preferred skills.
- Work experience.
- Projects.
- Education.
- Certifications.
- Seniority.
- Location compatibility.
- Remote compatibility.

Display:

- Compatibility score.
- Relevant matching qualifications.
- Skills the user possesses.
- Missing requirements.
- Important gaps.
- Explanation of the match.

Use a consistent score from 0 to 100.

Show clear reasons rather than an unexplained number.

Where possible, cite or quote the relevant lines from the original job posting in the explanation.

For example:

Covers:
- Python experience.
- SQL.
- Relevant project experience.

Missing:
- Required production AWS experience.

Never claim that a user possesses a qualification that is missing from their profile.

Cache scoring results and invalidate them when the job or career profile materially changes.

A deterministic fallback may be used when AI is temporarily unavailable, but label it as rule-based rather than AI-generated.

---

# 9. PRODUCT MODULE 7 — START A NEW APPLICATION

This is a critical Dossier workflow.

Users should be able to start an application in two ways:

1. From a job-discovery result with one click.
2. By pasting a job description manually.

When starting an application, the system must:

1. Retrieve the complete job description.
2. Extract the company name.
3. Extract the role.
4. Extract the location.
5. Extract job requirements.
6. Identify application instructions.
7. Identify an application email only if actually published.
8. Compare requirements with the user's profile.
9. Produce a compatibility assessment.
10. Generate a tailored resume.
11. Generate a tailored cover letter.
12. Save the application as a Draft.

The user must be able to review all generated content.

Do not create a fabricated application recipient.

If a field cannot be extracted, allow manual editing.

Use structured data extraction and validate its output.

---

# 10. PRODUCT MODULE 8 — AI-TAILORED RESUME

Every application should have its own tailored resume.

Do not overwrite the user's base resume.

The AI must:

- Analyze the job description.
- Analyze the user's full profile.
- Select relevant experiences.
- Highlight relevant projects.
- Reorder relevant skills.
- Improve professional wording.
- Tailor the summary.
- Create relevant and truthful resume bullets.
- Maintain proper resume structure.

### Strict truthfulness requirement

Never invent:

- Employment history.
- Job titles.
- Skills.
- Certifications.
- Degrees.
- Project experience.
- Achievements.
- Revenue figures.
- Performance percentages.
- Responsibilities.

If the job requires something that the user lacks, show it as a missing qualification.

Use only facts from the profile.

### Editing

Allow users to:

- Edit content manually.
- Regenerate individual sections.
- Accept or reject suggestions.
- Compare versions.
- Save new versions.
- Undo changes.
- Restore an earlier document.

Allow the tailored resume to be downloaded as a PDF.

---

# 11. PRODUCT MODULE 9 — AI COVER LETTER

Generate a cover letter for every application.

Use:

- Job posting.
- Career profile.
- Relevant experience.
- Relevant projects.
- Company details.
- Chosen tone.

Include:

- Sender details.
- Date.
- Recipient details where known.
- Greeting.
- Body.
- Sign-off.

Allow users to edit or regenerate every individual part.

Preserve the language of the document when refining it.

Support professional writing tones.

Do not create imaginary connections with the recruiter or company.

Do not claim experience that does not exist.

Generate a downloadable PDF.

---

# 12. PRODUCT MODULE 10 — DOCUMENT REFINEMENT CHAT

This is an important part of Dossier's application experience.

Inside each application, provide an AI chat that can refine the tailored resume and cover letter.

Example instructions:

- Make the summary shorter.
- Emphasize the relevant project.
- Make the experience descriptions more technical.
- Improve the wording.
- Rewrite this section for the job.
- Change the cover letter tone.
- Make the letter more concise.

The chat must understand which application and document the user is editing.

Provide:

- Conversation history.
- Current document context.
- Individual section editing.
- Regeneration.
- Undo.
- Version history.
- Restore previous version.
- Private application notes.

Never silently overwrite documents.

Every AI modification must be recoverable.

Every cover letter part, including recipient, sender, date, greeting and sign-off, must be editable.

---

# 13. PRODUCT MODULE 11 — APPLICATION-SPECIFIC EMAILS

Dossier's email functionality is closely tied to each job application.

Do not build an unrelated generic email marketing system.

Build an application email composer.

For each application:

- Identify the recipient only when available from the job posting or user input.
- Generate an appropriate subject.
- Generate a professional email body.
- Use the company and role information.
- Include the tailored resume PDF.
- Include the cover letter PDF.
- Allow full editing.
- Allow AI rewriting.
- Allow copying the email.
- Allow downloading the documents.
- Allow opening the user's default mail application.

Do not assume that mailto links can automatically attach files.

The user must be able to download or attach the PDFs through an actual supported sending integration.

## Email composition workflow

The user should be able to:

1. Open an application.
2. Select Email.
3. Review recipient and subject.
4. Read the generated body.
5. Edit or refine it.
6. Download the resume and cover letter.
7. Copy the email.
8. Open their mail application or use the Gmail connection.
9. Confirm sending.

Do not send automatically.

---

# 14. PRODUCT MODULE 12 — GMAIL INTEGRATION

Implement optional Gmail integration using the official Google OAuth and Gmail API.

IMPORTANT:

- Google OAuth credentials are application-level backend configuration.
- Never ask customers for Google developer API keys.
- Customers should only connect their own Gmail accounts through Google's OAuth consent screen.

Support:

### Sending

Send an application email from the user's own Gmail address with the tailored resume and cover letter PDFs attached.

### Employer replies

Check relevant employer replies and associate them with the correct application.

Prioritize:

- Threads sent through Octo.tech.
- Messages from companies the user has applied to.

Do not read the entire inbox by default.

### AI reply assistant

When an employer replies:

1. Associate the message with its application.
2. Extract the relevant message.
3. Provide an understandable summary.
4. Let the AI interpret questions or requests.
5. Generate a suggested reply based on the user's profile and application history.
6. Allow the user to refine the draft.
7. Allow the user to approve or reject it.

Never automatically send an AI-generated reply.

Do not automatically change an application status based solely on an AI interpretation.

### Synchronization

Implement reliable message synchronization.

Dossier checks Gmail every few minutes, but Octo.tech must respect the actual limits of its serverless hosting and available free scheduling.

Do not claim a five-minute synchronization interval unless it is genuinely implemented and operational.

If background polling cannot run reliably within the existing free infrastructure, provide user-triggered synchronization and the best supported scheduled synchronization alternative.

Google integration must remain optional.

Without Gmail connected, the normal email composer must still work.

---

# 15. PRODUCT MODULE 13 — GOOGLE CALENDAR

Implement optional Google Calendar integration.

Users can connect their own Google account using OAuth.

Support:

- Read upcoming calendar events with permission.
- Display upcoming interviews.
- Suggest available interview slots based on authorized calendar availability.
- Add an agreed interview to Google Calendar.
- Update events when an interview changes.
- Remove linked events when an interview is deleted.
- Synchronize linked interviews when the corresponding calendar event changes.

Implement two-way synchronization carefully.

Prevent duplicate events.

Do not create an interview or calendar event without user confirmation.

The application must remain functional with manual interview scheduling if Google Calendar is disconnected.

---

# 16. PRODUCT MODULE 14 — APPLICATION TRACKER

Implement the Dossier-style application management experience.

Each user should have two main views.

## A. Board view

Build a Kanban board.

Support stages:

- Draft.
- Applied.
- Assessment.
- Interview.
- Offer.
- Rejected.

Also support withdrawn applications where appropriate.

Allow drag-and-drop between stages.

Persist every change.

Record status history.

## B. Table view

Display applications in a searchable and sortable table.

Include:

- Company.
- Role.
- Status.
- Location.
- Date created.
- Application date.
- Next interview.
- Last activity.
- Source.

Add filters and sorting.

## C. Application detail page

Each application must have its own workspace.

Include:

- Job information.
- Compatibility assessment.
- Tailored resume.
- Cover letter.
- Document refinement chat.
- Application email.
- Email conversation history where Gmail is connected.
- Private notes.
- Application activity history.
- Interview details.
- Document versions.

The user must be able to return to any application and continue editing it.

---

# 17. PRODUCT MODULE 15 — JOB-SEARCH AUTOMATION AGENT

This is the Dossier Job Agent.

Do not confuse this with Octo.tech's existing auto-apply feature.

The Job Agent discovers relevant new jobs and prepares drafts. It does not automatically submit applications or send emails.

## A. Saved searches

Allow a user to maintain up to three named job searches.

Each search must have:

- Name.
- Role or keyword.
- Location.
- Country.
- Remote preference.
- Search source.
- Enabled/disabled state.
- Creation date.
- Last execution.
- Next scheduled execution.

Allow users to edit, pause, resume and delete searches.

## B. Daily scheduler

Run enabled saved searches once a day.

Process searches in their saved order.

All searches share one daily schedule.

Use the existing infrastructure if it supports reliable scheduled execution.

Inspect Vercel's current free-plan scheduling constraints before implementation.

Do not create a fake background job that stops when an HTTP request finishes.

If a persistent worker is unavailable, implement a reliable free-compatible scheduled approach that actually executes.

## C. Avoid duplicates

Skip jobs already:

- Seen.
- Scored.
- Saved.
- Dismissed.
- Processed in an earlier agent run.

Use stable source identifiers and normalized URL/content fingerprints.

A job must not appear as new every day merely because the source returned it again.

## D. Score newly discovered jobs

Use the central AI backend to evaluate new postings against the user's profile.

Display:

- Best opportunities.
- Score.
- Why the role matches.
- Matching qualifications.
- Missing qualifications.
- Searches that found it.
- Source.
- Original application link.

Sort relevant opportunities by compatibility.

## E. Optional draft creation

Allow the user to enable automatic preparation of:

- Tailored resume drafts.
- Cover letter drafts.
- Application email drafts.

Only prepare drafts.

Never submit an application.

Never send an email.

Never trigger Octo.tech's auto-apply feature automatically.

The user must review and approve every application.

## F. Quota and scheduling controls

Dossier uses a bounded source-request budget to prevent excessive requests.

Implement a configurable request budget, starting with a default of three first-page source requests per rolling 24 hours across the user's saved searches, where appropriate for the selected source.

Failed requests must count toward the request budget if they have already consumed an external source request.

If the budget is exhausted, wait until sufficient capacity becomes available rather than repeatedly retrying.

Implement:

- Per-user limits.
- Global API limits.
- Duplicate prevention.
- Retry backoff.
- Execution logs.
- Failure reporting.
- Pause/resume.
- Job execution history.

Do not create unlimited automated API calls.

---

# 18. CENTRALIZED AI ARCHITECTURE

All AI-powered modules must use one central backend implementation.

Create an architecture similar to:

AI service
  |
  |-- Provider configuration
  |-- API authentication
  |-- Model selection
  |-- Request validation
  |-- User context retrieval
  |-- Prompt templates
  |-- Structured output parsing
  |-- Usage tracking
  |-- Rate limiting
  |-- Error handling
  |
  |-- Job parsing
  |-- Job scoring
  |-- Resume generation
  |-- Cover letter generation
  |-- Document refinement
  |-- Email generation
  |-- Employer reply analysis
  |-- Job-agent draft generation

### Usage safeguards

Because all users share one provider key:

- Add per-user limits.
- Add global request limits.
- Track token consumption.
- Cache repeated operations.
- Avoid regenerating unchanged documents.
- Prevent request flooding.
- Handle provider 429 responses.
- Handle provider outages.
- Enforce a strict daily and monthly budget.
- Never fall back to a paid provider.

Keep feature usage compatible with the existing Basic and Pro subscription entitlements.

Do not invent new subscription prices or silently modify existing limits.

The AI model must not be trusted to decide whether a user has access to a feature. Entitlements must be validated by the backend.

---

# 19. SETTINGS AND INTEGRATIONS

Create the settings needed for Dossier-style functionality.

Include:

- Career profile access.
- Job-search preferences.
- Saved searches.
- Google connection status.
- Gmail connection status.
- Disconnect Google.
- Email synchronization settings.
- Calendar synchronization settings.
- Data export.
- Data import.
- Account and privacy options.

Do not expose backend API secrets in these settings.

AI provider credentials and models are controlled by the application backend, not customers.

---

# 20. MULTI-USER DATABASE ARCHITECTURE

Dossier is designed for one user per installation.

Octo.tech is a multi-user SaaS.

Adapt the functionality accordingly.

Use the existing Supabase database.

Every customer must have completely independent:

- Career profile.
- Resume documents.
- Theme settings.
- Applications.
- Job searches.
- Saved jobs.
- Dismissed jobs.
- Job scores.
- Application emails.
- Gmail connection.
- Calendar connection.
- Agent execution history.
- Notes.
- Document versions.

Implement proper Supabase RLS.

Validate user ownership in every backend operation.

Never trust client-supplied user IDs.

Never allow a customer to access another customer's documents, emails, tokens or applications.

Encrypt sensitive integration credentials.

Do not expose service-role credentials.

---

# 21. OCTO.TECH SUBSCRIPTION COMPATIBILITY

Preserve the existing subscription implementation and pricing.

Basic:
- $5 weekly.
- $12 monthly.

Pro:
- $11 weekly.
- $24 monthly.

All prices remain tax-inclusive.

Preserve the existing Dodo Payments integration.

Use existing feature entitlements.

Do not invent new numerical limits for resume generation or AI features.

Do not silently change Basic/Pro restrictions.

The new Dossier functionality must integrate into the existing subscription model.

Do not duplicate the subscription system.

Do not grant paid features merely because a user accessed a frontend route.

---

# 22. DESIGN AND USER EXPERIENCE

Study Dossier's screenshots and actual user workflows.

Reproduce its interaction patterns as closely as practical.

However, maintain Octo.tech's own branding.

Do not create a completely unrelated dashboard design.

The application should feel like one integrated product.

### Main navigation

Provide clearly organized access to:

- Dashboard.
- Find Jobs.
- Startups.
- Job Agent.
- Profile.
- Resume.
- Applications.
- Settings.

Emails and document refinement should be easily accessible from their corresponding application workspaces.

When Gmail is connected, surface employer replies and suggested responses in the relevant application.

### General requirements

- Responsive layout.
- Consistent typography.
- Professional dashboard.
- Interactive tables.
- Functional Kanban.
- Live resume preview.
- Smooth AI chat interface.
- Good loading states.
- Error states.
- Empty states.
- Success feedback.
- Proper form validation.
- Accessible UI.

Do not leave non-functional controls.

Do not show fake statistics.

Do not display hardcoded job listings as real opportunities.

---

# 23. SECURITY, PRIVACY AND LICENSING

Implement secure file handling for PDF and DOCX uploads.

Validate file types and sizes.

Protect OAuth callbacks.

Use state and PKCE as appropriate.

Encrypt stored tokens.

Limit external API access.

Provide user-authorized integration disconnection.

Implement deletion of stored data and credentials where appropriate.

Do not send private resume or profile data to AI providers without the appropriate privacy disclosure and consent.

### Dossier licensing

Dossier is licensed under AGPL-3.0.

Review the licence before copying or adapting source code.

Preserve required notices and comply with applicable source-code disclosure obligations, including network-use requirements.

Do not remove licence notices.

Functional parity does not require blindly copying Dossier's entire source code or replacing Octo's existing architecture.

---

# 24. END-TO-END ACCEPTANCE TESTS

Do not mark implementation complete until the following workflows work.

## Test 1 — New user

1. Sign up or log in using Octo.tech authentication.
2. Open the dashboard.
3. Create a career profile.
4. Upload an existing resume.
5. Verify profile extraction.
6. Edit and save the profile.

## Test 2 — Base resume

1. Open Resume.
2. Select a theme.
3. Open the live preview.
4. Edit a section.
5. Change theme settings.
6. Export PDF.
7. Verify PDF formatting.

## Test 3 — Discover jobs

1. Open Find Jobs.
2. Enter a job title.
3. Set a location.
4. Search an available authorized job source.
5. View real results.
6. Save a job.
7. Dismiss another.
8. Reopen Past Searches.
9. Verify results are restored without unnecessary duplicate requests.

## Test 4 — AI matching

1. Open a job posting.
2. Run AI scoring.
3. Confirm the score and explanations.
4. Confirm matching skills.
5. Confirm missing requirements.
6. Verify the output does not invent qualifications.

## Test 5 — Create an application

1. Select a job.
2. Click Start Application.
3. Verify job parsing.
4. Verify profile comparison.
5. Generate tailored resume.
6. Generate cover letter.
7. Save application as Draft.

## Test 6 — Refine documents

1. Open the application.
2. Refine the resume using chat.
3. Refine the cover letter.
4. Edit a single section.
5. Undo a change.
6. Restore an earlier document version.
7. Export both PDFs.

## Test 7 — Email

1. Open the application email composer.
2. Verify recipient information.
3. Generate email content.
4. Edit the message.
5. Download attachments.
6. Verify the copy/open mail application fallback.
7. Verify no message is sent without approval.

## Test 8 — Gmail

1. Connect a test Google account.
2. Send an approved application email.
3. Verify PDF attachments.
4. Receive a test employer reply.
5. Synchronize the reply.
6. Verify application association.
7. Generate a suggested response.
8. Verify nothing is sent automatically.

## Test 9 — Calendar

1. Create an interview manually.
2. Display it on the dashboard.
3. Connect a test Google Calendar.
4. Approve calendar synchronization.
5. Modify a linked interview.
6. Verify event synchronization.
7. Verify duplicate prevention.

## Test 10 — Job Agent

1. Create a named search.
2. Enable it.
3. Add another search.
4. Verify the maximum of three searches.
5. Run the job agent.
6. Verify new job discovery.
7. Verify duplicate jobs are skipped.
8. Verify match scores.
9. Generate optional drafts.
10. Verify that no application is submitted and no email is sent automatically.

## Test 11 — Multi-user isolation

Create two separate test users.

Verify that:

- User A cannot access User B's profile.
- User A cannot access User B's resume.
- User A cannot access User B's applications.
- User A cannot access User B's emails.
- User A cannot access User B's OAuth tokens.
- User A cannot access User B's agent results.

## Test 12 — Existing Octo functionality

Verify that existing subscriptions, billing, authentication, auto-application and cold-email functionality still work.

---

# 25. IMPLEMENTATION EXECUTION

Implement in the following order:

1. Codebase and Dossier parity audit.
2. Career profile and resume import.
3. Base resume and twelve themes.
4. Find Jobs and startup discovery.
5. Central AI integration.
6. Job matching.
7. New application workflow.
8. Tailored resume and cover letter.
9. Document refinement chat.
10. Application-specific email composer.
11. Application board and table.
12. Dashboard.
13. Gmail integration.
14. Calendar integration.
15. Job-search agent.
16. Full testing and preview deployment.

Do not create every page simultaneously and leave the backend unimplemented.

Implement a complete vertical slice of functionality at a time.

Test it before proceeding.

Maintain a feature-parity checklist.

Use real database persistence rather than temporary local state.

Do not use fake API responses in production.

Do not mark a feature complete merely because the UI has been created.

---

# 26. BUILD AND DEPLOYMENT VERIFICATION

Run the available checks in the existing project:

- TypeScript checks.
- Lint.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Production build.

Use the existing Vercel Preview deployment.

Do not deploy untested changes to production.

Do not modify production data during testing.

Do not change Dodo live-payment settings.

Report any deployment or free-tier limitation honestly.

---

# 27. FINAL DEFINITION OF DONE

The integration is complete only when:

- Dashboard shows real application and interview data.
- Career profile works.
- Resume import works.
- Twelve resume themes are available.
- Theme editor works.
- Base resume PDF generation works.
- Job discovery returns actual authorized job results.
- Startup discovery works where supported.
- Jobs can be saved and dismissed.
- AI job matching works.
- Users can create applications from postings.
- Tailored resumes are generated from real profile data.
- Cover letters are generated from real profile data.
- Document chat can edit and restore versions.
- Application emails can be generated and edited.
- PDF attachments are available.
- Gmail integration works where configured.
- Google Calendar integration works where configured.
- Job Agent executes on a real supported schedule.
- New jobs are deduplicated.
- Agent drafts wait for user approval.
- Applications board and table work.
- Dashboard analytics are accurate.
- Multi-user isolation is verified.
- Existing Octo.tech features remain intact.
- No paid API dependency has been introduced.
- No customer is asked to provide an AI API key.
- AI credentials remain exclusively on the backend.
- Production build passes.

---

# FINAL DIRECTIVE

I do not want a simplified interpretation of Dossier.

I want its actual job-search workflow, its dashboard experience, its resume system, its application-specific email system and its scheduled job-search agent implemented inside Octo.tech.

Do not replace these with generic alternatives.

Study the actual Dossier repository and implement the corresponding workflows as faithfully as possible.

Keep the existing Octo.tech application and all completed development phases intact.

Keep the additional project budget at $0.

All AI operations must use the centrally configured backend API key, not customer-supplied keys.

No automatic email sending or application submission through the Dossier-style Job Agent.

No fake implementations, placeholder functionality or invented API results.

**Start by auditing the current Octo.tech repository against Dossier's actual workflows, then implement and verify every missing feature.**