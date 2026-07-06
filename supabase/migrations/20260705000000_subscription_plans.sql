-- ============================================================
-- Subscription plans — Free / Pro / Max
--
-- Standalone: matches the LIVE database schema (no tenants table
-- required). Stores the store's current plan in a singleton table
-- and enforces each plan's product limit with a database trigger,
-- so the limit holds even if the client is bypassed.
--
-- Plans:                    products
--   free   $0    /month         50
--   pro    $55   /month        500
--   max    $149  /month   unlimited
--
-- To upgrade a store after payment is received, run:
--   update public.store_subscription
--      set plan = 'pro', renews_at = now() + interval '30 days',
--          updated_at = now();
-- ============================================================

-- 1. Singleton table holding the store's current plan ------------------------
create table if not exists public.store_subscription (
  id         boolean primary key default true check (id),
  plan       text not null default 'free' check (plan in ('free', 'pro', 'max')),
  renews_at  timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.store_subscription (id) values (true)
on conflict (id) do nothing;

alter table public.store_subscription enable row level security;

drop policy if exists "authenticated read subscription" on public.store_subscription;
create policy "authenticated read subscription" on public.store_subscription
  for select to authenticated using (true);

-- No insert/update/delete policies on purpose: the plan is changed only by
-- the platform operator (Supabase SQL editor / service role) after payment.
grant select on public.store_subscription to authenticated;

-- 2. Product limit per plan (null = unlimited) --------------------------------
create or replace function public.plan_product_limit(p_plan text)
returns integer
language sql immutable as $$
  select case p_plan
    when 'free' then 50
    when 'pro'  then 500
    else null
  end;
$$;

-- 3. Hard enforcement at the database level ------------------------------------
create or replace function public.enforce_product_limit()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_plan  text;
  v_limit integer;
  v_count integer;
begin
  select plan into v_plan from public.store_subscription limit 1;
  v_limit := public.plan_product_limit(coalesce(v_plan, 'free'));
  if v_limit is null then
    return new; -- unlimited plan
  end if;

  select count(*) into v_count from public.products;
  if v_count >= v_limit then
    raise exception
      'Plan limit reached: the % plan allows up to % products. Upgrade your plan to add more.',
      coalesce(v_plan, 'free'), v_limit;
  end if;
  return new;
end $$;

drop trigger if exists products_enforce_plan_limit on public.products;
create trigger products_enforce_plan_limit
  before insert on public.products
  for each row execute function public.enforce_product_limit();
