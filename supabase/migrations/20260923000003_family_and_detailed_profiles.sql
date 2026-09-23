-- Migration 20260923000003: Detailed Resident Profiles & Family Member Management (Kepala Keluarga CRUD)

-- 1. Extend profiles table with comprehensive demographic and administrative fields
alter table public.profiles
  add column if not exists nik text,
  add column if not exists gender text check (gender in ('male', 'female')),
  add column if not exists birth_place text,
  add column if not exists birth_date date,
  add column if not exists religion text,
  add column if not exists marital_status text check (marital_status in ('single', 'married', 'divorced', 'widowed')),
  add column if not exists occupation text,
  add column if not exists blood_type text check (blood_type in ('A', 'B', 'AB', 'O')),
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_relation text,
  add column if not exists kk_number text;

-- 2. Create family_members table for family units registered under a household
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  head_user_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  nik text,
  relationship text not null check (relationship in ('head', 'spouse', 'child', 'parent', 'sibling', 'other')),
  gender text check (gender in ('male', 'female')),
  birth_place text,
  birth_date date,
  religion text,
  occupation text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance (supabase-postgres-best-practices)
create index if not exists family_members_house_id_idx on public.family_members(house_id);
create index if not exists family_members_head_user_id_idx on public.family_members(head_user_id);
create index if not exists family_members_user_id_idx on public.family_members(user_id);

-- Ensure set_updated_at function exists
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for auto updating updated_at
drop trigger if exists set_family_members_updated_at on public.family_members;
create trigger set_family_members_updated_at
  before update on public.family_members
  for each row execute function public.set_updated_at();

-- 3. Row-Level Security Policies for family_members
alter table public.family_members enable row level security;

-- SELECT policy:
-- 1. Family head or the user themselves
-- 2. Anyone living in the same house
-- 3. Community managers (RT, RW, Developer)
drop policy if exists family_members_select on public.family_members;
create policy family_members_select
on public.family_members for select to authenticated
using (
  head_user_id = (select auth.uid())
  or user_id = (select auth.uid())
  or house_id in (
    select hm.house_id from public.household_members hm
    where hm.user_id = (select auth.uid()) and hm.status = 'active'
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.status = 'active'
      and ur.role in ('developer', 'rw', 'rt')
  )
);

-- INSERT policy: Family head or managers
drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert
on public.family_members for insert to authenticated
with check (
  head_user_id = (select auth.uid())
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.status = 'active'
      and ur.role in ('developer', 'rw', 'rt')
  )
);

-- UPDATE policy: Family head or managers
drop policy if exists family_members_update on public.family_members;
create policy family_members_update
on public.family_members for update to authenticated
using (
  head_user_id = (select auth.uid())
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.status = 'active'
      and ur.role in ('developer', 'rw', 'rt')
  )
);

-- DELETE policy: Family head or managers
drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete
on public.family_members for delete to authenticated
using (
  head_user_id = (select auth.uid())
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.status = 'active'
      and ur.role in ('developer', 'rw', 'rt')
  )
);
