-- Octo.tech Phase 4: Final Pricing (Basic & Pro), Entitlements, and Plan Constraints
-- Safe and idempotent to run in Supabase

-- 1. Update plan check constraint to only allow 'basic', 'pro', or null
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

update public.subscriptions
  set plan = null, status = 'pending'
  where plan is not null and plan not in ('basic', 'pro');

alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('basic', 'pro') or plan is null);

-- 2. Update Application Daily Limit (Basic: 10, Pro: 20)
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

-- 3. Update Cold Outreach Send Limit (Basic: 15, Pro: 20)
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

-- 4. Update AI Resume Tailoring Limit (Basic: 20, Pro: 40 higher fair use)
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
  v_limit integer;
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

  v_limit := case v_plan
    when 'pro' then 40
    when 'basic' then 20
    else 0
  end;

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

