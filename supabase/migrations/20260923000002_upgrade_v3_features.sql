-- ==============================================================================
-- KOMPLEKKU UPGRADE V3 MIGRATION: 20260923000002_upgrade_v3_features.sql
-- Modules: Financial Transparency (Expenses), Resident Self-Onboarding (House Claims),
--          Security & SOS (Emergency Events), Digital Guest (Visitor Passes),
--          Batch Billing Generator Function
-- ==============================================================================

begin;

-- =========================================================
-- 1. FINANCIAL TRANSPARENCY: EXPENSES (BUKU KAS PENGELUARAN)
-- =========================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  rw_id uuid references public.rw_units(id) on delete restrict,
  rt_id uuid references public.rt_units(id) on delete restrict,
  title text not null,
  category text not null check (
    category in ('security', 'waste', 'maintenance', 'utilities', 'administration', 'social', 'other')
  ),
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  description text,
  proof_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_rw_id_idx on public.expenses(rw_id);
create index if not exists expenses_rt_id_idx on public.expenses(rt_id);
create index if not exists expenses_expense_date_idx on public.expenses(expense_date);

alter table public.expenses enable row level security;

-- Warga & Pengurus can view expenses for full financial transparency
create policy "expenses_read_policy"
  on public.expenses
  for select
  to authenticated
  using (true);

-- Management can insert expenses
create policy "expenses_insert_policy"
  on public.expenses
  for insert
  to authenticated
  with check (
    public.is_developer()
    or (rt_id is not null and public.is_rt_user(rt_id))
    or (rw_id is not null and public.is_rw_user(rw_id))
  );

-- Management can update expenses
create policy "expenses_update_policy"
  on public.expenses
  for update
  to authenticated
  using (
    public.is_developer()
    or (rt_id is not null and public.is_rt_user(rt_id))
    or (rw_id is not null and public.is_rw_user(rw_id))
  );

-- =========================================================
-- 2. RESIDENT SELF-ONBOARDING: HOUSE CLAIMS
-- =========================================================
create table if not exists public.house_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  occupancy_status text not null check (occupancy_status in ('owner', 'renter', 'family')),
  document_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists house_claims_user_id_idx on public.house_claims(user_id);
create index if not exists house_claims_house_id_idx on public.house_claims(house_id);
create index if not exists house_claims_status_idx on public.house_claims(status);

alter table public.house_claims enable row level security;

-- Resident can view their own claims; managers can view claims in their scope
create policy "house_claims_select_policy"
  on public.house_claims
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_manage_house(house_id)
  );

-- Resident can submit claims
create policy "house_claims_insert_policy"
  on public.house_claims
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
  );

-- Resident can cancel own pending claim; Manager can approve/reject
create policy "house_claims_update_policy"
  on public.house_claims
  for update
  to authenticated
  using (
    (user_id = (select auth.uid()) and status = 'pending')
    or public.can_manage_house(house_id)
  );

-- =========================================================
-- 3. EMERGENCY / SOS EVENTS
-- =========================================================
create table if not exists public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete set null,
  rt_id uuid references public.rt_units(id) on delete set null,
  rw_id uuid references public.rw_units(id) on delete set null,
  emergency_type text not null default 'general' check (emergency_type in ('general', 'security', 'medical', 'fire')),
  status text not null default 'active' check (status in ('active', 'acknowledged', 'resolved', 'cancelled')),
  notes text,
  latitude double precision,
  longitude double precision,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists emergency_events_user_id_idx on public.emergency_events(user_id);
create index if not exists emergency_events_status_idx on public.emergency_events(status);
create index if not exists emergency_events_created_at_idx on public.emergency_events(created_at desc);

alter table public.emergency_events enable row level security;

-- All residents can view active emergencies for safety vigilance; managers see all
create policy "emergency_events_select_policy"
  on public.emergency_events
  for select
  to authenticated
  using (
    status = 'active'
    or user_id = (select auth.uid())
    or public.is_developer()
    or (rt_id is not null and public.is_rt_user(rt_id))
    or (rw_id is not null and public.is_rw_user(rw_id))
  );

-- Resident can trigger an emergency
create policy "emergency_events_insert_policy"
  on public.emergency_events
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
  );

-- Resident can cancel own active event; Management can acknowledge or resolve
create policy "emergency_events_update_policy"
  on public.emergency_events
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_developer()
    or (rt_id is not null and public.is_rt_user(rt_id))
    or (rw_id is not null and public.is_rw_user(rw_id))
  );

-- =========================================================
-- 4. DIGITAL GUEST / VISITOR PASSES
-- =========================================================
create table if not exists public.visitor_passes (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  guest_name text not null,
  guest_phone text,
  vehicle_plate text,
  visit_date date not null default current_date,
  expected_departure date,
  purpose text not null,
  access_code text not null unique,
  status text not null default 'expected' check (status in ('expected', 'checked_in', 'checked_out', 'cancelled', 'expired')),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  checked_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visitor_passes_host_user_id_idx on public.visitor_passes(host_user_id);
create index if not exists visitor_passes_access_code_idx on public.visitor_passes(access_code);
create index if not exists visitor_passes_status_idx on public.visitor_passes(status);
create index if not exists visitor_passes_visit_date_idx on public.visitor_passes(visit_date);

alter table public.visitor_passes enable row level security;

-- Host can view own passes; managers can view all passes for security check
create policy "visitor_passes_select_policy"
  on public.visitor_passes
  for select
  to authenticated
  using (
    host_user_id = (select auth.uid())
    or public.can_manage_house(house_id)
  );

-- Resident can generate guest passes
create policy "visitor_passes_insert_policy"
  on public.visitor_passes
  for insert
  to authenticated
  with check (
    host_user_id = (select auth.uid())
    and public.is_house_member(house_id)
  );

-- Resident can cancel; security/managers can check-in / check-out
create policy "visitor_passes_update_policy"
  on public.visitor_passes
  for update
  to authenticated
  using (
    (host_user_id = (select auth.uid()) and status = 'expected')
    or public.can_manage_house(house_id)
  );

-- =========================================================
-- 5. BATCH BILLING GENERATOR FUNCTION (ATOMIC & IDEMPOTENT)
-- =========================================================
create or replace function public.generate_due_batch(
  p_due_id uuid,
  p_period_start date,
  p_period_end date,
  p_due_date date,
  p_amount numeric,
  p_rw_id uuid default null,
  p_rt_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
  v_count integer := 0;
  v_skipped integer := 0;
begin
  -- Caller must be manager
  if not (
    public.is_developer()
    or (p_rw_id is not null and public.is_rw_user(p_rw_id))
    or (p_rt_id is not null and public.is_rt_user(p_rt_id))
  ) then
    raise exception 'Unauthorized: Only designated managers can generate batch billing.';
  end if;

  for v_house_id in
    select h.id from public.houses h
    where h.status = 'occupied'
      and (p_rw_id is null or h.rw_id = p_rw_id)
      and (p_rt_id is null or h.rt_id = p_rt_id)
  loop
    if exists (
      select 1 from public.due_assignments da
      where da.house_id = v_house_id
        and da.due_id = p_due_id
        and da.period_start = p_period_start
        and da.period_end = p_period_end
        and da.status != 'cancelled'
    ) then
      v_skipped := v_skipped + 1;
    else
      insert into public.due_assignments (
        due_id,
        house_id,
        period_start,
        period_end,
        amount_snapshot,
        status,
        due_date
      ) values (
        p_due_id,
        v_house_id,
        p_period_start,
        p_period_end,
        p_amount,
        'unpaid',
        p_due_date
      );
      v_count := v_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'generated_count', v_count,
    'skipped_count', v_skipped
  );
end;
$$;

commit;
