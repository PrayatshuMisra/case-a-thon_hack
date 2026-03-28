-- MALPE MEEN LAUNCHOS - seed data
-- Run this after schema.sql

-- 1) Product catalog
insert into product_catalog (product_name, base_price, available_kg, locality_eta)
values
  ('Seer Fish', 349.00, 42.00, 'Tomorrow 7:00 AM'),
  ('Pomfret', 429.00, 31.00, 'Tomorrow 7:30 AM'),
  ('Prawns', 389.00, 52.00, 'Tomorrow 8:00 AM')
on conflict (product_name) do update
set
  base_price = excluded.base_price,
  available_kg = excluded.available_kg,
  locality_eta = excluded.locality_eta,
  updated_at = now();

-- 2) Shipments (dynamic to current run time)
insert into shipments (
  id, product_name, source_boat,
  catch_time, landing_time, packing_time, dispatch_time, arrival_eta,
  species, cold_chain_ok
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Seer Fish',
    'MALPE-07',
    now() - interval '4 hours 15 minutes',
    now() - interval '3 hours 10 minutes',
    now() - interval '2 hours 20 minutes',
    now() - interval '1 hours 45 minutes',
    now() + interval '5 hours',
    'Seer Fish',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Pomfret',
    'MALPE-12',
    now() - interval '5 hours 10 minutes',
    now() - interval '4 hours 10 minutes',
    now() - interval '2 hours 50 minutes',
    now() - interval '2 hours 15 minutes',
    now() + interval '6 hours',
    'Pomfret',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Prawns',
    'MALPE-19',
    now() - interval '6 hours 5 minutes',
    now() - interval '5 hours 0 minutes',
    now() - interval '3 hours 30 minutes',
    now() - interval '3 hours 0 minutes',
    now() + interval '6 hours 30 minutes',
    'Prawns',
    true
  )
on conflict (id) do update
set
  product_name = excluded.product_name,
  source_boat = excluded.source_boat,
  catch_time = excluded.catch_time,
  landing_time = excluded.landing_time,
  packing_time = excluded.packing_time,
  dispatch_time = excluded.dispatch_time,
  arrival_eta = excluded.arrival_eta,
  species = excluded.species,
  cold_chain_ok = excluded.cold_chain_ok;

-- 3) Fishers
insert into fishers (
  id, name, boat_id, species_focus, avg_weekly_catch_kg, commitment_level,
  mobile_number, income_uplift_pct, status
)
values
  (
    '44444444-4444-4444-8444-444444444444',
    'K. Manjunath',
    'MALPE-07',
    'Seer Fish',
    230,
    'High',
    '+919845001111',
    18.0,
    'Onboarded'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'S. Raghavan',
    'MALPE-12',
    'Pomfret',
    180,
    'High',
    '+919845002222',
    16.9,
    'Onboarded'
  )
on conflict (id) do update
set
  name = excluded.name,
  boat_id = excluded.boat_id,
  species_focus = excluded.species_focus,
  avg_weekly_catch_kg = excluded.avg_weekly_catch_kg,
  commitment_level = excluded.commitment_level,
  mobile_number = excluded.mobile_number,
  income_uplift_pct = excluded.income_uplift_pct,
  status = excluded.status;

-- 4) LOIs
insert into lois (
  id, buyer_type, buyer_name, monthly_volume_kg, duration_days,
  price_note, delivery_terms, special_notes, status, preview
)
values
  (
    '66666666-6666-4666-8666-666666666666',
    'RWA',
    'Sobha Dream Acres',
    450,
    90,
    'Indicative price subject to pilot demand',
    'Delivered with cold-chain compliance',
    'Pilot for Whitefield weekend drops',
    'Draft',
    jsonb_build_object(
      'header', 'Letter of Intent',
      'buyer_type', 'RWA',
      'buyer_name', 'Sobha Dream Acres',
      'monthly_volume_kg', 450,
      'duration_days', 90,
      'validity', 'Pilot validity: 90 days'
    )
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'Restaurant',
    'Blue Fin Bistro',
    320,
    60,
    'Indicative price subject to pilot demand',
    'Delivered with cold-chain compliance',
    'Needs early morning delivery window',
    'Signed',
    jsonb_build_object(
      'header', 'Letter of Intent',
      'buyer_type', 'Restaurant',
      'buyer_name', 'Blue Fin Bistro',
      'monthly_volume_kg', 320,
      'duration_days', 60,
      'validity', 'Pilot validity: 60 days'
    )
  )
on conflict (id) do update
set
  buyer_type = excluded.buyer_type,
  buyer_name = excluded.buyer_name,
  monthly_volume_kg = excluded.monthly_volume_kg,
  duration_days = excluded.duration_days,
  price_note = excluded.price_note,
  delivery_terms = excluded.delivery_terms,
  special_notes = excluded.special_notes,
  status = excluded.status,
  preview = excluded.preview;

-- 5) Orders (linked to existing shipments)
insert into orders (
  id, customer_name, phone, apartment_name, locality,
  product_name, quantity_kg, price_per_kg, total_amount,
  freshness_score, freshness_label, status, shipment_id, created_at
)
values
  (
    '88888888-8888-4888-8888-888888888888',
    'Aditya Verma',
    '+919845009999',
    'Sobha Dream Acres',
    'Whitefield',
    'Seer Fish',
    1.50,
    349.00,
    523.50,
    93.7,
    'Excellent',
    'Reserved',
    '11111111-1111-4111-8111-111111111111',
    now() - interval '2 hours'
  ),
  (
    '99999999-9999-4999-8999-999999999999',
    'Priya Kulkarni',
    '+919845008888',
    'Prestige Shantiniketan',
    'Whitefield',
    'Pomfret',
    1.00,
    407.55,
    407.55,
    88.2,
    'High',
    'Reserved',
    '22222222-2222-4222-8222-222222222222',
    now() - interval '70 minutes'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Rohan Nair',
    '+919845007777',
    'Mantri Alpyne',
    'Indiranagar',
    'Prawns',
    0.75,
    350.10,
    262.58,
    79.4,
    'Moderate',
    'Reserved',
    '33333333-3333-4333-8333-333333333333',
    now() - interval '30 minutes'
  )
on conflict (id) do update
set
  customer_name = excluded.customer_name,
  phone = excluded.phone,
  apartment_name = excluded.apartment_name,
  locality = excluded.locality,
  product_name = excluded.product_name,
  quantity_kg = excluded.quantity_kg,
  price_per_kg = excluded.price_per_kg,
  total_amount = excluded.total_amount,
  freshness_score = excluded.freshness_score,
  freshness_label = excluded.freshness_label,
  status = excluded.status,
  shipment_id = excluded.shipment_id,
  created_at = excluded.created_at;
