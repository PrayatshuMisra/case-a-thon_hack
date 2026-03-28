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

-- 5) Orders (linked to existing shipments) — 33 orders across 7 days
insert into orders (
  id, customer_name, phone, apartment_name, locality,
  product_name, quantity_kg, price_per_kg, total_amount,
  freshness_score, freshness_label, status, shipment_id, created_at
)
values
  -- ── Today ──
  ('88888888-8888-4888-8888-888888888888','Aditya Verma','+919845009999','Sobha Dream Acres','Whitefield','Seer Fish',1.50,349.00,523.50,93.7,'Excellent','Reserved','11111111-1111-4111-8111-111111111111',now() - interval '2 hours'),
  ('99999999-9999-4999-8999-999999999999','Priya Kulkarni','+919845008888','Prestige Shantiniketan','Whitefield','Pomfret',1.00,407.55,407.55,88.2,'High','Reserved','22222222-2222-4222-8222-222222222222',now() - interval '70 minutes'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Rohan Nair','+919845007777','Mantri Alpyne','Indiranagar','Prawns',0.75,350.10,262.58,79.4,'Moderate','Reserved','33333333-3333-4333-8333-333333333333',now() - interval '30 minutes'),
  ('b0000001-0000-4000-8000-000000000001','Sneha Rao','+919845001001','Salarpuria Sattva','HSR Layout','Seer Fish',2.00,349.00,698.00,91.5,'Excellent','Reserved','11111111-1111-4111-8111-111111111111',now() - interval '4 hours'),
  ('b0000002-0000-4000-8000-000000000002','Kiran Shetty','+919845001002','Golden Gate','Koramangala','Pomfret',1.50,407.55,611.33,86.3,'High','Reserved','22222222-2222-4222-8222-222222222222',now() - interval '6 hours'),
  ('b0000003-0000-4000-8000-000000000003','Anitha Bhat','+919845001003','Purva Panorama','Whitefield','Prawns',1.25,389.00,486.25,82.1,'High','Reserved','33333333-3333-4333-8333-333333333333',now() - interval '8 hours'),
  -- ── Yesterday (Day -1) ──
  ('b0000004-0000-4000-8000-000000000004','Mahesh Kumar','+919845001004','Brigade Cosmos','Whitefield','Seer Fish',1.75,349.00,610.75,94.1,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '1 day 3 hours'),
  ('b0000005-0000-4000-8000-000000000005','Deepa Nair','+919845001005','Mantri Alpyne','Indiranagar','Pomfret',1.00,407.55,407.55,87.8,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '1 day 5 hours'),
  ('b0000006-0000-4000-8000-000000000006','Vivek Menon','+919845001006','Sobha Quartz','Whitefield','Seer Fish',2.50,349.00,872.50,92.3,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '1 day 8 hours'),
  ('b0000007-0000-4000-8000-000000000007','Ritu Sharma','+919845001007','RMZ Galleria','Koramangala','Prawns',0.80,389.00,311.20,76.5,'Moderate','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '1 day 11 hours'),
  ('b0000008-0000-4000-8000-000000000008','Arjun Patel','+919845001008','Prestige Lakeside','Bellandur','Seer Fish',1.20,349.00,418.80,89.6,'High','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '1 day 15 hours'),
  ('b0000009-0000-4000-8000-000000000009','Pooja Iyer','+919845001009','Brigade Utopia','HSR Layout','Pomfret',2.00,407.55,815.10,91.2,'Excellent','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '1 day 20 hours'),
  -- ── Day -2 ──
  ('b0000010-0000-4000-8000-000000000010','Sanjay Hegde','+919845001010','Salarpuria Gold Summit','HSR Layout','Seer Fish',1.50,349.00,523.50,90.1,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '2 days 2 hours'),
  ('b0000011-0000-4000-8000-000000000011','Nalini Prasad','+919845001011','Bhartiya City','Whitefield','Pomfret',1.25,407.55,509.44,85.9,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '2 days 7 hours'),
  ('b0000012-0000-4000-8000-000000000012','Suresh Babu','+919845001012','Adarsh Palm Retreat','Bellandur','Prawns',2.00,389.00,778.00,80.3,'High','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '2 days 10 hours'),
  ('b0000013-0000-4000-8000-000000000013','Nandini Rao','+919845001013','Golden Gate','Koramangala','Seer Fish',1.00,349.00,349.00,93.4,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '2 days 14 hours'),
  ('b0000014-0000-4000-8000-000000000014','Ramesh Shetty','+919845001014','Mantri Tranquil','Indiranagar','Pomfret',1.75,407.55,712.21,88.7,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '2 days 18 hours'),
  -- ── Day -3 ──
  ('b0000015-0000-4000-8000-000000000015','Geeta Menon','+919845001015','Purva Venezia','Whitefield','Seer Fish',2.25,349.00,785.25,94.8,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '3 days 1 hour'),
  ('b0000016-0000-4000-8000-000000000016','Anand Krishnan','+919845001016','Brigade Orchards','Bellandur','Prawns',1.50,389.00,583.50,77.2,'Moderate','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '3 days 5 hours'),
  ('b0000017-0000-4000-8000-000000000017','Sunita Patil','+919845001017','Prestige Shantiniketan','Whitefield','Pomfret',1.00,407.55,407.55,90.5,'Excellent','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '3 days 9 hours'),
  ('b0000018-0000-4000-8000-000000000018','Harish Gowda','+919845001018','RMZ Infinity','Koramangala','Seer Fish',1.25,349.00,436.25,88.9,'High','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '3 days 14 hours'),
  ('b0000019-0000-4000-8000-000000000019','Kavitha Reddy','+919845001019','Mantri Serenity','Indiranagar','Prawns',0.75,389.00,291.75,81.6,'High','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '3 days 19 hours'),
  -- ── Day -4 ──
  ('b0000020-0000-4000-8000-000000000020','Sunil Bangera','+919845001020','Sobha Daffodil','Whitefield','Seer Fish',2.00,349.00,698.00,92.7,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '4 days 2 hours'),
  ('b0000021-0000-4000-8000-000000000021','Meera Pillai','+919845001021','Salarpuria Sattva','HSR Layout','Pomfret',1.50,407.55,611.33,86.1,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '4 days 7 hours'),
  ('b0000022-0000-4000-8000-000000000022','Rajesh Kamath','+919845001022','Adarsh Lakefront','Bellandur','Prawns',1.00,389.00,389.00,79.8,'Moderate','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '4 days 11 hours'),
  ('b0000023-0000-4000-8000-000000000023','Lakshmi Nair','+919845001023','Bhartiya Nikoo Homes','Whitefield','Seer Fish',1.75,349.00,610.75,91.3,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '4 days 16 hours'),
  -- ── Day -5 ──
  ('b0000024-0000-4000-8000-000000000024','Vinod Kumar','+919845001024','Golden Gate','Koramangala','Pomfret',2.00,407.55,815.10,89.4,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '5 days 3 hours'),
  ('b0000025-0000-4000-8000-000000000025','Divya Shenoy','+919845001025','Brigade Utopia','HSR Layout','Seer Fish',1.25,349.00,436.25,93.2,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '5 days 7 hours'),
  ('b0000026-0000-4000-8000-000000000026','Ganesh Rao','+919845001026','Mantri Alpyne','Indiranagar','Prawns',1.50,389.00,583.50,80.7,'High','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '5 days 12 hours'),
  ('b0000027-0000-4000-8000-000000000027','Asha Hegde','+919845001027','Purva Highland','Bellandur','Pomfret',1.00,407.55,407.55,87.1,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '5 days 18 hours'),
  -- ── Day -6 ──
  ('b0000028-0000-4000-8000-000000000028','Prasad Shetty','+919845001028','Sobha Dream Acres','Whitefield','Seer Fish',2.50,349.00,872.50,94.6,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '6 days 2 hours'),
  ('b0000029-0000-4000-8000-000000000029','Rekha Bhat','+919845001029','Salarpuria Gold Summit','HSR Layout','Prawns',1.25,389.00,486.25,78.9,'Moderate','Delivered','33333333-3333-4333-8333-333333333333',now() - interval '6 days 8 hours'),
  ('b0000030-0000-4000-8000-000000000030','Mohan Pillai','+919845001030','Prestige Lakeside','Bellandur','Pomfret',1.75,407.55,712.21,85.3,'High','Delivered','22222222-2222-4222-8222-222222222222',now() - interval '6 days 14 hours'),
  ('b0000031-0000-4000-8000-000000000031','Chitra Rao','+919845001031','RMZ Galleria','Koramangala','Seer Fish',1.00,349.00,349.00,90.8,'Excellent','Delivered','11111111-1111-4111-8111-111111111111',now() - interval '6 days 20 hours')
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
