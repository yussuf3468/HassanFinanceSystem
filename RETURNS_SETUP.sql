-- RETURNS_SETUP.sql
-- Schema objects for handling customer product returns.
-- Run this script in your Supabase project (SQL editor) AFTER the products & sales tables exist.
-- Provides:
--   - returns table
--   - trigger functions to maintain stock & derived totals
--   - RLS policies (adjust role names as needed)
--   - helper function for atomic return recording

-- Enable required extension for gen_random_uuid (if not already enabled)
create extension if not exists pgcrypto;

-- =============================
-- Table: returns
-- =============================
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  return_date timestamptz not null default now(),
  product_id uuid not null references public.products(id) on delete restrict,
  sale_id uuid references public.sales(id) on delete set null,
  quantity_returned integer not null check (quantity_returned > 0),
  unit_price numeric(12,2) not null, -- captured selling price for refund basis
  total_refund numeric(14,2) not null, -- computed = unit_price * quantity_returned
  reason text, -- e.g. 'Damaged', 'Wrong Item', 'Customer Cancelled'
  condition text, -- e.g. 'Sealed', 'Opened', 'Damaged'
  payment_method text, -- method used for refund (Cash, Mpesa, Card...)
  processed_by text not null, -- staff member name
  status text default 'pending' check (status in ('pending','approved','refunded')),
  notes text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_returns_product_id on public.returns(product_id);
create index if not exists idx_returns_sale_id on public.returns(sale_id);
create index if not exists idx_returns_return_date on public.returns(return_date desc);

-- =============================
-- Trigger Function: before insert -> set unit_price & total_refund if missing
-- =============================
create or replace function public.fn_returns_before_insert()
returns trigger language plpgsql as $$
begin
  -- default unit_price from current product selling_price if not provided
  if (new.unit_price is null) then
    select selling_price into new.unit_price from public.products where id = new.product_id;
  end if;
  -- compute total_refund
  new.total_refund := coalesce(new.unit_price,0) * new.quantity_returned;
  return new;
end;
$$;

create or replace trigger trg_returns_before_insert
before insert on public.returns
for each row execute procedure public.fn_returns_before_insert();

-- =============================
-- Trigger Function: after insert -> increment product stock
-- =============================
create or replace function public.fn_returns_after_insert()
returns trigger language plpgsql as $$
begin
  update public.products
     set quantity_in_stock = quantity_in_stock + new.quantity_returned,
         updated_at = now()
   where id = new.product_id;
  return new;
end;
$$;

create or replace trigger trg_returns_after_insert
after insert on public.returns
for each row execute procedure public.fn_returns_after_insert();

-- =============================
-- Trigger Function: after delete -> revert stock increment
-- =============================
create or replace function public.fn_returns_after_delete()
returns trigger language plpgsql as $$
begin
  update public.products
     set quantity_in_stock = greatest(quantity_in_stock - old.quantity_returned,0),
         updated_at = now()
   where id = old.product_id;
  return old;
end;
$$;

create or replace trigger trg_returns_after_delete
after delete on public.returns
for each row execute procedure public.fn_returns_after_delete();

-- =============================
-- (Optional) Trigger Function: after update (if quantity_returned changes)
-- =============================
create or replace function public.fn_returns_after_update()
returns trigger language plpgsql as $$
begin
  if (new.quantity_returned <> old.quantity_returned) then
    -- adjust stock difference
    update public.products
       set quantity_in_stock = quantity_in_stock + (new.quantity_returned - old.quantity_returned),
           updated_at = now()
     where id = new.product_id;
  end if;
  if (new.unit_price <> old.unit_price or new.quantity_returned <> old.quantity_returned) then
    -- maintain total_refund if changed via direct updates
    new.total_refund := coalesce(new.unit_price,0) * new.quantity_returned;
  end if;
  return new;
end;
$$;

create or replace trigger trg_returns_after_update
after update on public.returns
for each row execute procedure public.fn_returns_after_update();

-- =============================
-- Helper Function: record a return atomically
-- =============================
create or replace function public.record_product_return(
  p_sale_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_reason text,
  p_condition text,
  p_payment_method text,
  p_processed_by text,
  p_status text default 'pending'
) returns public.returns language plpgsql as $$
declare
  v_product products%rowtype;
  v_return public.returns%rowtype;
begin
  if p_quantity <= 0 then
    raise exception 'Quantity must be > 0';
  end if;
  select * into v_product from public.products where id = p_product_id;
  if not found then
    raise exception 'Product not found';
  end if;
  insert into public.returns(
    sale_id, product_id, quantity_returned, unit_price, reason, condition,
    payment_method, processed_by, status
  ) values (
    p_sale_id, p_product_id, p_quantity, v_product.selling_price, p_reason,
    p_condition, p_payment_method, p_processed_by, p_status
  ) returning * into v_return;
  return v_return;
end;
$$;

-- =============================
-- Row Level Security
-- =============================
alter table public.returns enable row level security;

-- Adjust roles/policies according to your auth setup.
-- Allow authenticated users (staff) to view returns.
create policy "Returns Select Authenticated" on public.returns
  for select using (auth.role() = 'authenticated');

-- Allow authenticated to insert (you may further restrict via JWT claims / processed_by matching).
create policy "Returns Insert Authenticated" on public.returns
  for insert with check (auth.role() = 'authenticated');

-- Allow authenticated to update (e.g., set status to refunded).
create policy "Returns Update Authenticated" on public.returns
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Allow authenticated to delete (optional - or restrict to admin only).
create policy "Returns Delete Authenticated" on public.returns
  for delete using (auth.role() = 'authenticated');

-- =============================
-- Suggested Grants (optional depending on Supabase defaults)
-- =============================
-- grant usage on schema public to postgres, anon, authenticated, service_role;
-- grant select, insert, update, delete on public.returns to anon, authenticated, service_role;

-- =============================
-- Sample Query Demonstrations
-- =============================
-- select * from public.record_product_return(NULL, '<PRODUCT_UUID>', 1, 'Customer changed mind', 'Sealed', 'Cash', 'StaffName');
-- select * from public.returns order by return_date desc limit 50;

-- END OF RETURNS SETUP
