-- ============================================================
-- Horumarin · Phase 1 — Multi-tenant foundation
-- Adds tenants + memberships, seeds the existing business as the
-- first tenant, and backfills tenant_id onto existing data.
-- NOTE: existing-table RLS is intentionally left untouched here;
-- query/RLS enforcement is flipped in Phase 2 so nothing breaks.
-- ============================================================

create extension if not exists "pgcrypto";

-- 1. Tenants (workspaces) -----------------------------------------------------
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique,
  business_type text not null default 'retail'
    check (business_type in
      ('retail','services','realestate','school','clinic','wholesale','general')),
  logo_url      text,
  phone         text,
  email         text,
  address       text,
  plan          text not null default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.tenants enable row level security;

-- 2. Membership: user <-> tenant + role --------------------------------------
create table if not exists public.tenant_users (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
alter table public.tenant_users enable row level security;
create index if not exists tenant_users_user_idx   on public.tenant_users(user_id);
create index if not exists tenant_users_tenant_idx on public.tenant_users(tenant_id);

-- 3. Each user's currently active workspace ----------------------------------
alter table public.profiles
  add column if not exists active_tenant_id uuid references public.tenants(id);

-- 4. Helper used by RLS (Phase 2) --------------------------------------------
create or replace function public.current_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.tenant_users where user_id = auth.uid();
$$;

-- 5. RLS for the new tables ---------------------------------------------------
drop policy if exists "members read tenants" on public.tenants;
create policy "members read tenants" on public.tenants
  for select using (id in (select public.current_tenant_ids()));

drop policy if exists "members update tenants" on public.tenants;
create policy "members update tenants" on public.tenants
  for update using (id in (select public.current_tenant_ids()));

drop policy if exists "read accessible memberships" on public.tenant_users;
create policy "read accessible memberships" on public.tenant_users
  for select using (
    user_id = auth.uid() or tenant_id in (select public.current_tenant_ids())
  );

grant usage on schema public to authenticated;
grant all on public.tenants, public.tenant_users to authenticated;

-- 6. Backfill helper: add tenant_id to a table if it exists -------------------
create or replace function public.__horumarin_add_tenant(tbl text)
returns void language plpgsql as $$
declare seed uuid;
begin
  if to_regclass('public.' || tbl) is null then return; end if;
  select id into seed from public.tenants order by created_at limit 1;
  execute format(
    'alter table public.%I add column if not exists tenant_id uuid references public.tenants(id)', tbl);
  execute format('update public.%I set tenant_id = %L where tenant_id is null', tbl, seed);
  execute format('create index if not exists %I on public.%I(tenant_id)', tbl || '_tenant_idx', tbl);
end $$;

-- 7. Seed first tenant, memberships, and backfill all business data ----------
do $$
declare seed_tenant uuid;
begin
  select id into seed_tenant from public.tenants order by created_at limit 1;
  if seed_tenant is null then
    insert into public.tenants (name, slug, business_type, phone, email)
    values ('Hassan Bookshop', 'hassan-bookshop', 'retail',
            '+254722979547', 'yussufh080@gmail.com')
    returning id into seed_tenant;
  end if;

  -- existing staff become members (admins -> owner)
  insert into public.tenant_users (tenant_id, user_id, role)
  select seed_tenant, p.id,
         case when p.role = 'admin' then 'owner' else 'staff' end
  from public.profiles p
  on conflict (tenant_id, user_id) do nothing;

  update public.profiles
    set active_tenant_id = seed_tenant
    where active_tenant_id is null;

  -- backfill known + possibly-drifted business tables (missing ones skipped)
  perform public.__horumarin_add_tenant(t)
  from unnest(array[
    'products','sales','orders','order_items','cyber_services',
    'expenses','debts','investments','credits','customer_credits',
    'returns','payments','admin_notifications','order_history'
  ]) as t;
end $$;

drop function public.__horumarin_add_tenant(text);
