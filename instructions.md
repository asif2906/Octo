# OCTO.TECH — PRODUCT REDESIGN, EXACT WORKSPACE NAVIGATION & CENTRAL AI ENGINE

## PRIMARY OBJECTIVE

You are working on my existing SaaS application, Octo.tech.

The current product experience is not good enough. The navigation is cluttered, features feel disconnected, and the AI-powered workflows need to be properly implemented.

I want a substantial product-quality improvement, not a superficial UI redesign.

Use the following repositories as functional references:

Dossier:
https://github.com/AienTech/dossier

Dossier documentation:
https://github.com/AienTech/dossier/wiki

Existing Octo.tech:
https://octo-pi-nine.vercel.app/

The Dossier reference should be studied at source-code and workflow level.

Do not blindly copy its architecture. Reproduce its relevant product functionality within Octo.tech's existing architecture.

## 1. EXACT SIDEBAR STRUCTURE — DO NOT DEVIATE

Replace the current workspace navigation with precisely this structure:

WORKSPACE

1. Overview

2. Job Discovery

3. Automation
   - Auto Apply
   - Cold Approach

4. Resume
   - Tailor
   - Cover Letter

5. Follow-up

This is the complete main workspace navigation.

### Remove these standalone navigation entries:

- Startups
- Job Agent
- My Resumes
- Cover Letters
- Applications
- Interviews
- Cold Outreach
- Follow-ups

IMPORTANT:

Removing a standalone sidebar entry does NOT mean deleting its functionality.

Move all relevant functionality into the appropriate parent workspace.

For example:

- Startup discovery belongs inside Job Discovery.
- Daily job-search automation belongs inside Job Discovery's saved-search functionality.
- Application tracking belongs inside Overview and application detail views.
- Interview management belongs inside Overview.
- Base resume management belongs inside Resume → Tailor.
- Cover letter generation belongs inside Resume → Cover Letter.
- Application-specific emails and outreach belong inside Automation → Cold Approach.
- Employer replies and pending responses belong inside Follow-up.

Do not create new standalone sidebar entries to replace the removed ones.

### Sidebar behaviour

- Automation must be expandable and collapsible.
- Resume must be expandable and collapsible.
- Their children must appear underneath their parent.
- Show active-page highlighting.
- Preserve the expanded state while navigating.
- Support keyboard accessibility.
- Support mobile navigation.
- Use consistent icons.
- Use smooth, restrained animations.
- Keep spacing and typography clean.

Do not make the parent labels navigate to unrelated placeholder pages.

The Settings and account controls can remain in the account menu or existing utility area, outside the main workspace navigation.

Use the provided sidebar screenshot as the visual reference for the hierarchy and spacing.

---

# 2. CENTRAL AI ENGINE — HIGHEST PRIORITY

I will provide an AI API key for Octo.tech.

This key is controlled by me as the application owner.

Customers must NEVER be asked to enter their own AI API keys.

AI functionality must work through the backend.

### Required architecture

Implement a centralized AI service.

All AI-related features must use the same provider configuration and server-side infrastructure.

Suggested configuration:

OCTO_AI_PROVIDER=
OCTO_AI_API_KEY=
OCTO_AI_BASE_URL=
OCTO_AI_MODEL=
OCTO_AI_TIMEOUT_MS=

Adapt these names if the actual provider SDK requires additional configuration.

Before integration:

1. Identify the AI provider from the supplied configuration or provider documentation.
2. Determine the correct API endpoint.
3. Determine the required authentication format.
4. Determine the available models.
5. Determine whether structured output or tool/function calling is supported.
6. Verify the free-tier quota.
7. Verify that commercial and multi-user SaaS usage is permitted.
8. Test a real API request from the backend.

Do not guess the provider or endpoint.

If necessary, ask for the provider name, model ID and base URL, but never ask me to paste a secret into a public prompt or source file.

### Security

- Store the API key in Vercel environment secrets.
- Use a local .env.local for development.
- Never commit the API key.
- Never use NEXT_PUBLIC_ for AI credentials.
- Never return the key to frontend code.
- Never log it.
- Never expose it in error messages.
- Never store it in customer profiles.
- Do not implement customer-facing API-key settings.

### AI architecture

Build one central backend module that handles:

- Provider initialization.
- Authentication.
- Model configuration.
- Prompt construction.
- Structured responses.
- Validation.
- Timeouts.
- Retry handling.
- Rate limiting.
- Usage accounting.
- Error handling.
- Provider outages.

All modules must call this shared service.

Do not create separate AI clients in random components.

### AI must be used for actual work

The following must genuinely use the configured AI model:

- Job-description parsing.
- Job requirement extraction.
- Job compatibility scoring.
- Resume tailoring.
- Cover letter generation.
- Resume section refinement.
- Cover letter refinement.
- Cold outreach email generation.
- Application email generation.
- Employer reply analysis.
- Follow-up drafting.
- Auto-apply content preparation.
- Automated job discovery ranking.

Do not use static templates and claim they are AI-generated.

Deterministic fallback logic can be used for simple matching if the AI service is unavailable, but label it correctly.

### Zero-budget restrictions

The total additional budget is $0.

- Do not introduce paid APIs.
- Do not introduce paid automation services.
- Do not introduce paid email providers.
- Do not introduce paid job-search services.
- Do not introduce paid AI fallbacks.
- Do not activate paid upgrades.

Free API tiers must be verified for the intended commercial use.

Implement global and per-user request limits because every customer shares the application owner's API quota.

When the API quota is exhausted, stop new AI requests and display a clear message.

Never silently switch to a paid model.

MCP IS NOT REQUIRED FOR THIS IMPLEMENTATION.

The application uses its backend AI API directly. MCP may be implemented as a separate optional integration in the future if Octo.tech needs to expose its capabilities to Claude or another MCP-compatible client.

Do not waste time introducing MCP to make normal application AI features work.

---

# 3. OVERVIEW — THE CENTRAL DASHBOARD

Rebuild the Overview experience into a proper dashboard.

It should be inspired by Dossier's dashboard, not a generic admin template.

### Dashboard header

Show:

- Welcome message.
- User's current job-search status.
- Current date.
- A quick-action area.

### Application statistics

Display real data:

- Total applications.
- Draft applications.
- Applications sent.
- Interviews.
- Offers.
- Rejections.
- Response rate.

### Application funnel

Show actual application progress.

Provide:

- Last 30 days.
- Last 90 days.
- All time.

### Activity chart

Show weekly application activity using real data.

### Upcoming interviews

Show:

- Company.
- Role.
- Date.
- Time.
- Interview status.
- Application link.

### Calendar

Provide a calendar containing upcoming interviews and linked Google Calendar events when integration is configured.

### Applications management

Since there must be no separate Applications navigation item, provide a complete application management section inside Overview.

Include:

- Board view.
- Table view.
- Search.
- Filters.
- Status updates.
- Application details.
- Private notes.
- Activity history.

The user must still be able to manage every application.

### Recent activity

Show:

- Recently discovered jobs.
- Recently created applications.
- Recent status changes.
- Newly received employer replies.
- Documents recently generated.
- Follow-ups due.

Every dashboard component must use actual user data.

No fake charts or fabricated statistics.

---

# 4. JOB DISCOVERY — COMPLETE JOB DISCOVERY EXPERIENCE

Rebuild Job Discovery using Dossier's actual workflow.

Include the following sections within the same workspace:

### Job search

Search by:

- Job title.
- Keywords.
- Location.
- Country.
- Remote preference.
- Experience level.
- Employment type.
- Posting recency.

Use actual permitted job sources.

Implement modular source adapters.

Investigate JSearch, Adzuna, public company career-board feeds and other free sources.

Do not violate source terms or bypass anti-bot protection.

Do not use an API's personal free tier for a multi-user commercial product unless its terms permit that usage.

### Job cards

Every result should show:

- Job title.
- Company.
- Location.
- Job type.
- Description preview.
- Skills.
- Original application link.
- Source.
- Posting date where available.

Available actions:

- View details.
- Save.
- Dismiss.
- Score with AI.
- Start application.

### AI job analysis

When a user opens a job, AI should analyze:

- Required skills.
- Preferred skills.
- Experience.
- Education.
- Certifications.
- Responsibilities.
- Seniority.
- Location eligibility.

Compare them with the user's career profile.

Display:

- Match score from 0–100.
- Matching qualifications.
- Missing qualifications.
- Areas of concern.
- Explanation of the score.

Never invent skills or experience.

### Startup discovery

Place startup opportunities inside Job Discovery.

Include:

- Y Combinator listings.
- Hacker News Who is Hiring posts.
- Other public and permitted startup sources.

Do not add a standalone Startups page.

### Past searches and saved jobs

Persist:

- Search history.
- Saved jobs.
- Dismissed jobs.
- Previously scored jobs.
- Job-source identifiers.

Avoid duplicates.

### Daily job discovery

Add Dossier-style saved searches inside Job Discovery.

Allow up to three named searches.

Users should be able to:

- Add a search.
- Edit a search.
- Enable or disable it.
- Change its order.
- Run a search manually.
- See execution history.

Run enabled searches on a real supported daily schedule.

Deduplicate postings and score new results.

Display relevant results and allow users to prepare application drafts.

This feature must not create another sidebar item called Job Agent.

---

# 5. AUTOMATION → AUTO APPLY

This is the existing Octo.tech auto-application functionality.

Do not remove or rebuild it unnecessarily.

Integrate it into the new Automation section.

Rework its UI and workflow so it is reliable and easy to use.

### Auto Apply dashboard

Show:

- Daily application allowance.
- Applications completed today.
- Applications pending.
- Applications failed.
- Success rate.
- Automation status.
- Recent activity.
- Available job sources.

### Configuration

Allow users to configure:

- Target roles.
- Target companies.
- Location.
- Remote preference.
- Experience level.
- Required skills.
- Excluded companies.
- Salary preference where supported.
- Resume selection.
- Application preferences.

### AI-powered preparation

Use the central AI engine to:

- Analyze a vacancy.
- Compare it with the user's profile.
- Determine whether the user qualifies.
- Tailor the resume.
- Prepare a cover letter when required.
- Draft application answers.
- Prepare the application packet.

### Execution

Preserve Octo.tech's actual existing auto-apply implementation.

Use authorized job application interfaces and permitted submission methods.

Do not bypass CAPTCHAs or security protections.

Do not claim an application was submitted unless the target platform actually confirms submission.

Maintain execution logs.

Implement:

- Retry handling.
- Duplicate application prevention.
- Per-user limits.
- Per-day limits.
- Failure reporting.
- Success verification.
- User-controlled pause and resume.

Preserve existing subscription limits:

Basic: 10 successful applications per day.

Pro: 20 successful applications per day.

Do not count failed submissions as successful applications.

---

# 6. AUTOMATION → COLD APPROACH

Move the existing cold-email functionality here.

It should become a complete AI-powered outreach workspace.

### Campaign creation

Allow users to create outreach campaigns for:

- Recruiters.
- Hiring managers.
- Founders.
- CEOs.
- HR professionals.
- Other relevant professional contacts.

### Contact management

Use existing Octo.tech recipient lists and database.

Preserve the existing Basic and Pro restrictions.

Basic:
- User's own recipient list.

Pro:
- User's own recipient list plus the existing founder/CEO database.

Do not fabricate recipient names or email addresses.

### AI email generation

Generate personalized emails using:

- User profile.
- Target company.
- Target recipient.
- Job role.
- Relevant experience.
- Relevant projects.
- User instructions.

Generate professional subject lines and body content.

Allow:

- Rewrite.
- Shorten.
- Expand.
- Change tone.
- Personalize.
- Regenerate.

### Sending

Preserve existing cold-email limits:

Basic: 15 successful cold emails per day.

Pro: 20 successful cold emails per day.

Use the existing sending infrastructure where possible.

Implement reliable delivery status and failure tracking.

Respect applicable email requirements and provider terms.

Never send messages without the user's configured authorization.

Do not create an unlimited bulk email sender.

---

# 7. RESUME → TAILOR

This should become the main resume workspace.

Follow Dossier's base-resume and application-specific tailoring workflow.

### Base resume/profile

Use one centralized career profile containing:

- Personal information.
- Summary.
- Work experience.
- Education.
- Skills.
- Projects.
- Certifications.
- Publications.
- Languages.
- Other relevant qualifications.

Allow importing PDF, DOCX and Markdown resumes where supported.

Review extracted information before saving.

### Base resume builder

Include Dossier-style functionality:

- Twelve resume themes.
- Live preview.
- Theme customization.
- Theme duplication.
- Theme builder.
- Section reordering.
- Formatting controls.
- PDF generation.
- Download.

Do not create a separate My Resumes sidebar item.

### Job-specific tailoring

A user must be able to:

1. Select a job from Job Discovery.
2. Select an existing application.
3. Paste a job description.
4. Select their base resume.
5. Request AI tailoring.

The AI must:

- Analyze the job.
- Select relevant experiences.
- Prioritize relevant skills.
- Improve bullet points.
- Tailor the professional summary.
- Highlight relevant projects.
- Improve readability.
- Preserve factual accuracy.

Show a comparison between:

- Original resume.
- Tailored resume.

### AI editing chat

Inside the tailored resume workspace, implement a conversational editing interface.

Allow instructions such as:

- Make this more technical.
- Improve my summary.
- Shorten these bullet points.
- Emphasize this project.
- Align this resume with the job requirements.

Support:

- Individual section regeneration.
- Manual editing.
- Undo.
- Version history.
- Restoration.
- PDF export.

Never fabricate:

- Employment.
- Experience.
- Degrees.
- Skills.
- Certifications.
- Projects.
- Achievements.
- Numbers or percentages.

Missing qualifications must remain visible as gaps.

---

# 8. RESUME → COVER LETTER

Create a dedicated Cover Letter subpage underneath Resume.

It must be connected to:

- The career profile.
- The relevant job.
- The relevant application.
- The tailored resume.

### Generation

AI should generate a job-specific cover letter using verified user information.

Provide tone controls:

- Professional.
- Formal.
- Concise.
- Personalized.

Support multiple languages where the AI model permits.

### Editing

All sections must be editable:

- Sender.
- Date.
- Recipient.
- Greeting.
- Main body.
- Sign-off.

Allow conversational AI refinement.

Allow individual section regeneration.

Provide live preview and PDF download.

Every version must be saved and recoverable.

Do not invent company contacts or personal connections.

Do not invent professional experience.

---

# 9. FOLLOW-UP — APPLICATION COMMUNICATION HUB

Create one dedicated Follow-up workspace.

This is where pending employer responses and application follow-ups are managed.

### Follow-up dashboard

Show:

- Follow-ups due.
- Overdue follow-ups.
- Upcoming follow-ups.
- Replies received.
- Responses waiting for review.
- Completed follow-ups.

### AI follow-up generation

Use the actual application context.

AI should know:

- Company.
- Position.
- Application date.
- Last communication date.
- Previous messages.
- Interview stage.
- Relevant documents.

Generate appropriate follow-up messages.

Allow users to edit or regenerate them.

### Scheduling

Allow users to:

- Set a follow-up date.
- Reschedule.
- Mark complete.
- Dismiss.
- View communication history.

Do not automatically send a follow-up merely because its scheduled date has arrived.

Allow the user to review and approve each message.

### Gmail integration

If Gmail is connected:

- Synchronize relevant employer replies.
- Associate replies with applications.
- Display conversations.
- Summarize messages using AI.
- Suggest appropriate responses.

Without Gmail integration, the user must still be able to draft, copy and manage follow-ups manually.

Never send an AI-generated reply without approval.

---

# 10. APPLICATION WORKSPACE INTEGRATION

Every job application must have one central detail workspace.

It should connect all the relevant modules.

Include:

- Company and position details.
- Original job description.
- Compatibility score.
- Application status.
- Tailored resume.
- Cover letter.
- Email draft.
- Communication history.
- Follow-up schedule.
- Interview details.
- Private notes.
- Activity history.
- Document version history.

A user must not have to recreate information when moving between Job Discovery, Resume, Automation and Follow-up.

All actions must update the same application record.

---

# 11. INTERNAL AI WORKFLOWS

Use the central AI engine with feature-specific prompts.

Each AI request must receive only the context necessary for the task.

Create dedicated AI workflows:

### Job analysis
Input: Job description and profile.

Output: Requirements, qualification gaps, matching skills and structured job details.

### Job scoring
Input: Job description and profile.

Output: Score, explanation, matching evidence and concerns.

### Resume tailoring
Input: Profile, base resume and job description.

Output: Truthful tailored document.

### Cover letter
Input: Profile, job description and company information.

Output: Job-specific cover letter.

### Document refinement
Input: Current document, selected section and user instruction.

Output: Revised content and change information.

### Cold outreach
Input: User profile, target company, recipient and purpose.

Output: Subject and professional email body.

### Follow-up
Input: Application history and relevant messages.

Output: Context-aware follow-up draft.

### Employer reply analysis
Input: Authorized employer message and linked application.

Output: Summary, action required and suggested response.

All outputs must be validated before saving.

Do not trust model output to update subscription limits, user permissions or application ownership.

---

# 12. EXISTING INFRASTRUCTURE AND SUBSCRIPTIONS

Keep the existing Octo.tech technology stack.

Do not rebuild the app.

Preserve:

- Next.js.
- TypeScript.
- Supabase.
- Supabase authentication.
- Existing database.
- Existing Vercel project.
- Dodo Payments.
- Existing subscriptions.
- Existing Basic and Pro entitlements.
- Existing auto-apply functionality.
- Existing cold-email functionality.

Existing prices remain:

Basic: $5 weekly / $12 monthly.

Pro: $11 weekly / $24 monthly.

Preserve existing usage limits and access control.

All access checks must be enforced server-side.

Implement Supabase RLS for all user-owned records.

Do not mix user data.

Do not duplicate existing database tables unnecessarily.

---

# 13. DESIGN QUALITY REQUIREMENTS

The current product is not good enough. Do not merely adjust a few CSS classes.

Perform a real UI/UX audit.

Study the screenshot provided for the desired sidebar.

Study Dossier's actual product screens and workflows.

Rework the interface into a cohesive professional SaaS product.

### Visual direction

- Clean.
- Minimal.
- Premium.
- Consistent.
- Functional.
- Responsive.
- Easy to navigate.

Use consistent:

- Typography.
- Spacing.
- Icons.
- Buttons.
- Cards.
- Tables.
- Forms.
- Modals.
- Tabs.
- Status indicators.

Avoid unnecessary gradients, excessive cards, decorative charts and oversized elements.

### Interaction quality

Every feature must include:

- Loading state.
- Empty state.
- Error state.
- Success feedback.
- Proper validation.
- Responsive behaviour.

Do not leave dead buttons.

Do not create fake AI streaming.

Do not show mock applications as actual customer records.

---

# 14. IMPLEMENTATION REQUIREMENTS

Do not rewrite everything at once.

First inspect the repository and identify the existing components, routes and functionality.

Create an implementation checklist.

Then proceed:

1. Rebuild the sidebar and route hierarchy.
2. Fix Overview.
3. Fix Job Discovery.
4. Implement central AI backend.
5. Fix Auto Apply.
6. Fix Cold Approach.
7. Fix Resume → Tailor.
8. Fix Resume → Cover Letter.
9. Implement Follow-up.
10. Connect all workflows through shared applications.
11. Test multi-user security.
12. Test all features.
13. Deploy a Vercel Preview.

Do not break working functionality.

Do not create duplicate implementations.

Do not use mock data in real production screens.

Do not mark a feature completed simply because its page exists.

---

# 15. ACCEPTANCE TESTS

The following complete workflows must work:

### Workflow A
Overview → Discover a job → Score it → Start application → Tailor resume → Generate cover letter → Save application.

### Workflow B
Automation → Auto Apply → Configure preferences → Prepare application → Submit through a supported method → Verify submission → Update application history.

### Workflow C
Automation → Cold Approach → Select recipient → Generate AI email → Review → Approve sending → Track delivery.

### Workflow D
Resume → Tailor → Select job → Generate tailored resume → Refine through AI chat → Restore an older version → Download PDF.

### Workflow E
Resume → Cover Letter → Generate letter → Refine → Edit sender and recipient → Download PDF.

### Workflow F
Follow-up → Select application → Analyze communication history → Generate follow-up → Edit → Approve → Record outcome.

### Workflow G
Job Discovery → Configure saved searches → Run daily discovery → Deduplicate → Score new jobs → Prepare drafts.

### Workflow H
Overview → View applications → Change application stage → View interview → See dashboard statistics update.

Test with at least two separate users.

Verify that one user can never access another user's:

- Career profile.
- Resume.
- Cover letter.
- Application.
- Emails.
- OAuth tokens.
- Automation records.

---

# 16. FINAL INSTRUCTIONS

The final product must have exactly the navigation structure specified at the beginning.

Do not add additional main workspace categories.

Do not remove existing functionality merely to simplify the navigation.

Do not introduce unnecessary technology or infrastructure.

Do not introduce paid API dependencies.

Do not request AI API keys from customers.

Use the AI key I configure on the backend.

Do not introduce MCP unless a separate external AI-client integration is genuinely required.

Do not deploy broken or untested features to production.

Report precisely which modules work, which are incomplete, what API configuration is needed and what tests have passed.

**The goal is to transform the existing, poorly functioning Octo.tech product into a unified, genuinely AI-powered job-search SaaS with Dossier-inspired workflows and the exact navigation hierarchy specified above.** 

this is api key of google - [Configured in backend environment variables OCTO_AI_API_KEY] 