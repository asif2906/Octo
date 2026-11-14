-- Octo.tech Persistent Auto-Apply, Job Collection & Cold Approach Schema
-- Idempotent, isolated per user, full RLS enabled

-- Ensure certifications RLS is enabled
alter table if exists public.certifications enable row level security;
drop policy if exists "Users manage own certifications" on public.certifications;
create policy "Users manage own certifications" on public.certifications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 1. Auto-Apply Configurations
create table if not exists public.auto_apply_configurations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_roles text[] not null default array[]::text[],
  locations text[] not null default array[]::text[],
  filters jsonb not null default '{}'::jsonb,
  daily_target integer not null default 10 check (daily_target >= 1 and daily_target <= 50),
  plan_daily_limit integer not null default 10 check (plan_daily_limit >= 1 and plan_daily_limit <= 50),
  duration_days integer not null default 30 check (duration_days in (1, 7, 14, 21, 30)),
  start_at timestamptz not null default now(),
  expires_at timestamptz not null,
  timezone text not null default 'UTC',
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'running', 'paused', 'completed', 'stopped', 'failed', 'expired')),
  selected_resume_id uuid references public.resumes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_auto_apply_config_user on public.auto_apply_configurations(user_id);
create index if not exists idx_auto_apply_config_status on public.auto_apply_configurations(status);
create index if not exists idx_auto_apply_config_expires on public.auto_apply_configurations(expires_at);

alter table public.auto_apply_configurations enable row level security;
drop policy if exists "Users manage own auto apply configs" on public.auto_apply_configurations;
create policy "Users manage own auto apply configs" on public.auto_apply_configurations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 2. Auto-Apply Execution Runs
create table if not exists public.auto_apply_runs (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.auto_apply_configurations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_date date not null default current_date,
  successful_submissions integer not null default 0,
  failed_attempts integer not null default 0,
  status text not null default 'completed' check (status in ('pending', 'running', 'completed', 'failed', 'partial')),
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auto_apply_runs_config on public.auto_apply_runs(config_id);
create index if not exists idx_auto_apply_runs_user_date on public.auto_apply_runs(user_id, run_date);

alter table public.auto_apply_runs enable row level security;
drop policy if exists "Users manage own auto apply runs" on public.auto_apply_runs;
create policy "Users manage own auto apply runs" on public.auto_apply_runs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 3. Auto-Apply Run Items (Individual Applications per Run)
create table if not exists public.auto_apply_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.auto_apply_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_postings(id) on delete set null,
  job_title text not null,
  company text not null,
  source text default 'catalog',
  apply_url text,
  status text not null default 'evaluating' check (status in ('discovered', 'evaluating', 'rejected_by_filters', 'preparing', 'ready_for_submission', 'submitted', 'submission_failed', 'needs_manual_action', 'duplicate', 'expired')),
  tailored_resume_id uuid references public.resumes(id) on delete set null,
  cover_letter_id uuid references public.cover_letters(id) on delete set null,
  match_score integer,
  notes text,
  error_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_auto_apply_run_items_user on public.auto_apply_run_items(user_id);
create index if not exists idx_auto_apply_run_items_status on public.auto_apply_run_items(status);
create index if not exists idx_auto_apply_run_items_job on public.auto_apply_run_items(user_id, job_id);

alter table public.auto_apply_run_items enable row level security;
drop policy if exists "Users manage own auto apply run items" on public.auto_apply_run_items;
create policy "Users manage own auto apply run items" on public.auto_apply_run_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Cold Approach Campaigns
create table if not exists public.cold_approach_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_roles text[] not null default array[]::text[],
  target_locations text[] not null default array[]::text[],
  daily_target integer not null default 15 check (daily_target >= 1 and daily_target <= 50),
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'completed', 'stopped')),
  sender_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cold_campaigns_user on public.cold_approach_campaigns(user_id);

alter table public.cold_approach_campaigns enable row level security;
drop policy if exists "Users manage own cold campaigns" on public.cold_approach_campaigns;
create policy "Users manage own cold campaigns" on public.cold_approach_campaigns
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. Cold Approach Contacts
create table if not exists public.cold_approach_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.cold_approach_campaigns(id) on delete cascade,
  company_name text not null,
  company_domain text not null,
  contact_name text,
  contact_email text not null,
  contact_role text,
  source_url text not null,
  verification_status text not null default 'verified' check (verification_status in ('verified', 'unverified', 'failed')),
  outreach_status text not null default 'pending' check (outreach_status in ('pending', 'generated', 'approved', 'sent', 'failed', 'bounced', 'suppressed')),
  email_subject text,
  email_body text,
  sent_at timestamptz,
  error_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cold_contacts_user on public.cold_approach_contacts(user_id);
create index if not exists idx_cold_contacts_campaign on public.cold_approach_contacts(campaign_id);
create index if not exists idx_cold_contacts_status on public.cold_approach_contacts(outreach_status);

alter table public.cold_approach_contacts enable row level security;
drop policy if exists "Users manage own cold contacts" on public.cold_approach_contacts;
create policy "Users manage own cold contacts" on public.cold_approach_contacts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 6. Contact Suppression List
create table if not exists public.contact_suppression_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  reason text not null default 'user_suppressed',
  created_at timestamptz not null default now(),
  constraint uq_user_suppressed_email unique (user_id, email)
);

create index if not exists idx_suppression_user_email on public.contact_suppression_list(user_id, email);

alter table public.contact_suppression_list enable row level security;
drop policy if exists "Users manage own suppression list" on public.contact_suppression_list;
create policy "Users manage own suppression list" on public.contact_suppression_list
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 7. AI Usage Logs
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  status text not null default 'success',
  latency_ms integer default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user on public.ai_usage_logs(user_id);
create index if not exists idx_ai_usage_feature on public.ai_usage_logs(feature);
create index if not exists idx_ai_usage_created on public.ai_usage_logs(created_at desc);

alter table public.ai_usage_logs enable row level security;
drop policy if exists "Users view own ai usage" on public.ai_usage_logs;
create policy "Users view own ai usage" on public.ai_usage_logs
  for select to authenticated
  using ((select auth.uid()) = user_id);
