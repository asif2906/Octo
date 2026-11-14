-- Octo.tech Comprehensive Feature Expansion Migration
-- Idempotent, isolated per user, full RLS enabled

-- 1. Career Profile Extensions
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text not null,
  issue_date text,
  expiration_date text,
  credential_id text,
  credential_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.certifications enable row level security;
drop policy if exists "Users manage own certifications" on public.certifications;
create policy "Users manage own certifications" on public.certifications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null,
  proficiency text not null default 'Professional',
  created_at timestamptz not null default now()
);
alter table public.languages enable row level security;
drop policy if exists "Users manage own languages" on public.languages;
create policy "Users manage own languages" on public.languages
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  publisher text,
  publication_date text,
  url text,
  description text,
  created_at timestamptz not null default now()
);
alter table public.publications enable row level security;
drop policy if exists "Users manage own publications" on public.publications;
create policy "Users manage own publications" on public.publications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  relationship text,
  company text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
alter table public.references enable row level security;
drop policy if exists "Users manage own references" on public.references;
create policy "Users manage own references" on public.references
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.volunteering (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization text not null,
  role text not null,
  start_date text,
  end_date text,
  currently_volunteering boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);
alter table public.volunteering enable row level security;
drop policy if exists "Users manage own volunteering" on public.volunteering;
create policy "Users manage own volunteering" on public.volunteering
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.custom_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_title text not null,
  items jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.custom_sections enable row level security;
drop policy if exists "Users manage own custom sections" on public.custom_sections;
create policy "Users manage own custom sections" on public.custom_sections
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 2. Job Discovery & Startup Discovery
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null default 'manual',
  title text not null,
  company text not null,
  location text,
  is_remote boolean not null default false,
  employment_type text default 'Full-time',
  experience_level text,
  description text not null,
  salary_range text,
  apply_url text,
  company_url text,
  skills_required text[] default array[]::text[],
  is_startup boolean not null default false,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_job_posting_external unique (source, external_id)
);
create index if not exists idx_job_postings_source on public.job_postings(source);
create index if not exists idx_job_postings_startup on public.job_postings(is_startup);
create index if not exists idx_job_postings_remote on public.job_postings(is_remote);
create index if not exists idx_job_postings_posted_at on public.job_postings(posted_at desc);

alter table public.job_postings enable row level security;
drop policy if exists "Anyone authenticated can view job postings" on public.job_postings;
create policy "Anyone authenticated can view job postings" on public.job_postings
  for select to authenticated using (true);
drop policy if exists "Users can add manual job postings" on public.job_postings;
create policy "Users can add manual job postings" on public.job_postings
  for insert to authenticated with check (source = 'manual');

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  status text not null default 'saved', -- 'saved' | 'dismissed' | 'applied'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_saved_job unique (user_id, job_posting_id)
);
alter table public.saved_jobs enable row level security;
drop policy if exists "Users manage own saved jobs" on public.saved_jobs;
create policy "Users manage own saved jobs" on public.saved_jobs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.job_match_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  matching_skills text[] default array[]::text[],
  missing_skills text[] default array[]::text[],
  reasoning text,
  created_at timestamptz not null default now(),
  constraint uq_user_job_match unique (user_id, job_posting_id)
);
alter table public.job_match_scores enable row level security;
drop policy if exists "Users view own match scores" on public.job_match_scores;
create policy "Users view own match scores" on public.job_match_scores
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 3. Job Search Agent
create table if not exists public.job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role_query text not null,
  location_query text,
  is_remote boolean not null default false,
  skills_filter text[] default array[]::text[],
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.job_searches enable row level security;
drop policy if exists "Users manage own job searches" on public.job_searches;
create policy "Users manage own job searches" on public.job_searches
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Cover Letters & Document History
create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Cover Letter',
  job_title text,
  company text,
  recipient_name text,
  job_description text,
  tone text not null default 'Professional',
  language text not null default 'English',
  content text not null default '',
  resume_id uuid references public.resumes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cover_letters enable row level security;
drop policy if exists "Users manage own cover letters" on public.cover_letters;
create policy "Users manage own cover letters" on public.cover_letters
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.cover_letter_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cover_letter_id uuid not null references public.cover_letters(id) on delete cascade,
  version_number integer not null default 1,
  content text not null,
  prompt_used text,
  created_at timestamptz not null default now()
);
alter table public.cover_letter_versions enable row level security;
drop policy if exists "Users manage own cover letter versions" on public.cover_letter_versions;
create policy "Users manage own cover letter versions" on public.cover_letter_versions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. Interviews & Preparation
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  company text not null,
  position text not null,
  interview_date timestamptz not null,
  round_type text not null default 'Technical', -- 'Screening' | 'Technical' | 'Behavioral' | 'System Design' | 'Final'
  location_or_link text,
  notes text,
  prep_questions jsonb default '[]'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.interviews enable row level security;
drop policy if exists "Users manage own interviews" on public.interviews;
create policy "Users manage own interviews" on public.interviews
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 6. Add theme configuration to resumes if not present
alter table public.resumes
  add column if not exists theme_config jsonb default '{"theme":"modern","primaryColor":"#0f172a","fontSize":"medium","spacing":"normal","fontFamily":"inter","margins":"normal"}'::jsonb;
