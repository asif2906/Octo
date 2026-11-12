# Octo.tech — Phase 2: Dashboard, Resume Builder & Core Product Development

You are an expert full-stack developer specializing in Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL and Supabase Auth.

You are continuing development of an existing project called Octo.tech.

The landing page and Supabase authentication have already been implemented and are working correctly.

Your task is to transform this project into a functional AI-powered job-search SaaS platform.

IMPORTANT: Do not rebuild the landing page or authentication from scratch. Extend the existing codebase.

---

# 1. Product Overview

Octo.tech is an AI-powered job-search platform that helps users:

- Build professional resumes.
- Tailor resumes to individual job descriptions.
- Apply to jobs using assisted form filling.
- Contact founders, CEOs and hiring managers directly.
- Track applications and outreach.
- Manage follow-ups and job-search progress.

**Product tagline:**

Apply smarter. Reach decision-makers. Get hired.

## Subscription Plans

| Feature | Free | Basic | Pro |
|---|---:|---:|---:|
| Monthly price | $0 | $9 | $19 |
| Applications/day | 3 | 10 | 20 |
| Cold emails | 5/week | 15/day | 20/day |
| Resume builder | Yes | Yes | Yes |
| AI tailoring | No | Yes | Yes |
| Follow-ups | No | Basic | Advanced |
| Tracker | Basic | Full | Full + analytics |
| Founder database | No | No | Planned |

Do not introduce credits. Use daily and weekly limits only.

---

# 2. Development Rules

Before writing code:

1. Inspect the existing project.
2. Understand its folder structure.
3. Inspect installed dependencies.
4. Check the current Supabase authentication implementation.
5. Check the existing database schema.
6. Preserve all working functionality.

Technical requirements:

- Next.js 16 App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide React.
- Supabase PostgreSQL.
- Supabase SSR authentication.

Use Server Components by default.

Use Client Components only when interaction requires them.

Use Supabase Row Level Security (RLS) to protect user data.

Never expose service-role keys.

Do not use mock data as a substitute for backend functionality.

If external API credentials are unavailable, build the integration interface and explain what configuration is required.

---

# 3. Dashboard UI

Create a professional dashboard that becomes the central workspace of Octo.tech.

The dashboard should feel like a premium SaaS product.

Design inspiration:

- Linear
- Notion
- Vercel
- Stripe

Design requirements:

- Minimalist.
- Modern typography.
- Consistent spacing.
- Clean navigation.
- Subtle animations.
- Responsive design.
- Beautiful data visualizations.
- Professional icons.
- Light theme as the initial default.

Avoid excessive gradients, unnecessary decorations and generic dashboard templates.

## Dashboard Layout

Create:

`app/dashboard/page.tsx`

Create reusable components inside:

`components/dashboard/`

Suggested components:

- sidebar.tsx
- dashboard-header.tsx
- welcome-section.tsx
- stats-cards.tsx
- recent-applications.tsx
- recent-activity.tsx
- quick-actions.tsx
- usage-overview.tsx

## Sidebar Navigation

Include:

**Workspace**
- Overview
- My Resumes
- Applications
- Cold Outreach
- Follow-ups

**Account**
- Profile
- Subscription
- Settings

Requirements:

- Active navigation highlighting.
- Responsive mobile sidebar.
- Collapsible sidebar on desktop.
- Octo.tech branding.
- Logout option.
- User avatar and email.

Every navigation item must lead to a real page or a clearly marked coming-soon page.

Do not create nonfunctional buttons.

## Dashboard Welcome Section

Display:

"Welcome back, [User Name]"

Supporting text:

"Here's what's happening with your job search."

Include:

- Current subscription plan.
- Upgrade button when applicable.
- Quick action to create a resume.
- Quick action to add an application.

## Statistics Cards

Create four cards:

1. Applications Sent.
2. Awaiting Response.
3. Rejected.
4. Hired.

All statistics must come from Supabase.

Do not hardcode numbers.

For a new user, display zero and an appropriate empty state.

## Recent Applications

Display:

- Company.
- Job title.
- Application date.
- Resume used.
- Current status.

Statuses:

- No reply.
- Rejected.
- Hired.

Include a link to view all applications.

## Recent Activity

Display recent events such as:

- Resume created.
- Resume updated.
- Application added.
- Email sent.
- Application status changed.

Only display events that actually exist in the database.

## Usage Overview

Display the user's remaining daily and weekly limits.

Examples:

Free:
- Applications: 3/day.
- Cold emails: 5/week.

Basic:
- Applications: 10/day.
- Cold emails: 15/day.

Pro:
- Applications: 20/day.
- Cold emails: 20/day.

Calculate remaining limits using actual server-side usage records.

---

# 4. Database Architecture

Use Supabase PostgreSQL.

Create migrations for the required tables.

All user-owned records must be associated with `auth.users.id`.

## Table 1: profiles

Fields:

- id (UUID, primary key, references auth.users.id)
- full_name
- email
- phone
- location
- headline
- professional_summary
- linkedin_url
- github_url
- portfolio_url
- created_at
- updated_at

## Table 2: education

Fields:

- id
- user_id
- institution
- degree
- field_of_study
- start_date
- end_date
- grade
- description
- created_at

## Table 3: experience

Fields:

- id
- user_id
- company
- job_title
- employment_type
- location
- start_date
- end_date
- currently_working
- description
- created_at

## Table 4: skills

Fields:

- id
- user_id
- skill_name
- proficiency
- created_at

## Table 5: projects

Fields:

- id
- user_id
- project_name
- description
- technologies
- project_url
- github_url
- start_date
- end_date
- created_at

## Table 6: resumes

Fields:

- id
- user_id
- title
- template
- content (JSONB)
- is_primary
- created_at
- updated_at

## Table 7: resume_versions

Fields:

- id
- user_id
- resume_id
- job_title
- company
- job_description
- content (JSONB)
- created_at

## Table 8: applications

Fields:

- id
- user_id
- company
- job_title
- job_url
- location
- job_description
- resume_id
- resume_version_id
- application_date
- status
- notes
- created_at
- updated_at

Allowed statuses:

- no_reply
- rejected
- hired

Default:

no_reply

## Table 9: activity_logs

Fields:

- id
- user_id
- activity_type
- description
- metadata (JSONB)
- created_at

## Database Security

Implement Row Level Security on all user-owned tables.

Rules:

- Users can only read their own records.
- Users can only insert their own records.
- Users can only update their own records.
- Users can only delete their own records.
- Never rely on client-side filtering for security.

Create indexes on frequently queried user_id and created_at columns.

Create a database trigger to automatically create a profile when a new user registers, if this does not already exist.

Use migrations rather than manually creating undocumented database structures.

---

# 5. User Profile

Create:

`app/dashboard/profile/page.tsx`

Users should be able to manage their professional information.

Sections:

**Personal Information**
- Full name.
- Email.
- Phone.
- Location.
- Professional headline.

**Professional Links**
- LinkedIn.
- GitHub.
- Portfolio.

**Professional Summary**
- About me.
- Career objectives.
- Short professional introduction.

Requirements:

- Fetch existing data from Supabase.
- Allow users to edit and save.
- Show loading states.
- Show success and error messages.
- Validate input.
- Automatically save updated_at.

The profile should become the central source of information for resume generation.

---

# 6. Resume Builder

This is the most important feature of the initial product.

Create:

`app/dashboard/resumes/page.tsx`

`app/dashboard/resumes/new/page.tsx`

`app/dashboard/resumes/[id]/page.tsx`

Components:

`components/resume/`

- resume-editor.tsx
- personal-info-form.tsx
- education-form.tsx
- experience-form.tsx
- skills-form.tsx
- projects-form.tsx
- resume-preview.tsx
- template-selector.tsx
- resume-actions.tsx

## Resume Builder Interface

Create a professional split-screen editor.

Left side:

Editable resume sections.

Right side:

Live resume preview.

Users should be able to:

- Add personal information.
- Add education.
- Add work experience.
- Add skills.
- Add projects.
- Edit existing entries.
- Delete entries.
- Reorder sections.
- Select templates.
- Save resumes.
- Export resumes as PDF.

## Resume Templates

Create at least three templates:

1. Modern Professional.
2. Minimal ATS.
3. Classic Professional.

Templates should be clean and suitable for freshers and experienced candidates.

Important:

- ATS-friendly formatting.
- No unnecessary graphics.
- Professional typography.
- Consistent spacing.
- Proper headings.
- Readable PDF output.

The resume preview should update as users edit their information.

## PDF Export

Implement genuine PDF generation.

The exported PDF must:

- Preserve formatting.
- Support multiple pages.
- Avoid cutting off text.
- Use selectable text rather than screenshots.
- Have a professional layout.

Do not simply export a screenshot of the resume.

Free users can create and export basic resumes.

---

# 7. AI Resume Tailoring

This feature is available only to Basic and Pro users.

Create:

`app/dashboard/resumes/tailor/page.tsx`

Workflow:

1. User selects an existing resume.
2. User pastes a job description.
3. User optionally enters company and job title.
4. User clicks Tailor Resume.
5. Backend sends relevant information to the AI provider.
6. AI generates an improved resume based on the job description.
7. User reviews the changes.
8. User saves the tailored version.

Requirements:

- Never invent work experience.
- Never invent qualifications.
- Never invent certifications.
- Never fabricate skills.
- Preserve factual accuracy.
- Improve relevance and wording.
- Use relevant keywords naturally.
- Maintain ATS-friendly formatting.

Save tailored versions in `resume_versions`.

Implement server-side plan verification.

Use a configurable AI provider.

Do not expose API keys.

If the API key is unavailable, implement the integration structure and display a clear configuration requirement.

Implement a soft daily tailoring limit of 20 requests per user.

---

# 8. Application Tracker

Create:

`app/dashboard/applications/page.tsx`

Allow users to manually add applications.

Fields:

- Company.
- Job title.
- Job URL.
- Location.
- Job description.
- Resume used.
- Application date.
- Notes.

## Status Management

Use three states:

| Status | Meaning |
|---|---|
| No reply | Waiting for a response |
| Rejected | Company declined |
| Hired | User got the job |

Default status: No reply.

Allow users to change statuses with a simple dropdown.

## Tracker Interface

Include:

- Search.
- Status filters.
- Date filters.
- Company filtering.
- Application cards or table.
- Edit application.
- Delete application.
- Application details.

## Statistics

Calculate:

- Applications sent.
- Pending applications.
- Rejections.
- Hires.
- Rejection rate.
- Hire rate.

Use actual Supabase records.

Do not generate artificial statistics.

For calculations, define the denominator clearly and handle zero applications safely.

---

# 9. Cold Outreach — Initial Interface

Create:

`app/dashboard/outreach/page.tsx`

For this phase, build the frontend and database structure.

Features:

- Add recipients manually.
- Upload a CSV recipient list.
- Create email templates.
- Preview personalized emails.
- Manage do-not-contact recipients.
- View sent email history.
- Display remaining weekly/daily email limits.

Recipient fields:

- Name.
- Email.
- Company.
- Job title.
- LinkedIn URL.
- Notes.

Do not connect Gmail or send real emails yet.

Display a Coming Soon label for the actual sending integration.

Do not build a founder database.

---

# 10. Follow-up Management

Create:

`app/dashboard/follow-ups/page.tsx`

For this phase:

- Display applications marked No reply.
- Display follow-up due dates.
- Allow users to create manual reminders.
- Allow users to mark reminders completed.
- Stop showing follow-ups for Rejected or Hired applications.

Do not automatically send follow-up emails yet.

Future automatic follow-ups must require confirmation before each send.

---

# 11. Subscription Management

Create:

`app/dashboard/subscription/page.tsx`

Display:

- Current plan.
- Plan features.
- Daily application limit.
- Email limit.
- AI tailoring availability.
- Upgrade options.

Plans:

Free — $0/month.

Basic — $9/month.

Pro — $19/month.

Do not integrate payment processing in this phase.

Create the structure needed for future Merchant of Record integration.

Important:

Subscription restrictions must be enforced on the server and in database-backed operations, not merely hidden in the UI.

Do not allow users to upgrade by modifying browser state or sending a custom plan value.

---

# 12. Usage Limit Enforcement

Implement a reliable usage tracking system.

Requirements:

- Daily application limits.
- Daily email limits where applicable.
- Weekly email limits for Free.
- Daily AI tailoring soft limit.
- Server-side enforcement.
- Correct timezone handling.
- Clear limit-exceeded messages.

Limits:

| Plan | Applications/day | Emails |
|---|---:|---:|
| Free | 3 | 5/week |
| Basic | 10 | 15/day |
| Pro | 20 | 20/day |

For the initial phase, application records and outreach drafts can be created without pretending that an actual application or email was sent.

Only count completed actions as sent.

Use atomic or transaction-safe operations for enforcing limits to avoid concurrent requests exceeding plan limits.

---

# 13. Additional UI Requirements

Every dashboard page must include:

- Consistent header.
- Consistent sidebar.
- Loading states.
- Error states.
- Empty states.
- Responsive layouts.
- Accessible forms.
- Toast notifications.
- Confirmation dialogs for destructive actions.

Use shadcn/ui components wherever appropriate.

Use Lucide icons.

Do not create buttons that do nothing.

Do not display fake progress bars or fake analytics.

---

# 14. Development Order

Implement the following sequence.

**Phase A: Dashboard Foundation**
- Dashboard layout.
- Sidebar.
- Header.
- Authentication integration.
- Welcome section.
- Statistics.
- Empty states.

**Phase B: Database**
- Supabase migrations.
- Tables.
- RLS policies.
- Profile trigger.
- Database types.

**Phase C: User Profile**
- Profile forms.
- Save functionality.
- Data retrieval.

**Phase D: Resume Builder**
- Resume editor.
- Templates.
- Live preview.
- Supabase persistence.
- PDF export.

**Phase E: AI Resume Tailoring**
- Job description input.
- AI integration.
- Resume versioning.
- Paid plan enforcement.

**Phase F: Application Tracker**
- Create applications.
- Update statuses.
- Filters.
- Statistics.

**Phase G: Outreach and Follow-ups**
- Recipient management.
- CSV import.
- Email templates.
- Follow-up reminders.

**Phase H: Subscription Interface**
- Plan display.
- Usage information.
- Upgrade interface.

Complete and test each phase before moving forward.

---

# 15. Testing Requirements

Test the following:

Authentication:
- Existing users can log in.
- Logged-out users cannot access protected dashboard pages.
- Users can log out.
- User sessions persist correctly.

Profile:
- Users can create profiles.
- Users can update profiles.
- Users cannot access other users' profiles.

Resume Builder:
- Users can create resumes.
- Users can edit resumes.
- Users can delete resumes.
- Resume data persists after refreshing.
- PDF export works.
- Multiple templates render correctly.

AI:
- Free users cannot access paid tailoring.
- AI output preserves factual information.
- Tailored versions are saved.

Tracker:
- Applications can be created.
- Statuses can be updated.
- Statistics match database records.
- Users cannot access another user's applications.

Security:
- RLS policies work.
- API keys are protected.
- Server-side plan verification works.
- Usage limits cannot be bypassed through client-side requests.

Finally:

Run:

```bash
npx tsc --noEmit
npm run build
```

Fix all errors before declaring completion.

---

# 16. Final Instructions

Work directly in the existing Octo.tech repository.

Do not recreate the landing page.

Do not break existing Supabase authentication.

Do not replace working code unnecessarily.

Do not implement all features in one enormous component.

Do not use mock data where real database data is expected.

Do not pretend AI, Gmail, payments or job applications work without actual integrations.

If credentials or external services are unavailable, clearly identify the missing configuration and continue with the parts that can genuinely be implemented.

At the end, provide:

1. Files created.
2. Files modified.
3. Database migrations created.
4. Dependencies installed.
5. Features completed.
6. Features requiring API credentials.
7. Security measures implemented.
8. Tests performed.
9. Remaining issues.

**Final objective:**

Turn Octo.tech from a landing page into a functional SaaS application with a real user dashboard, persistent Supabase data, a professional resume builder, PDF export, an application tracker and a foundation for AI-powered job-search automation.

Build systematically. Prioritize functionality, security and quality over the number of features.