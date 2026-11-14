# OCTO.TECH — FIX AI ENGINE, BUILD PERSISTENT AUTO-APPLY, DAILY JOB DISCOVERY & AUTOMATED COLD APPROACH

## PROJECT CONTEXT

You are working on my existing SaaS application, OCTO.TECH.

Live application:
https://octo-pi-nine.vercel.app/

GitHub reference for the intended product experience:
https://github.com/AienTech/dossier

The UI has already been redesigned. Do NOT waste time redesigning the entire UI.

**The primary problem is that the functionality is poor and the AI features are not actually working.**

Your job is to make the existing product genuinely functional.

I want a working AI-powered job-search system with:

1. Centralized AI available to every authenticated user.
2. Daily job discovery from permitted public job sources.
3. Persistent auto-apply that continues when users log out.
4. User-controlled job roles and daily application limits.
5. Automation that runs for a maximum of 30 days per activation.
6. AI-powered cold outreach using the user's connected email.
7. Proper tracking, logs, error handling and background scheduling.

This is an implementation task, not a prototype.

---

# 1. ABSOLUTE REQUIREMENT: USERS MUST NOT NEED THEIR OWN AI API KEY

I am the developer and application owner.

I will provide and configure the Google AI Studio / Gemini API key on the backend.

The key must be centrally managed by Octo.tech.

When a user signs up or logs in, AI-powered features should already be available, provided the centrally configured service is healthy and within its permitted quota.

Users must NEVER be asked to:

- Create a Google AI Studio account.
- Obtain a Gemini API key.
- Enter an AI API key.
- Configure an AI model.
- Connect an AI provider.
- Pay for AI credits themselves.

The user should only provide their career information and preferences required by individual features.

**AI infrastructure and AI API expenses are my responsibility as the application owner.**

## Backend configuration

Inspect the existing AI integration first.

Use the current official Google Gen AI SDK and supported Gemini API model.

Use a consistent server-side configuration, such as:

GEMINI_API_KEY=
GEMINI_MODEL=

Use the exact environment variables supported by the chosen SDK and existing implementation.

Configure them through:

- Local `.env.local`.
- Vercel backend environment variables.

Never use `NEXT_PUBLIC_` for the secret.

Never expose the key in:

- Browser JavaScript.
- React components.
- API responses.
- Logs.
- Git commits.
- Database records.
- Frontend configuration.

If the key is already present in the project, inspect and reuse it. Do not ask me to paste it into source code.

## First task: fix the existing AI integration

Do not blindly create another AI integration.

Find out why the current AI functionality does not work.

Inspect:

1. Existing AI service files.
2. API routes.
3. Server actions.
4. Gemini SDK version.
5. Current model ID.
6. Environment variable names.
7. API authentication.
8. Request construction.
9. Response parsing.
10. Error handling.
11. Frontend-to-backend communication.
12. Vercel environment configuration.

Test a real request from the backend using the configured key.

Verify that:

- The API key is available server-side.
- The selected model exists and is accessible.
- Requests reach Google's API.
- Valid responses are returned.
- Responses are parsed correctly.
- Generated text reaches the frontend.
- Rate-limit errors are handled.
- Quota-exceeded errors are handled.
- Invalid model errors are explained.

Create an admin-only AI health check.

It must show:

- AI provider.
- Configured model.
- Connection status.
- Last successful request.
- Last failure.
- API quota or rate-limit status where available.

It must NEVER display the actual API key.

Do not create mock AI responses.

Do not pretend a static template is an AI-generated response.

When AI is unavailable, display a truthful error and preserve the user's input.

## AI FEATURES TO CONNECT

Connect the real backend Gemini service to:

- Job description extraction.
- Job relevance analysis.
- Job scoring.
- Resume tailoring.
- Cover letter generation.
- Resume refinement chat.
- Cover letter refinement.
- Application email generation.
- Cold outreach email generation.
- Job application answer preparation.
- Follow-up email generation.
- Job discovery ranking.
- Auto-apply qualification assessment.
- Job-agent processing.

Every feature must produce an actual response from the configured AI provider.

Use structured outputs and validate them before saving.

## AI quota management

All users will share my centrally configured API key.

Therefore implement:

- Global request limits.
- Per-user request limits.
- Token usage tracking.
- Caching.
- Timeout handling.
- Exponential backoff where appropriate.
- Request deduplication.
- Usage logs.
- Model error handling.
- A global emergency pause switch.

Do not allow one user to exhaust the entire shared API quota.

Do not use any paid fallback.

Do not silently switch models or providers.

When quota is exhausted, pause the affected AI operations until the quota is available again.

IMPORTANT PRIVACY GATE:

Verify the actual terms applicable to my Gemini API project.

Google's unpaid Gemini services have data-use and personal-information restrictions. Do not transmit customers' identifiable resumes, confidential career history or private emails to an unpaid service if its terms prohibit doing so.

If the project's service classification does not permit the intended user-data processing, report the precise blocker. Do not claim that redacting an API key or obtaining generic user consent overrides Google's terms.

---

# 2. AUTOMATION SECTION — AUTO APPLY

This is one of the most important features.

The user should be able to configure automated job applications once and let the system run every day.

The automation must continue working even when:

- The user closes the browser.
- The user logs out.
- The user does not visit Octo.tech.
- The user switches off their device.

The automation must run from the backend.

It must NOT depend on an open browser tab or frontend JavaScript timer.

## A. Auto-apply setup

When the user opens:

Automation → Auto Apply

Provide a proper configuration interface.

The user must be able to choose:

### Target job roles

Allow multiple roles.

Examples:

- Frontend Developer.
- Backend Developer.
- Full Stack Developer.
- Software Engineer.
- Python Developer.
- Java Developer.
- Data Analyst.
- Cybersecurity Analyst.
- Cloud Engineer.
- DevOps Engineer.

The examples are illustrative. Users must be able to enter any suitable custom role.

Support:

- Multiple target titles.
- Alternative job titles.
- Keywords.
- Skills.
- Industries.
- Preferred companies.
- Excluded companies.
- Location.
- Country.
- Remote preference.
- Employment type.
- Experience level.

### Application preferences

Collect information needed for truthful applications:

- Selected resume.
- Selected cover letter preferences.
- Professional experience.
- Education.
- Skills.
- Work authorization.
- Relocation preferences.
- Salary expectations when supplied.
- Notice period when supplied.
- Sponsorship preferences when supplied.

Never invent missing user information.

Do not guess answers to mandatory application questions.

## B. Daily application limit

Allow users to configure their desired maximum number of successful applications per day.

Provide a clear daily counter.

For example:

Daily application target: 20

Today:
- 20 successfully submitted.
- Daily target reached.

Tomorrow:
- The counter resets.
- Automation continues.
- The system starts applying to another set of relevant jobs.

The application target is a ceiling, not a promise that unsuitable or nonexistent jobs will be applied to.

Only apply to opportunities matching the configured filters and eligibility requirements.

### Existing subscription restrictions

Preserve the current subscription entitlements:

Basic:
- Maximum 10 successful auto-applications per day.

Pro:
- Maximum 20 successful auto-applications per day.

Users can select a lower limit.

They cannot exceed their current subscription limit.

Validate the limit server-side.

Do not allow frontend manipulation to exceed the subscription entitlement.

A successful application should count once.

Failed submissions must not be recorded as successful applications.

Maintain separate technical-attempt and successful-submission counters.

## C. Automation duration — maximum 30 days

The user must choose how long the automation runs.

Allow:

- 1 day.
- 7 days.
- 14 days.
- 21 days.
- 30 days.

The maximum permitted duration is 30 calendar days per activation.

Example:

Start date: November 15.

Duration: 30 days.

Daily target: 20 successful applications.

The agent runs on eligible days even when the user never logs in.

On the final scheduled day:

- Stop the automation.
- Mark the run as completed.
- Preserve its history.
- Notify the user through the application's notification system.
- Require a new explicit activation to start another 30-day period.

The user can also:

- Pause immediately.
- Resume manually.
- Stop permanently.
- Modify preferences.
- Reduce the daily target.

Pausing must stop new application submissions immediately.

A paused automation must not exceed its original expiry date unless the user explicitly starts a new activation.

## D. Start automation confirmation

Before starting:

Show the user:

- Selected roles.
- Selected locations.
- Daily application target.
- Subscription maximum.
- Selected resume.
- Start date.
- End date.
- Automation duration.
- Submission permissions.
- Applicable restrictions.

Require the user to explicitly activate the automation.

The user authorizes Octo.tech to submit applications matching these preferences for the selected period.

## E. Daily automation execution

Every scheduled run should:

1. Retrieve the user's active automation configuration.
2. Check the user account and subscription status.
3. Check whether the automation is paused or expired.
4. Check the current local day.
5. Reset or calculate the daily application counter.
6. Retrieve newly discovered jobs.
7. Filter jobs against selected roles and preferences.
8. Remove duplicate jobs.
9. Analyze each vacancy using Gemini.
10. Evaluate candidate suitability.
11. Reject irrelevant vacancies.
12. Select the appropriate truthful resume.
13. Generate a tailored resume where appropriate.
14. Generate a cover letter if required.
15. Prepare supported application answers.
16. Submit through a permitted and supported application method.
17. Verify whether the application was actually accepted.
18. Record the result.
19. Update the daily counter.
20. Continue until the daily target, execution budget or eligible job pool is exhausted.

Do not attempt to fill the quota using irrelevant jobs.

Do not apply twice to the same vacancy for the same user.

Do not create duplicate applications when retries occur.

## F. Auto-apply submission restrictions

Support actual application submission only where the source and target platform permit it.

Use official APIs or supported submission interfaces where available.

Do not:

- Bypass CAPTCHA.
- Bypass authentication.
- Evade bot detection.
- Circumvent rate limits.
- Submit fabricated credentials.
- Invent employment history.
- Guess legal declarations.
- Falsely claim work authorization.
- Submit answers the user has not supplied.
- Automatically complete assessments on the user's behalf.

If a site requires:

- CAPTCHA.
- User login or reauthentication.
- A mandatory user attestation.
- Unanswered legal or eligibility questions.
- A custom answer requiring personal judgment.
- An unsupported application interface.

Pause that particular application and add it to:

Needs Manual Action.

Do not mark it as submitted.

Preserve all application links and prepared materials.

Only report an application as successful when a genuine submission confirmation is received.

## G. Application history

For every automatic application record:

- User ID.
- Job ID.
- Company.
- Role.
- Source.
- Original job URL.
- Submission date.
- Submission status.
- Tailored resume version.
- Cover letter version.
- Response or confirmation identifier where available.
- Failure reason where applicable.
- Automation run ID.

Possible states:

- Discovered.
- Evaluating.
- Rejected by filters.
- Preparing.
- Ready for submission.
- Submitted.
- Submission failed.
- Needs manual action.
- Duplicate.
- Expired.

The Overview dashboard must show accurate information from these records.

---

# 3. JOB DISCOVERY — DAILY AUTOMATED JOB COLLECTION

Job Discovery should become a genuine continuously updated job-discovery system.

I want new jobs collected every day across a broad range of public sources.

This must not depend on a user manually searching every time.

## A. Build a real job-source engine

Gemini is not the web crawler itself.

Implement a separate collection engine that retrieves jobs from permitted public sources and passes the extracted job information to Gemini for analysis.

Prioritize:

- Official public company career pages.
- Public ATS job-board endpoints where permitted.
- Public Greenhouse job boards where permitted.
- Public Lever job boards where permitted.
- Public Ashby job boards where permitted.
- Official RSS or JSON job feeds.
- Authorized job APIs.
- Public startup career pages.
- Permitted public hiring discussions.

Do not assume every source offers unrestricted public access.

Do not violate robots.txt or source terms.

Do not bypass logins or anti-bot protections.

Do not scrape LinkedIn, Indeed or other restricted platforms without an authorized integration.

Do not use a paid search API.

Do not depend on Google Search grounding if it requires paid access.

If a source requires payment or an API key that we do not possess, do not enable it as an active source.

## B. Daily discovery scheduler

Create a backend scheduled process that:

1. Retrieves registered job sources.
2. Fetches available new job postings.
3. Parses the results.
4. Deduplicates them.
5. Normalizes job information.
6. Validates original job links.
7. Detects closed listings where possible.
8. Stores verified postings.
9. Updates last-seen timestamps.
10. Makes new postings available in Job Discovery.

Run daily even when no user is logged in.

This must be a real background process, not a fake frontend refresh.

## C. Job structure

For every collected posting, store:

- Job title.
- Company.
- Location.
- Country.
- Remote status.
- Employment type.
- Experience requirements.
- Job description.
- Required skills.
- Preferred skills.
- Original source.
- Original job URL.
- Company career URL.
- Posting date where available.
- First discovered date.
- Last verified date.
- Active/closed state.

Preserve source provenance.

Never fabricate missing job data.

## D. Gemini job intelligence

Pass collected postings through the central AI service.

Use Gemini to:

- Extract structured requirements.
- Identify seniority.
- Identify required skills.
- Identify preferred skills.
- Classify job category.
- Detect remote eligibility.
- Identify relevant company information.
- Identify application requirements.
- Detect likely duplicates or irrelevant listings.

Validate the output.

Never treat the AI output as proof that a listing is active.

## E. Job discovery filters

Users should be able to enter multiple target roles and view matching opportunities.

Use:

- Job title.
- Skills.
- Location.
- Country.
- Remote preference.
- Experience.
- Employment type.
- Job freshness.

Users should see:

- Newly discovered jobs.
- Relevant jobs.
- Saved jobs.
- Dismissed jobs.
- Previously applied jobs.

## F. AI job matching

For every relevant job, compare the posting against the actual user profile.

Generate:

- Match score.
- Matching skills.
- Missing skills.
- Relevant experience.
- Relevant projects.
- Qualifications.
- Potential concerns.
- Explanation.

Do not claim a user has a qualification that does not exist.

Cache results and avoid repeated AI requests for unchanged job/profile data.

## G. Global discovery vs personal matching

Use a central job catalogue to avoid crawling the same source independently for every user.

The daily source-collection process should update the shared job catalogue.

Personalized matching and filtering should then run for each user.

Store user-specific saved/dismissed/applied state separately.

Do not expose one user's private job-search history or profile to another user.

IMPORTANT:

Do not advertise that Octo.tech scans literally every website on the internet.

Build the broadest practical directory of verified, accessible and permitted job sources within the $0 infrastructure budget.

Show source coverage and last successful synchronization honestly.

---

# 4. AUTOMATION — COLD APPROACH

Keep Cold Approach inside:

Automation → Cold Approach.

Do not replace it with a generic email-writing tool.

The workflow should be:

User selects a target role → Job Discovery finds matching vacancies → Octo.tech identifies the companies → Octo.tech finds publicly published professional contacts → Gemini writes individually personalized outreach → approved emails are sent using the user's connected email account.

## A. Role selection

Allow users to select multiple roles.

Examples:

- Software Engineer.
- Backend Developer.
- Frontend Developer.
- Data Analyst.
- Cybersecurity Analyst.
- Cloud Engineer.
- DevOps Engineer.

Allow location, country and industry filters.

Use these preferences to retrieve relevant companies from the shared job catalogue.

Do not require users to manually paste every company.

## B. Identify relevant contacts

For every matched company:

1. Verify the company name.
2. Verify its official domain.
3. Retrieve its public career information.
4. Inspect its permitted contact and recruitment pages.
5. Identify publicly published recruitment contacts.
6. Identify publicly published HR contacts.
7. Identify founders or executives where an appropriate professional contact is explicitly published.
8. Validate that the contact is relevant to hiring or recruitment.
9. Store the original source URL for every contact.

Prioritize official role-based addresses:

- careers@
- jobs@
- recruiting@
- hr@
- talent@

Also support founder or HR contacts when their professional contact details are explicitly published.

Do not guess private email addresses.

Do not generate email addresses using guessed firstname.lastname patterns.

Do not use paid email-enrichment APIs.

Do not purchase contact lists.

Do not expose personal contact details that are not appropriately published for professional communication.

If no verified contact can be found, mark:

No Verified Contact Available.

Never invent an email address.

## C. AI personalized outreach

For each recipient, use Gemini to create a personalized message.

The AI must consider:

- User profile.
- Target role.
- Company.
- Actual vacancy.
- Required qualifications.
- Relevant work experience.
- Relevant projects.
- Recipient's verified professional role.
- Relevant job application context.

Generate:

- Subject line.
- Professional greeting.
- Personalized introduction.
- Short explanation of the user's fit.
- Relevant skills and projects.
- Clear professional request.
- Sign-off.

Never fabricate:

- Employment.
- Projects.
- Qualifications.
- Company connections.
- Prior conversations.
- Recruiter relationships.

Make every message specific to its recipient and job context.

Do not generate identical emails with only the company name changed.

## D. Send via the user's email

The email must be sent from the user's own connected email account.

Implement Gmail OAuth and the official Gmail API where available.

Important distinction:

- My Gemini API key is centrally controlled by Octo.tech.
- Gmail authorization belongs to each user because the email must originate from that user's own account.

Customers must not provide their own AI API key or Google developer credentials.

They must authorize their own email account through Google's normal OAuth consent process.

Use the minimum appropriate Gmail permission for sending, such as gmail.send.

Do not request full inbox access if sending is the only required function.

Store refresh tokens securely.

Never ask users for Gmail passwords.

## E. Campaign approval and automatic sending

The user should be able to:

1. Choose roles.
2. Let Octo.tech discover companies.
3. Review verified founders/HR/recruitment contacts.
4. Preview sample AI messages.
5. Review the recipient list.
6. Choose the desired number of outreach messages per day.
7. Confirm the sending account.
8. Explicitly start the outreach campaign.

After the user approves the recipient list and campaign configuration, Octo.tech may send the individually personalized messages from that connected account according to the authorized schedule.

Allow immediate pause and stop.

Do not send emails merely because a contact was discovered.

Do not hide the sending action from the user.

Send individual emails rather than putting an entire recipient list in CC or BCC.

Respect Gmail sending limits, provider restrictions and applicable anti-spam laws.

If the provider returns a rate-limit or policy error, stop sending and report it. Do not rotate accounts to bypass limits.

Maintain a contact suppression list for bounced addresses, opt-outs and recipients who request no further contact.

Stop contacting a recipient once they request no further messages.

Do not use Gmail to distribute spam or unwanted bulk mail.

## F. Existing cold-email limits

Preserve the Phase 4 subscription limits:

Basic:
- 15 successful cold emails per day.

Pro:
- 20 successful cold emails per day.

Allow a lower user-selected daily target.

Enforce the plan ceiling on the backend.

Only count confirmed successful sends.

A failed or rejected send must not be counted as successful.

Never exceed Gmail's own account-level or API limits.

---

# 5. PERSISTENT BACKGROUND EXECUTION — CRITICAL

This entire system must work when customers are offline.

Do not implement automation using:

- setTimeout in the browser.
- setInterval in the browser.
- An open React component.
- A user session that must remain active.
- A manual refresh.
- A route that only runs when the user visits the site.

## Preferred architecture

Inspect the existing Supabase project and its plan.

Prefer the existing Supabase infrastructure:

Supabase Cron / pg_cron
        |
        v
Secure scheduled dispatcher
        |
        v
Supabase Edge Function
        |
        v
Persistent task queue
        |
        +---- Global job discovery
        |
        +---- User auto-apply jobs
        |
        +---- Cold outreach campaigns
        |
        +---- Usage accounting
        |
        +---- Status updates

Use Supabase Vault or the equivalent secure backend secret management for scheduled function authentication.

Never put a service-role key in a public request.

Do not assume a scheduled function can run indefinitely.

Process tasks in bounded batches.

Use database leases, locks and idempotency keys.

Prevent multiple workers from processing the same task simultaneously.

Check current Supabase free-plan quotas and execution limits.

The documented Supabase Cron guidance recommends no more than eight concurrent jobs and keeping each job below ten minutes. Design around the actual applicable limits.

Do not introduce a paid worker platform.

If the existing infrastructure cannot support a required process for free, explain the exact blocker rather than pretending it works.

Also inspect the current Vercel plan. Do not assume the Vercel Hobby plan is suitable for a commercial SaaS; its documented use is restricted to personal, non-commercial projects.

## Scheduler requirements

Implement:

- Daily global discovery schedule.
- Per-user auto-apply schedules.
- Per-user cold outreach schedules.
- Task queue.
- Retry policy.
- Dead-letter/error state.
- Execution logs.
- Task ownership.
- Pause and cancellation.
- Idempotent processing.
- Automatic expiration.

Every scheduled task must be associated with the correct user.

No browser session must be needed.

---

# 6. DATABASE IMPLEMENTATION

Inspect the existing Supabase schema first.

Reuse existing tables where appropriate.

Only create new structures where actually required.

Potential entities:

- job_sources
- job_postings
- job_source_sync_runs
- user_job_preferences
- user_saved_jobs
- user_dismissed_jobs
- job_match_scores
- auto_apply_configurations
- auto_apply_runs
- auto_apply_run_items
- application_submissions
- automation_queue
- automation_execution_logs
- cold_approach_campaigns
- cold_approach_contacts
- cold_approach_messages
- email_sending_logs
- contact_suppression_list
- ai_usage_logs

These are logical suggestions, not instructions to duplicate existing tables.

Required fields for auto-apply configuration:

- id
- user_id
- selected_roles
- locations
- filters
- daily_target
- plan_daily_limit
- duration_days
- start_at
- expires_at
- timezone
- status
- selected_resume_id
- created_at
- updated_at

Required statuses:

- Draft.
- Scheduled.
- Running.
- Paused.
- Completed.
- Stopped.
- Failed.
- Expired.

Enforce ownership with Supabase RLS.

Validate user ownership on the backend.

Add indexes for due schedules, queue states, deduplication and daily usage calculations.

Use transactions for submission and usage-record updates.

Prevent double counting.

Preserve application history after automation expires.

---

# 7. DASHBOARD AND AUTOMATION UI

Do not redesign the visual identity.

Make the existing pages actually work.

Keep exactly this sidebar:

WORKSPACE

- Overview
- Job Discovery
- Automation
  - Auto Apply
  - Cold Approach
- Resume
  - Tailor
  - Cover Letter
- Follow-up

## Auto Apply screen

Show:

- Automation status.
- Selected roles.
- Daily application target.
- Today's successful applications.
- Subscription maximum.
- Automation start date.
- Expiry date.
- Days remaining.
- Pause/resume.
- Stop.
- Execution history.
- Recent applications.
- Failed attempts.
- Applications requiring manual action.

Make the daily counter reset using the user's configured timezone.

## Job Discovery screen

Show:

- Search filters.
- Live job results.
- Newly discovered jobs.
- Match score.
- Saved jobs.
- Dismissed jobs.
- Last synchronization.
- Job-source status.
- Original job links.

## Cold Approach screen

Show:

- Selected roles.
- Discovered companies.
- Verified contacts.
- Contact source.
- Generated sample emails.
- Campaign status.
- Daily target.
- Messages sent.
- Failed sends.
- Pause/stop controls.

Display when Gmail is not connected.

Do not create fake counts.

---

# 8. FAILURE HANDLING

The system must never silently fail.

### Gemini failures

Handle:

- Missing API key.
- Invalid API key.
- Unsupported model.
- 401/403.
- 429 quota errors.
- 500/503.
- Timeouts.
- Malformed outputs.

Preserve the task and retry only when safe.

### Job discovery failures

If one source fails, continue with other authorized sources.

Record:

- Source.
- Error.
- Last successful sync.
- Retry time.

Do not delete previously verified jobs merely because one source temporarily failed.

### Auto-apply failures

If an application fails:

- Record the reason.
- Preserve the prepared resume and cover letter.
- Do not falsely mark submission successful.
- Do not retry indefinitely.
- Avoid duplicate applications.

### Email failures

If Gmail rejects a send:

- Record the provider response.
- Preserve the message.
- Avoid repeated duplicate sends.
- Stop the campaign when rate limits or account restrictions require it.

Use safe idempotency keys for all sending and submission operations.

---

# 9. SECURITY AND PRIVACY

Implement:

- Backend-only Gemini credentials.
- Secure Gmail OAuth.
- Encrypted refresh tokens.
- Supabase RLS.
- User-specific job applications.
- User-specific resumes.
- Private application data.
- Strict role and subscription checks.
- Rate limiting.
- Audit logs.
- Automatic token refresh.
- OAuth revocation handling.
- Data deletion procedures.

Do not let AI decide user permissions or bypass subscription entitlements.

Do not allow one user's AI context to be shared with another user's request.

Use only the profile and job data belonging to the authenticated user.

For automated submissions, users must authorize the application preferences and the relevant factual information in advance.

---

# 10. TESTING — REAL FUNCTIONALITY ONLY

Do not mark this task complete based on frontend appearance.

## Test A: AI functionality

- Log in as a normal user.
- Open a resume tailoring feature.
- Enter a job description.
- Generate a tailored resume using the configured backend Gemini key.
- Verify the actual model response.
- Refine a section.
- Generate a cover letter.
- Generate an outreach email.
- Verify that no user API key is requested.

## Test B: Job discovery

- Run the scheduled job collection.
- Retrieve real postings from enabled sources.
- Verify source attribution.
- Verify job parsing.
- Verify duplicate detection.
- Verify AI relevance analysis.
- Verify new jobs appear in the UI.

## Test C: Persistent auto-apply

Use test jobs and a safe test submission integration first.

- Create an automation.
- Select two target roles.
- Set the daily target.
- Set duration to 7 days.
- Start it.
- Log out.
- Trigger the scheduler.
- Verify background execution.
- Verify that the user does not need to log in.
- Verify that application history is saved.
- Verify that the daily limit is enforced.
- Verify duplicate prevention.
- Verify that pause stops future submissions.
- Verify automatic expiration.

Test 30-day expiration with simulated dates in a test environment, not by waiting 30 days.

## Test D: Cold outreach

Use test recipient accounts first.

- Select a role.
- Retrieve relevant job listings.
- Identify real company domains.
- Find public recruitment contacts.
- Verify contact-source URLs.
- Generate individual AI emails.
- Connect a test Gmail account.
- Authorize sending.
- Send a test message.
- Verify the message reaches the correct recipient.
- Verify sending logs.
- Verify daily limits.
- Verify the pause function.

Do not test by sending unsolicited emails to real people.

## Test E: Multi-user isolation

Create two test users.

Verify that:

- User A cannot access User B's applications.
- User A cannot read User B's email credentials.
- User A cannot see User B's automation configuration.
- User A cannot modify User B's daily counters.
- User A cannot access User B's AI generation history.

## Existing infrastructure regression

Preserve and test:

- Authentication.
- Subscription status.
- Dodo Payments.
- Basic/Pro access.
- Existing dashboard.
- Existing application data.
- Existing cold-email functionality.

---

# 11. BUILD VERIFICATION

Run the existing project checks:

npx tsc --noEmit

npm run build

Run available tests.

Use Vercel Preview rather than untested production deployment.

Do not alter live payment settings.

Do not run destructive database migrations against production.

---

# 12. REQUIRED FINAL IMPLEMENTATION REPORT

After finishing, report:

1. Why the existing AI features were failing.
2. Which Gemini model is actually configured.
3. Whether real AI requests work.
4. Which AI features now use the real backend service.
5. Which user data can be safely processed under the applicable Gemini terms.
6. Which job sources are active.
7. How daily job collection works.
8. How auto-apply continues after logout.
9. How the 30-day expiry is enforced.
10. How the daily application target is enforced.
11. How Gmail OAuth and sending work.
12. How cold outreach contacts are sourced.
13. Which features require manual intervention.
14. Which database migrations were made.
15. Which background schedules were configured.
16. Which tests passed.
17. Which free-tier limitations remain.
18. Whether a Vercel or Supabase plan restriction prevents deployment.

Never claim that something works unless it has been tested.

If a feature is blocked, identify the exact technical or policy restriction.

---

# FINAL DIRECTIVE

Fix the actual functionality of Octo.tech.

My intended user experience is simple:

A user signs in.

They enter their target job roles and professional details.

They can immediately access AI-powered features through the API key I manage on the backend.

They configure an auto-apply target and activate automation for up to 30 days.

Octo.tech continues finding new jobs and applying to suitable vacancies within their allowed daily limit, even when the user is offline.

They can also select roles for Cold Approach, where Octo.tech finds relevant companies and publicly listed professional recruitment contacts, generates individualized emails and sends approved campaigns through the user's connected email account.

The user can pause or stop automation whenever they want.

The system tracks every actual result.

**Do not merely create these screens. Implement the backend, database, AI requests, scheduled execution, integrations and real-world workflows.**

Do not introduce paid dependencies.

Do not request AI API keys from customers.

Do not fabricate results.

Do not claim to scrape the entire internet.

Do not bypass job-site security or email provider restrictions.

Start by diagnosing the existing AI integration, then implement and test the persistent automation infrastructure before enabling live submissions.