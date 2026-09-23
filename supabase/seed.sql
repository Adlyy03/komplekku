-- ==============================================================================
-- Komplekku MVP v2 Seed Data: supabase/seed.sql
-- Architecture: 1 Production App = 1 Komplek = 1 Supabase Database
-- PRD v2 §1, §3.3, §10, §11, §12, §13, §14, §16, §17, §22, §24, §25, §26
-- ==============================================================================

begin;

-- 1. Complex Settings (PRD v2 §3.3 & §8)
insert into public.complex_settings (
  id,
  name,
  logo_path,
  address,
  phone,
  email,
  timezone,
  status
) values (
  1,
  'Komplek Permata Bintaro',
  null,
  'Jl. Bintaro Utama Sektor 9, Pondok Aren, Tangerang Selatan',
  '0812-8899-7700',
  'pengurus@permatabintaro.id',
  'Asia/Jakarta',
  'active'
) on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  phone = excluded.phone,
  email = excluded.email;

-- 4. RW Units (PRD v2 §10)
insert into public.rw_units (id, code, name, description, status)
values
  (
    '33333333-0000-0000-0000-000000000005',
    '05',
    'RW 05 Permata Bintaro',
    'Rukun Warga 05 mencakup wilayah Cluster Permata Bintaro Sektor 9',
    'active'
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description;

-- 5. RT Units (PRD v2 §10)
insert into public.rt_units (id, rw_id, code, name, description, status)
values
  (
    '44444444-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000005',
    '01',
    'RT 01 Blok A',
    'Wilayah RT 01 mencakup perumahan Blok A1 sampai A4',
    'active'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000005',
    '02',
    'RT 02 Blok B',
    'Wilayah RT 02 mencakup perumahan Blok B1 sampai B4',
    'active'
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000005',
    '03',
    'RT 03 Blok C',
    'Wilayah RT 03 mencakup perumahan Blok C1 sampai C4',
    'active'
  )
on conflict (rw_id, code) do update set
  name = excluded.name,
  description = excluded.description;

-- 6. Houses (24 Realistic Houses across RT 01, 02, 03)
insert into public.houses (id, rw_id, rt_id, block, house_number, address_label, status)
values
  -- RT 01 Houses
  ('55555555-0000-0000-0001-000000000001', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A1', '01', 'Jl. Permata A1 No. 01', 'occupied'),
  ('55555555-0000-0000-0001-000000000002', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A1', '02', 'Jl. Permata A1 No. 02', 'occupied'),
  ('55555555-0000-0000-0001-000000000003', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A1', '03', 'Jl. Permata A1 No. 03', 'occupied'),
  ('55555555-0000-0000-0001-000000000004', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A1', '04', 'Jl. Permata A1 No. 04', 'occupied'),
  ('55555555-0000-0000-0001-000000000005', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A2', '05', 'Jl. Permata A2 No. 05', 'occupied'),
  ('55555555-0000-0000-0001-000000000006', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A2', '06', 'Jl. Permata A2 No. 06', 'occupied'),
  ('55555555-0000-0000-0001-000000000007', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A2', '07', 'Jl. Permata A2 No. 07', 'occupied'),
  ('55555555-0000-0000-0001-000000000008', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'A2', '08', 'Jl. Permata A2 No. 08', 'vacant'),

  -- RT 02 Houses
  ('55555555-0000-0000-0002-000000000001', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B1', '01', 'Jl. Permata B1 No. 01', 'occupied'),
  ('55555555-0000-0000-0002-000000000002', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B1', '02', 'Jl. Permata B1 No. 02', 'occupied'),
  ('55555555-0000-0000-0002-000000000003', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B1', '03', 'Jl. Permata B1 No. 03', 'occupied'),
  ('55555555-0000-0000-0002-000000000004', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B1', '04', 'Jl. Permata B1 No. 04', 'occupied'),
  ('55555555-0000-0000-0002-000000000005', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B2', '05', 'Jl. Permata B2 No. 05', 'occupied'),
  ('55555555-0000-0000-0002-000000000006', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B2', '06', 'Jl. Permata B2 No. 06', 'occupied'),
  ('55555555-0000-0000-0002-000000000007', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B2', '07', 'Jl. Permata B2 No. 07', 'occupied'),
  ('55555555-0000-0000-0002-000000000008', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000002', 'B2', '08', 'Jl. Permata B2 No. 08', 'vacant'),

  -- RT 03 Houses
  ('55555555-0000-0000-0003-000000000001', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C1', '01', 'Jl. Permata C1 No. 01', 'occupied'),
  ('55555555-0000-0000-0003-000000000002', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C1', '02', 'Jl. Permata C1 No. 02', 'occupied'),
  ('55555555-0000-0000-0003-000000000003', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C1', '03', 'Jl. Permata C1 No. 03', 'occupied'),
  ('55555555-0000-0000-0003-000000000004', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C1', '04', 'Jl. Permata C1 No. 04', 'occupied'),
  ('55555555-0000-0000-0003-000000000005', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C2', '05', 'Jl. Permata C2 No. 05', 'occupied'),
  ('55555555-0000-0000-0003-000000000006', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C2', '06', 'Jl. Permata C2 No. 06', 'occupied'),
  ('55555555-0000-0000-0003-000000000007', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C2', '07', 'Jl. Permata C2 No. 07', 'occupied'),
  ('55555555-0000-0000-0003-000000000008', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000003', 'C2', '08', 'Jl. Permata C2 No. 08', 'vacant')
on conflict (id) do nothing;

-- 7. Demo Users in auth.users & public.profiles
-- Password for all demo accounts: Password123!
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'developer@komplekku.id',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bambang Suryo (Developer)"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rw@komplekku.id',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"H. Rachmat Hidayat (Ketua RW 05)"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rt@komplekku.id',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Budi Santoso (Ketua RT 01)"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'warga@komplekku.id',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Adly Ramadhan (Warga)"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seller@komplekku.id',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Siti Aminah (Seller Dapur Bu Siti)"}',
    now(),
    now()
  )
on conflict (id) do nothing;

-- 7b. Identities for Supabase GoTrue Auth
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select 
  gen_random_uuid(),
  id, 
  jsonb_build_object('sub', id::text, 'email', email), 
  'email', 
  id::text, 
  now(), 
  now(), 
  now()
from auth.users u
where not exists (
  select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
);

-- 8. Profiles (Public Resident Identity)
insert into public.profiles (id, full_name, phone, resident_status, verification_status)
values
  ('00000000-0000-0000-0000-000000000001', 'Bambang Suryo', '0811-1234-5671', 'active', 'verified'),
  ('00000000-0000-0000-0000-000000000002', 'H. Rachmat Hidayat', '0811-1234-5672', 'active', 'verified'),
  ('00000000-0000-0000-0000-000000000003', 'Budi Santoso', '0811-1234-5673', 'active', 'verified'),
  ('00000000-0000-0000-0000-000000000004', 'Adly Ramadhan', '0811-1234-5674', 'active', 'verified'),
  ('00000000-0000-0000-0000-000000000005', 'Siti Aminah', '0811-1234-5675', 'active', 'verified')
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  resident_status = excluded.resident_status,
  verification_status = excluded.verification_status;

-- 9. User Roles Hierarchy (PRD v2 §4)
insert into public.user_roles (id, user_id, role, rw_id, rt_id, status)
values
  ('66666666-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'developer', null, null, 'active'),
  ('66666666-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'rw', '33333333-0000-0000-0000-000000000005', null, 'active'),
  ('66666666-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'rt', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'active'),
  ('66666666-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'warga', null, null, 'active'),
  ('66666666-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'warga', null, null, 'active')
on conflict (id) do nothing;

-- 10. Household Members (House Assignment)
insert into public.household_members (id, house_id, user_id, relationship, is_primary, status)
values
  ('77777777-0000-0000-0000-000000000001', '55555555-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'primary', true, 'active'),
  ('77777777-0000-0000-0000-000000000002', '55555555-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000002', 'primary', true, 'active'),
  ('77777777-0000-0000-0000-000000000003', '55555555-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000003', 'primary', true, 'active'),
  ('77777777-0000-0000-0000-000000000004', '55555555-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000004', 'primary', true, 'active'),
  ('77777777-0000-0000-0000-000000000005', '55555555-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000005', 'primary', true, 'active')
on conflict (id) do nothing;

-- 11. Seller Profiles (Resident Stores)
insert into public.seller_profiles (id, user_id, store_name, description, status)
values
  (
    '88888888-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000005',
    'Dapur Tetangga Bu Siti',
    'Masakan rumahan higienis, aneka kue basah segar, dan katering harian antar langsung ke depan pintu rumah.',
    'active'
  )
on conflict (id) do nothing;

-- 12. Products
insert into public.products (id, seller_id, category_id, name, description, price, stock, type, condition, status)
values
  (
    '99999999-0000-0000-0000-000000000001',
    '88888888-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'makanan' limit 1),
    'Nasi Kuning Komplit Bu Siti',
    'Nasi kuning harum dengan lauk ayam suwir bumbu bali, telur balado, orek tempe, perkedel kentang, dan sambal terasi gurih.',
    25000,
    20,
    'product',
    'new',
    'active'
  ),
  (
    '99999999-0000-0000-0000-000000000002',
    '88888888-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'makanan' limit 1),
    'Risoles Mayo Keju Daging Asap (Isi 5)',
    'Kulit risoles renyah dengan isian smoked beef gurih, telur rebus cincang, dan saus keju mayones melimpah.',
    25000,
    15,
    'product',
    'new',
    'active'
  ),
  (
    '99999999-0000-0000-0000-000000000003',
    '88888888-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'minuman' limit 1),
    'Es Kopi Susu Gula Aren 250ml',
    'Kopi espresso arabika dicampur susu segar dan sirup gula aren organik asli tanpa bahan pengawet.',
    18000,
    30,
    'product',
    'new',
    'active'
  ),
  (
    '99999999-0000-0000-0000-000000000004',
    '88888888-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'makanan' limit 1),
    'Keripik Tempe Aneka Rasa (250g)',
    'Olahan tempe kedelai lokal renyah dengan bumbu daun jeruk gurih.',
    15000,
    25,
    'product',
    'new',
    'active'
  )
on conflict (id) do nothing;

-- 13. Dues (PRD v2 §13)
insert into public.dues (id, name, description, amount, billing_frequency, due_day, status, created_by)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Iuran Pengelolaan Lingkungan (IPL) & Keamanan',
    'Iuran bulanan wajib untuk operasional pos sekuriti 24 jam, kebersihan sampah, dan perawatan taman komplek.',
    150000,
    'monthly',
    10,
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Kas Sosial & Kematian Warga RW 05',
    'Dana santunan duka cita, bantuan sakit, dan operasional kegiatan sosial rukun tetangga.',
    25000,
    'monthly',
    10,
    'active',
    '00000000-0000-0000-0000-000000000002'
  )
on conflict (id) do nothing;

-- 14. Due Assignments (Monthly Bill for Warga House B1 No. 01)
insert into public.due_assignments (
  id,
  due_id,
  house_id,
  period_start,
  period_end,
  due_date,
  amount_snapshot,
  status
) values
  -- Current month IPL (Pending Verification to test Pengurus verify flow)
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '55555555-0000-0000-0002-000000000001',
    '2026-09-01',
    '2026-09-30',
    '2026-09-10',
    150000,
    'pending_verification'
  ),
  -- Current month Social Fund (Unpaid to test Warga pay flow)
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000002',
    '55555555-0000-0000-0002-000000000001',
    '2026-09-01',
    '2026-09-30',
    '2026-09-10',
    25000,
    'unpaid'
  ),
  -- Last month IPL (Already Paid)
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '55555555-0000-0000-0002-000000000001',
    '2026-08-01',
    '2026-08-31',
    '2026-08-10',
    150000,
    'paid'
  )
on conflict (due_id, house_id, period_start, period_end) do nothing;

-- 15. Due Payments
insert into public.due_payments (
  id,
  assignment_id,
  paid_by_user_id,
  amount,
  method,
  proof_path,
  status,
  submitted_at,
  verified_by,
  verified_at
) values
  -- Submission waiting for RT/RW verification
  (
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    150000,
    'bank_transfer',
    'demo/bukti_transfer_bca_ipl_sept.jpg',
    'pending_verification',
    now() - interval '2 hours',
    null,
    null
  ),
  -- Approved past payment
  (
    'cccccccc-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    150000,
    'bank_transfer',
    'demo/bukti_transfer_bca_ipl_aug.jpg',
    'approved',
    now() - interval '32 days',
    '00000000-0000-0000-0000-000000000003',
    now() - interval '31 days'
  )
on conflict (id) do nothing;

-- 16. Complaints (PRD v2 §16)
insert into public.complaints (
  id,
  reporter_id,
  house_id,
  category_id,
  title,
  description,
  location_note,
  priority,
  status,
  created_at
) values
  (
    'dddddddd-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '55555555-0000-0000-0002-000000000001',
    coalesce((select id from public.complaint_categories where name ilike '%Lampu%' limit 1), (select id from public.complaint_categories limit 1)),
    'Lampu Jalan PJU Mati di Depan Gang B1',
    'Lampu tiang penerangan jalan nomor 3 di depan blok B1 padam sudah 2 malam berturut-turut. Kondisi jalan cukup gelap saat malam.',
    'Depan rumah Blok B1 No. 03',
    'normal',
    'in_progress',
    now() - interval '1 day'
  ),
  (
    'dddddddd-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    '55555555-0000-0000-0002-000000000001',
    coalesce((select id from public.complaint_categories where name ilike '%Jalan%' or name ilike '%Kebersihan%' limit 1), (select id from public.complaint_categories limit 1)),
    'Genangan Air Selokan Tersumbat Daun Kering',
    'Saluran drainase samping taman bermain tersumbat tumpukan daun gugur dan tanah, air lambat surut saat hujan lebat kemarin.',
    'Samping Taman Bermain RT 01 / RT 02',
    'normal',
    'submitted',
    now() - interval '4 hours'
  )
on conflict (id) do nothing;

-- Complaint Update timeline
insert into public.complaint_updates (id, complaint_id, author_id, status, body, created_at)
values
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'in_review',
    'Laporan telah diterima oleh pengurus RT 01. Sedang dikoordinasikan dengan teknisi listrik komplek.',
    now() - interval '20 hours'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'in_progress',
    'Teknisi komplek sedang memeriksa gardu dan mengganti bohlam LED tiang.',
    now() - interval '6 hours'
  )
on conflict (id) do nothing;

-- 17. Announcements (PRD v2 §12)
insert into public.announcements (
  id,
  author_id,
  title,
  body,
  target_type,
  target_rw_id,
  target_rt_id,
  status,
  publish_at
) values
  -- Complex-wide announcement (by Developer)
  (
    'ffffffff-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Pemberitahuan: Jadwal Pengambilan Sampah Besar & Kerja Bakti Akbar',
    'Diberitahukan kepada seluruh warga Komplek Permata Bintaro bahwa pada hari Minggu pagi akan diadakan kerja bakti serentak serta pengangkutan sampah perkakas besar. Mohon partisipasi aktif setiap warga demi keasrian lingkungan kita bersama.',
    'complex',
    null,
    null,
    'published',
    now() - interval '1 day'
  ),
  -- RW-scoped announcement (by RW 05)
  (
    'ffffffff-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Sosialisasi Fogging DBD Serentak Wilayah RW 05',
    'Pengurus RW 05 bekerjasama dengan Puskesmas akan melaksanakan fogging nyamuk demam berdarah pada hari Sabtu pukul 08.00 - 11.00 WIB. Mohon warga menutup makanan dan mengamankan hewan peliharaan selama penyemprotan berlangsung.',
    'rw',
    '33333333-0000-0000-0000-000000000005',
    null,
    'published',
    now() - interval '2 days'
  ),
  -- RT-scoped announcement (by RT 01)
  (
    'ffffffff-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Rapat Warga RT 01: Pemasangan CCTV Gang & Iuran Portal',
    'Undangan rapat santai warga RT 01 pada Sabtu malam pukul 19.30 WIB di Gazebo Blok A. Agenda utama: evaluasi keamanan lingkungan dan rencana pemasangan CCTV.',
    'rt',
    null,
    '44444444-0000-0000-0000-000000000001',
    'published',
    now() - interval '3 days'
  )
on conflict (id) do nothing;

-- 18. Chat Conversation & Messages (PRD v2 §24)
insert into public.conversations (id, created_at, updated_at)
values ('10101010-0000-0000-0000-000000000001', now() - interval '1 day', now() - interval '30 minutes')
on conflict (id) do nothing;

insert into public.conversation_participants (id, conversation_id, user_id)
values
  ('20202020-0000-0000-0000-000000000001', '10101010-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('20202020-0000-0000-0000-000000000002', '10101010-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005')
on conflict (conversation_id, user_id) do nothing;

insert into public.messages (id, conversation_id, sender_id, message, created_at)
values
  (
    '30303030-0000-0000-0000-000000000001',
    '10101010-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Halo Bu Siti, untuk pesanan Nasi Kuning besok pagi jam 7 sudah bisa siap ya?',
    now() - interval '2 hours'
  ),
  (
    '30303030-0000-0000-0000-000000000002',
    '10101010-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000005',
    'Waalaikumsalam Mas Adly. Bisa sekali, besok jam 06.45 langsung saya antar ke Blok B1 No. 01 ya!',
    now() - interval '1 hour'
  ),
  (
    '30303030-0000-0000-0000-000000000003',
    '10101010-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Terima kasih banyak Bu Siti!',
    now() - interval '30 minutes'
  )
on conflict (id) do nothing;

-- 19. Sample Orders & Order Items (PRD v2 §25)
insert into public.orders (
  id,
  order_number,
  buyer_id,
  seller_id,
  status,
  payment_status,
  subtotal,
  delivery_fee,
  total,
  delivery_method,
  notes,
  created_at
) values
  (
    '40404040-0000-0000-0000-000000000001',
    'ORD-20260923-0001',
    '00000000-0000-0000-0000-000000000004',
    '88888888-0000-0000-0000-000000000001',
    'completed',
    'paid',
    50000,
    0,
    50000,
    'manual_delivery',
    'Tolong sambal dipisah ya Bu.',
    now() - interval '2 days'
  ),
  (
    '40404040-0000-0000-0000-000000000002',
    'ORD-20260923-0002',
    '00000000-0000-0000-0000-000000000004',
    '88888888-0000-0000-0000-000000000001',
    'confirmed',
    'paid',
    43000,
    0,
    43000,
    'manual_delivery',
    'Untuk sarapan besok pagi.',
    now() - interval '2 hours'
  )
on conflict (order_number) do nothing;

insert into public.order_items (
  id,
  order_id,
  product_id,
  product_name_snapshot,
  price_snapshot,
  quantity,
  subtotal
) values
  -- Items for Order 1
  (
    '50505050-0000-0000-0000-000000000001',
    '40404040-0000-0000-0000-000000000001',
    '99999999-0000-0000-0000-000000000001',
    'Nasi Kuning Komplit Bu Siti',
    25000,
    2,
    50000
  ),
  -- Items for Order 2
  (
    '50505050-0000-0000-0000-000000000002',
    '40404040-0000-0000-0000-000000000002',
    '99999999-0000-0000-0000-000000000001',
    'Nasi Kuning Komplit Bu Siti',
    25000,
    1,
    25000
  ),
  (
    '50505050-0000-0000-0000-000000000003',
    '40404040-0000-0000-0000-000000000002',
    '99999999-0000-0000-0000-000000000003',
    'Es Kopi Susu Gula Aren 250ml',
    18000,
    1,
    18000
  )
on conflict (id) do nothing;

-- 20. Audit Log Initial Entries (PRD v2 §26)
insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'seed_initialization',
    'complex_settings',
    null,
    '{"description":"Seed database initializing Komplek Permata Bintaro for MVP deployment candidate"}'::jsonb
  );

commit;
