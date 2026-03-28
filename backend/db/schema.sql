-- MALPE MEEN LAUNCHOS - PostgreSQL/Supabase schema
-- Run this first.

create extension if not exists pgcrypto;

-- Product catalog used by live-drop pricing and reservation calculations
create table if not exists product_catalog (
  product_name text primary key,
  base_price numeric(10,2) not null check (base_price > 0),
  available_kg numeric(10,2) not null check (available_kg >= 0),
  locality_eta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Inbound/active shipment timeline from Malpe to Bangalore
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  product_name text not null references product_catalog(product_name) on update cascade,
  source_boat text not null,
  catch_time timestamptz not null,
  landing_time timestamptz not null,
  packing_time timestamptz not null,
  dispatch_time timestamptz not null,
  arrival_eta timestamptz not null,
  species text not null,
  cold_chain_ok boolean not null default true,
  created_at timestamptz not null default now(),
  constraint shipment_time_sequence check (
    catch_time <= landing_time
    and landing_time <= packing_time
    and packing_time <= dispatch_time
  )
);

-- Fisher onboarding records
create table if not exists fishers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  boat_id text not null,
  species_focus text not null,
  avg_weekly_catch_kg numeric(10,2) not null check (avg_weekly_catch_kg > 0),
  commitment_level text not null,
  mobile_number text,
  income_uplift_pct numeric(5,2) not null default 0,
  status text not null default 'Onboarded',
  created_at timestamptz not null default now()
);

-- LOI records + document preview snapshot
create table if not exists lois (
  id uuid primary key default gen_random_uuid(),
  buyer_type text not null,
  buyer_name text not null,
  monthly_volume_kg numeric(10,2) not null check (monthly_volume_kg > 0),
  duration_days int not null check (duration_days between 7 and 3650),
  price_note text not null,
  delivery_terms text not null,
  special_notes text,
  status text not null default 'Draft',
  preview jsonb,
  created_at timestamptz not null default now()
);

-- Customer reservations created from Home page form
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  apartment_name text not null,
  locality text not null,
  product_name text not null references product_catalog(product_name) on update cascade,
  quantity_kg numeric(10,2) not null check (quantity_kg > 0 and quantity_kg <= 50),
  price_per_kg numeric(10,2) not null check (price_per_kg > 0),
  total_amount numeric(12,2) not null check (total_amount > 0),
  freshness_score numeric(5,2) not null check (freshness_score between 0 and 100),
  freshness_label text not null,
  status text not null default 'Reserved',
  shipment_id uuid not null references shipments(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Useful indexes for dashboard, tracking and list APIs
create index if not exists idx_shipments_product_name on shipments(product_name);
create index if not exists idx_shipments_arrival_eta on shipments(arrival_eta);
create index if not exists idx_fishers_created_at on fishers(created_at desc);
create index if not exists idx_lois_created_at on lois(created_at desc);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_locality on orders(locality);
create index if not exists idx_orders_product_name on orders(product_name);
create index if not exists idx_orders_shipment_id on orders(shipment_id);

-- Keep product_catalog.updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_product_catalog_updated_at on product_catalog;
create trigger trg_product_catalog_updated_at
before update on product_catalog
for each row
execute function set_updated_at();
