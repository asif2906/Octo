-- Octo.tech Phase 3 Schema: Dodo Payments, Subscription Lifecycle, Payment History & Webhooks
-- Safe and idempotent to run in Supabase SQL Editor

-- 1. Extend public.subscriptions for Dodo Payments
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check,
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add column if not exists dodo_customer_id text,
  add column if not exists dodo_subscription_id text,
  add column if not exists dodo_product_id text,
  add column if not exists billing_interval text,
  add column if not exists cancelled_at timestamptz;

-- Update plan check to lite, basic, pro (null allowed when user is registered but has not subscribed yet)
alter table public.subscriptions
  alter column plan drop not null,
  alter column plan drop default;

-- Migrate any legacy 'free' subscriptions to pending with no active plan
update public.subscriptions
  set plan = null, status = 'pending'
  where plan = 'free' or plan not in ('lite', 'basic', 'pro');

alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('lite', 'basic', 'pro') or plan is null);

-- Expand status check to match Dodo Payments subscription lifecycle
alter table public.subscriptions
  add constraint subscriptions_status_check check (status in ('active', 'on_hold', 'cancelled', 'expired', 'past_due', 'pending', 'paused'));

-- Indexes for fast lookup by Dodo identifiers
create index if not exists subscriptions_dodo_sub_id_idx on public.subscriptions (dodo_subscription_id);
create index if not exists subscriptions_dodo_cust_id_idx on public.subscriptions (dodo_customer_id);

-- 2. Payment History table
create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dodo_payment_id text not null unique,
  dodo_subscription_id text,
  amount numeric not null,
  currency text not null default 'USD',
  payment_status text not null,
  payment_type text,
  created_at timestamptz not null default now()
);

create index if not exists payment_history_user_idx on public.payment_history (user_id, created_at desc);
create index if not exists payment_history_dodo_payment_idx on public.payment_history (dodo_payment_id);

alter table public.payment_history enable row level security;

drop policy if exists "Users can read own payment history" on public.payment_history;
create policy "Users can read own payment history"
  on public.payment_history for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Dodo Webhook Events (for strict idempotency & out-of-order protection)
create table if not exists public.dodo_webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_id text not null unique,
  event_type text not null,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dodo_webhooks_id_idx on public.dodo_webhook_events (webhook_id);

alter table public.dodo_webhook_events enable row level security;
-- Webhooks are server-only; no client access allowed

-- 4. Update table grants
grant select on public.payment_history to authenticated;
revoke all on public.dodo_webhook_events from anon, authenticated;

-- 5. Update auth signup trigger: New users get a 'pending' subscription record without an active plan
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
  values (new.id, null, 'pending')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 6. Helper to check if a user currently has active paid access
create or replace function private.user_has_active_subscription(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rec record;
begin
  select s.status, s.current_period_end into v_rec
  from public.subscriptions s
  where s.user_id = p_user_id;

  if not found then
    return false;
  end if;

  if v_rec.status = 'active' then
    return true;
  end if;

  -- Cancelled but still within paid period
  if v_rec.status = 'cancelled' and v_rec.current_period_end is not null and v_rec.current_period_end > now() then
    return true;
  end if;

  return false;
end;
$$;

-- 7. Update limit helpers and triggers for Phase 3 tiers (Lite: 5, Basic: 10, Pro: 20)
create or replace function private.get_user_plan(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_status text;
  v_end timestamptz;
begin
  select s.plan, s.status, s.current_period_end into v_plan, v_status, v_end
  from public.subscriptions s
  where s.user_id = p_user_id;

  if v_plan is null then
    return null;
  end if;

  if v_status = 'active' then
    return v_plan;
  end if;

  if v_status = 'cancelled' and v_end is not null and v_end > now() then
    return v_plan;
  end if;

  return null;
end;
$$;

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
  if v_plan is null then
    raise exception 'SUBSCRIPTION_REQUIRED: An active subscription is required to log applications.'
      using errcode = 'P0001';
  end if;

  v_tz := private.resolve_user_timezone(new.user_id);

  v_limit := case v_plan
    when 'pro' then 20
    when 'basic' then 10
    when 'lite' then 5
    else 0
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
  if v_plan is null then
    raise exception 'SUBSCRIPTION_REQUIRED: An active subscription is required to send cold outreach.'
      using errcode = 'P0001';
  end if;

  v_tz := private.resolve_user_timezone(new.user_id);

  v_limit := case v_plan
    when 'pro' then 20
    when 'basic' then 15
    when 'lite' then 5
    else 0
  end;

  select count(*)::integer into v_used
  from public.usage_events u
  where u.user_id = new.user_id
    and u.action_type = 'cold_email'
    and (u.created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;

  if v_used >= v_limit then
    raise exception 'LIMIT_EXCEEDED: Cold email limit (% per day on the % plan) reached for today.', v_limit, initcap(v_plan)
      using errcode = 'P0001';
  end if;

  insert into public.usage_events (user_id, action_type, reference_id)
  values (new.user_id, 'cold_email', new.id);

  return new;
end;
$$;

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
  if v_plan is null then
    raise exception 'SUBSCRIPTION_REQUIRED: An active subscription is required to use AI Resume Tailoring.' using errcode = 'P0001';
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
