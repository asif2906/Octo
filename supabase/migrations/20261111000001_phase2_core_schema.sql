-- Octo.tech Phase 2 Core Schema, RLS Policies, Triggers & Atomic Usage Enforcement
-- Safe to run multiple times (idempotent) in Supabase SQL Editor or via Supabase CLI migrations.

-- 1. Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  headline text,
  professional_summary text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- 3. Subscriptions (server-managed plan state; read-only for authenticated users)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'basic', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  billing_provider text,
  external_customer_id text,
  external_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Education
create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution text not null,
  degree text not null,
  field_of_study text,
  start_date text,
  end_date text,
  grade text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists education_user_created_idx on public.education (user_id, created_at desc);

alter table public.education enable row level security;

drop policy if exists "Users can read own education" on public.education;
create policy "Users can read own education"
  on public.education for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own education" on public.education;
create policy "Users can insert own education"
  on public.education for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own education" on public.education;
create policy "Users can update own education"
  on public.education for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own education" on public.education;
create policy "Users can delete own education"
  on public.education for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Experience
create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  job_title text not null,
  employment_type text,
  location text,
  start_date text,
  end_date text,
  currently_working boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists experience_user_created_idx on public.experience (user_id, created_at desc);

alter table public.experience enable row level security;

drop policy if exists "Users can read own experience" on public.experience;
create policy "Users can read own experience"
  on public.experience for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own experience" on public.experience;
create policy "Users can insert own experience"
  on public.experience for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own experience" on public.experience;
create policy "Users can update own experience"
  on public.experience for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own experience" on public.experience;
create policy "Users can delete own experience"
  on public.experience for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 6. Skills
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  proficiency text,
  created_at timestamptz not null default now()
);

create index if not exists skills_user_created_idx on public.skills (user_id, created_at desc);

alter table public.skills enable row level security;

drop policy if exists "Users can read own skills" on public.skills;
create policy "Users can read own skills"
  on public.skills for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own skills" on public.skills;
create policy "Users can insert own skills"
  on public.skills for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own skills" on public.skills;
create policy "Users can update own skills"
  on public.skills for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own skills" on public.skills;
create policy "Users can delete own skills"
  on public.skills for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 7. Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  description text,
  technologies text[] not null default '{}',
  project_url text,
  github_url text,
  start_date text,
  end_date text,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_created_idx on public.projects (user_id, created_at desc);

alter table public.projects enable row level security;

drop policy if exists "Users can read own projects" on public.projects;
create policy "Users can read own projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 8. Resumes
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  template text not null default 'modern-professional' check (template in ('modern-professional', 'minimal-ats', 'classic-professional')),
  content jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_created_idx on public.resumes (user_id, created_at desc);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;

drop policy if exists "Users can read own resumes" on public.resumes;
create policy "Users can read own resumes"
  on public.resumes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own resumes" on public.resumes;
create policy "Users can insert own resumes"
  on public.resumes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own resumes" on public.resumes;
create policy "Users can update own resumes"
  on public.resumes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own resumes" on public.resumes;
create policy "Users can delete own resumes"
  on public.resumes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 9. Resume Versions (AI-tailored versions)
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  job_title text,
  company text,
  job_description text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resume_versions_user_created_idx on public.resume_versions (user_id, created_at desc);
create index if not exists resume_versions_resume_id_idx on public.resume_versions (resume_id);

alter table public.resume_versions enable row level security;

drop policy if exists "Users can read own resume versions" on public.resume_versions;
create policy "Users can read own resume versions"
  on public.resume_versions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own resume versions" on public.resume_versions;
create policy "Users can insert own resume versions"
  on public.resume_versions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own resume versions" on public.resume_versions;
create policy "Users can update own resume versions"
  on public.resume_versions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own resume versions" on public.resume_versions;
create policy "Users can delete own resume versions"
  on public.resume_versions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 10. Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  job_title text not null,
  job_url text,
  location text,
  job_description text,
  resume_id uuid references public.resumes(id) on delete set null,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  application_date date not null default current_date,
  status text not null default 'no_reply' check (status in ('no_reply', 'rejected', 'hired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_created_idx on public.applications (user_id, created_at desc);
create index if not exists applications_user_status_idx on public.applications (user_id, status);
create index if not exists applications_resume_id_idx on public.applications (resume_id);
create index if not exists applications_resume_version_id_idx on public.applications (resume_version_id);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

drop policy if exists "Users can read own applications" on public.applications;
create policy "Users can read own applications"
  on public.applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own applications" on public.applications;
create policy "Users can insert own applications"
  on public.applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own applications" on public.applications;
create policy "Users can update own applications"
  on public.applications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own applications" on public.applications;
create policy "Users can delete own applications"
  on public.applications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 11. Activity Logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_created_idx on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists "Users can read own activity logs" on public.activity_logs;
create policy "Users can read own activity logs"
  on public.activity_logs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own activity logs" on public.activity_logs;
create policy "Users can insert own activity logs"
  on public.activity_logs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own activity logs" on public.activity_logs;
create policy "Users can delete own activity logs"
  on public.activity_logs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 12. Outreach Recipients
create table if not exists public.outreach_recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  job_title text,
  linkedin_url text,
  notes text,
  do_not_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_recipients_user_created_idx on public.outreach_recipients (user_id, created_at desc);

drop trigger if exists outreach_recipients_set_updated_at on public.outreach_recipients;
create trigger outreach_recipients_set_updated_at
  before update on public.outreach_recipients
  for each row execute function public.set_updated_at();

alter table public.outreach_recipients enable row level security;

drop policy if exists "Users can read own outreach recipients" on public.outreach_recipients;
create policy "Users can read own outreach recipients"
  on public.outreach_recipients for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own outreach recipients" on public.outreach_recipients;
create policy "Users can insert own outreach recipients"
  on public.outreach_recipients for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own outreach recipients" on public.outreach_recipients;
create policy "Users can update own outreach recipients"
  on public.outreach_recipients for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own outreach recipients" on public.outreach_recipients;
create policy "Users can delete own outreach recipients"
  on public.outreach_recipients for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 13. Email Templates
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_templates_user_created_idx on public.email_templates (user_id, created_at desc);

drop trigger if exists email_templates_set_updated_at on public.email_templates;
create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

alter table public.email_templates enable row level security;

drop policy if exists "Users can read own email templates" on public.email_templates;
create policy "Users can read own email templates"
  on public.email_templates for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own email templates" on public.email_templates;
create policy "Users can insert own email templates"
  on public.email_templates for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own email templates" on public.email_templates;
create policy "Users can update own email templates"
  on public.email_templates for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own email templates" on public.email_templates;
create policy "Users can delete own email templates"
  on public.email_templates for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 14. Outreach Messages (drafts & sent history; only status = 'sent' counts toward limits)
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references public.outreach_recipients(id) on delete set null,
  template_id uuid references public.email_templates(id) on delete set null,
  recipient_name text not null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists outreach_messages_user_created_idx on public.outreach_messages (user_id, created_at desc);
create index if not exists outreach_messages_recipient_id_idx on public.outreach_messages (recipient_id);
create index if not exists outreach_messages_template_id_idx on public.outreach_messages (template_id);

alter table public.outreach_messages enable row level security;

drop policy if exists "Users can read own outreach messages" on public.outreach_messages;
create policy "Users can read own outreach messages"
  on public.outreach_messages for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own outreach messages" on public.outreach_messages;
create policy "Users can insert own outreach messages"
  on public.outreach_messages for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own outreach messages" on public.outreach_messages;
create policy "Users can update own outreach messages"
  on public.outreach_messages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own outreach messages" on public.outreach_messages;
create policy "Users can delete own outreach messages"
  on public.outreach_messages for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 15. Follow-up Reminders
create table if not exists public.follow_up_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  due_date date not null,
  note text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists follow_up_reminders_user_due_idx on public.follow_up_reminders (user_id, due_date asc);
create index if not exists follow_up_reminders_application_id_idx on public.follow_up_reminders (application_id);

drop trigger if exists follow_up_reminders_set_updated_at on public.follow_up_reminders;
create trigger follow_up_reminders_set_updated_at
  before update on public.follow_up_reminders
  for each row execute function public.set_updated_at();

alter table public.follow_up_reminders enable row level security;

drop policy if exists "Users can read own follow up reminders" on public.follow_up_reminders;
create policy "Users can read own follow up reminders"
  on public.follow_up_reminders for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own follow up reminders" on public.follow_up_reminders;
create policy "Users can insert own follow up reminders"
  on public.follow_up_reminders for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.applications a
      where a.id = application_id
        and a.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own follow up reminders" on public.follow_up_reminders;
create policy "Users can update own follow up reminders"
  on public.follow_up_reminders for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.applications a
      where a.id = application_id
        and a.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete own follow up reminders" on public.follow_up_reminders;
create policy "Users can delete own follow up reminders"
  on public.follow_up_reminders for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 16. Usage Events (append-only via triggers/RPC; read-only for authenticated users)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('application', 'cold_email', 'ai_tailor')),
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_action_created_idx
  on public.usage_events (user_id, action_type, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "Users can read own usage events" on public.usage_events;
create policy "Users can read own usage events"
  on public.usage_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit least-privilege table grants for Supabase Data API
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.education,
  public.experience,
  public.skills,
  public.projects,
  public.resumes,
  public.resume_versions,
  public.applications,
  public.outreach_recipients,
  public.email_templates,
  public.outreach_messages,
  public.follow_up_reminders
to authenticated;
grant select, insert, delete on public.activity_logs to authenticated;
grant select on public.subscriptions, public.usage_events to authenticated;
revoke all on
  public.profiles,
  public.subscriptions,
  public.education,
  public.experience,
  public.skills,
  public.projects,
  public.resumes,
  public.resume_versions,
  public.applications,
  public.activity_logs,
  public.outreach_recipients,
  public.email_templates,
  public.outreach_messages,
  public.follow_up_reminders,
  public.usage_events
from anon;

-- 17. Auto-create profile & free subscription on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles and free subscriptions for existing registered users
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.email
from auth.users u
on conflict (id) do nothing;

insert into public.subscriptions (user_id, plan, status)
select u.id, 'free', 'active'
from auth.users u
on conflict (user_id) do nothing;

-- 18. Private schema helpers for atomic timezone-aware limit enforcement
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.resolve_user_timezone(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
begin
  select p.timezone into v_tz
  from public.profiles p
  where p.id = p_user_id;

  if v_tz is not null and exists (
    select 1 from pg_catalog.pg_timezone_names where name = v_tz
  ) then
    return v_tz;
  end if;

  return 'UTC';
end;
$$;

create or replace function private.get_user_plan(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
begin
  select s.plan into v_plan
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.status in ('active', 'trialing');

  return coalesce(v_plan, 'free');
end;
$$;

-- 19. Atomic application daily limit enforcement trigger
create or replace function public.enforce_application_daily_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_tz text;
  v_limit integer;
  v_used integer;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.user_id::text || ':application'));

  v_plan := private.get_user_plan(new.user_id);
  v_tz := private.resolve_user_timezone(new.user_id);

  v_limit := case v_plan
    when 'pro' then 20
    when 'basic' then 10
    else 3
  end;

  select count(*)::integer into v_used
  from public.usage_events u
  where u.user_id = new.user_id
    and u.action_type = 'application'
    and (u.created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;

  if v_used >= v_limit then
    raise exception 'LIMIT_EXCEEDED: Daily application limit (% per day on the % plan) reached for today.', v_limit, initcap(v_plan)
      using errcode = 'P0001';
  end if;

  insert into public.usage_events (user_id, action_type, reference_id)
  values (new.user_id, 'application', new.id);

  return new;
end;
$$;

revoke execute on function public.enforce_application_daily_limit() from public, anon, authenticated;

drop trigger if exists applications_enforce_daily_limit on public.applications;
create trigger applications_enforce_daily_limit
  before insert on public.applications
  for each row execute function public.enforce_application_daily_limit();

-- 20. Atomic cold email send limit enforcement trigger (counts completed 'sent' records only)
create or replace function public.enforce_outreach_send_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_tz text;
  v_limit integer;
  v_used integer;
  v_period_label text;
begin
  if new.status <> 'sent' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'sent' then
    return new;
  end if;

  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.user_id::text || ':cold_email'));

  v_plan := private.get_user_plan(new.user_id);
  v_tz := private.resolve_user_timezone(new.user_id);

  if v_plan = 'pro' then
    v_limit := 20;
    v_period_label := 'day';
    select count(*)::integer into v_used
    from public.usage_events u
    where u.user_id = new.user_id
      and u.action_type = 'cold_email'
      and (u.created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;
  elsif v_plan = 'basic' then
    v_limit := 15;
    v_period_label := 'day';
    select count(*)::integer into v_used
    from public.usage_events u
    where u.user_id = new.user_id
      and u.action_type = 'cold_email'
      and (u.created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;
  else
    v_limit := 5;
    v_period_label := 'week';
    select count(*)::integer into v_used
    from public.usage_events u
    where u.user_id = new.user_id
      and u.action_type = 'cold_email'
      and pg_catalog.date_trunc('week', u.created_at at time zone v_tz) = pg_catalog.date_trunc('week', now() at time zone v_tz);
  end if;

  if v_used >= v_limit then
    raise exception 'LIMIT_EXCEEDED: Cold email limit (% per % on the % plan) reached.', v_limit, v_period_label, initcap(v_plan)
      using errcode = 'P0001';
  end if;

  insert into public.usage_events (user_id, action_type, reference_id)
  values (new.user_id, 'cold_email', new.id);

  return new;
end;
$$;

revoke execute on function public.enforce_outreach_send_limit() from public, anon, authenticated;

drop trigger if exists outreach_messages_enforce_send_limit on public.outreach_messages;
create trigger outreach_messages_enforce_send_limit
  before insert or update on public.outreach_messages
  for each row execute function public.enforce_outreach_send_limit();

-- 21. Atomic AI tailoring quota check & consumption RPC (paid plans only, 20/day soft limit)
drop function if exists public.consume_ai_tailor_quota();
drop function if exists public.consume_ai_tailor_quota(uuid);

create or replace function public.consume_ai_tailor_quota(p_reference_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_plan text;
  v_tz text;
  v_used integer;
  v_limit integer := 20;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required.' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user_id::text || ':ai_tailor'));

  v_plan := private.get_user_plan(v_user_id);
  if v_plan not in ('basic', 'pro') then
    raise exception 'PLAN_REQUIRED: AI Resume Tailoring is available on Basic and Pro plans.' using errcode = 'P0001';
  end if;

  v_tz := private.resolve_user_timezone(v_user_id);

  select count(*)::integer into v_used
  from public.usage_events u
  where u.user_id = v_user_id
    and u.action_type = 'ai_tailor'
    and (u.created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;

  if v_used >= v_limit then
    raise exception 'LIMIT_EXCEEDED: Daily AI tailoring limit (% requests per day) reached for today.', v_limit
      using errcode = 'P0001';
  end if;

  insert into public.usage_events (user_id, action_type, reference_id)
  values (v_user_id, 'ai_tailor', p_reference_id);

  return jsonb_build_object(
    'allowed', true,
    'plan', v_plan,
    'used_today', v_used + 1,
    'limit', v_limit
  );
end;
$$;

revoke execute on function public.consume_ai_tailor_quota(uuid) from public, anon;
grant execute on function public.consume_ai_tailor_quota(uuid) to authenticated;
