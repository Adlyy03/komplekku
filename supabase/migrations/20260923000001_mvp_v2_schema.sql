-- KOMPLEKKU MVP DATABASE v2
-- PostgreSQL / Supabase
-- MODEL: 1 production app = 1 complex = 1 Supabase project/database.
-- Packages A/B/C are commercial packaging and are NOT stored as resident-facing data.

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- 0. CORE TABLES
-- =========================================================

create table public.complex_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null,
  logo_path text,
  address text,
  phone text,
  email text,
  timezone text not null default 'Asia/Jakarta',
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_path text,
  resident_status text not null default 'pending'
    check (resident_status in ('pending','active','inactive','blocked')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rw_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rt_units (
  id uuid primary key default gen_random_uuid(),
  rw_id uuid not null references public.rw_units(id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rw_id, code)
);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  rw_id uuid not null references public.rw_units(id) on delete restrict,
  rt_id uuid not null references public.rt_units(id) on delete restrict,
  block text,
  house_number text not null,
  address_label text,
  status text not null default 'occupied'
    check (status in ('occupied','vacant','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index houses_rw_id_idx on public.houses(rw_id);
create index houses_rt_id_idx on public.houses(rt_id);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  relationship text not null default 'member',
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('active','inactive')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (house_id, user_id)
);

create unique index household_one_primary_idx
  on public.household_members(house_id)
  where is_primary = true and status = 'active';

create index household_members_user_id_idx on public.household_members(user_id);
create index household_members_house_id_idx on public.household_members(house_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('developer','rw','rt','warga')),
  rw_id uuid references public.rw_units(id) on delete cascade,
  rt_id uuid references public.rt_units(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (user_id, role, rw_id, rt_id),
  check (
    (role = 'developer' and rw_id is null and rt_id is null)
    or (role = 'rw' and rw_id is not null and rt_id is null)
    or (role = 'rt' and rt_id is not null)
    or (role = 'warga')
  )
);

create index user_roles_user_id_idx on public.user_roles(user_id);
create index user_roles_rw_id_idx on public.user_roles(rw_id);
create index user_roles_rt_id_idx on public.user_roles(rt_id);

-- =========================================================
-- 1. COMMUNICATION
-- =========================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  image_path text,
  target_type text not null default 'complex'
    check (target_type in ('complex','rw','rt')),
  target_rw_id uuid references public.rw_units(id) on delete cascade,
  target_rt_id uuid references public.rt_units(id) on delete cascade,
  status text not null default 'published'
    check (status in ('draft','published','archived')),
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (target_type = 'complex' and target_rw_id is null and target_rt_id is null)
    or (target_type = 'rw' and target_rw_id is not null and target_rt_id is null)
    or (target_type = 'rt' and target_rt_id is not null)
  )
);

create index announcements_target_rw_idx on public.announcements(target_rw_id);
create index announcements_target_rt_idx on public.announcements(target_rt_id);
create index announcements_status_publish_idx on public.announcements(status, publish_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  reference_type text,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index notifications_unread_idx
  on public.notifications(user_id, read_at)
  where read_at is null;

-- =========================================================
-- 2. IURAN
-- =========================================================

create table public.dues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  billing_frequency text not null default 'monthly'
    check (billing_frequency in ('monthly','one_time')),
  due_day integer check (due_day between 1 and 31),
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.due_assignments (
  id uuid primary key default gen_random_uuid(),
  due_id uuid not null references public.dues(id) on delete restrict,
  house_id uuid not null references public.houses(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  due_date date,
  amount_snapshot numeric(12,2) not null check (amount_snapshot >= 0),
  status text not null default 'unpaid'
    check (status in ('unpaid','pending_verification','paid','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (due_id, house_id, period_start, period_end),
  check (period_end >= period_start)
);

create index due_assignments_house_idx on public.due_assignments(house_id);
create index due_assignments_status_idx on public.due_assignments(status);
create index due_assignments_period_idx on public.due_assignments(period_start, period_end);

create table public.due_payments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.due_assignments(id) on delete cascade,
  paid_by_user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  method text not null default 'manual'
    check (method in ('manual','cash','bank_transfer','other')),
  proof_path text,
  status text not null default 'pending_verification'
    check (status in ('pending_verification','approved','rejected')),
  submitted_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index due_payments_assignment_idx on public.due_payments(assignment_id);
create index due_payments_status_idx on public.due_payments(status);

-- =========================================================
-- 3. MARKETPLACE
-- =========================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  store_name text not null,
  description text,
  avatar_path text,
  status text not null default 'active'
    check (status in ('active','inactive','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  type text not null default 'product'
    check (type in ('product','service')),
  condition text
    check (condition in ('new','like_new','used') or condition is null),
  status text not null default 'draft'
    check (status in ('draft','active','inactive','sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_seller_idx on public.products(seller_id);
create index products_category_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_name_idx on public.products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'')));

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id);

create unique index product_one_cover_idx
  on public.product_images(product_id)
  where is_cover = true;

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, product_id)
);

create index cart_items_cart_idx on public.cart_items(cart_id);
create index cart_items_product_idx on public.cart_items(product_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.seller_profiles(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','ready','completed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','cancelled')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  delivery_method text not null default 'pickup'
    check (delivery_method in ('pickup','manual_delivery')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_buyer_idx on public.orders(buyer_id);
create index orders_seller_idx on public.orders(seller_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  price_snapshot numeric(12,2) not null check (price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

-- =========================================================
-- 4. CHAT
-- =========================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create index conversation_participants_user_idx
  on public.conversation_participants(user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (length(trim(message)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages(conversation_id, created_at asc);

-- =========================================================
-- 5. COMPLAINTS
-- =========================================================

create table public.complaint_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  house_id uuid references public.houses(id) on delete set null,
  category_id uuid not null references public.complaint_categories(id) on delete restrict,
  title text not null,
  description text not null,
  location_note text,
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  status text not null default 'submitted'
    check (status in ('submitted','in_review','in_progress','resolved','rejected','closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index complaints_reporter_idx on public.complaints(reporter_id);
create index complaints_house_idx on public.complaints(house_id);
create index complaints_status_idx on public.complaints(status);
create index complaints_assigned_idx on public.complaints(assigned_to);

create table public.complaint_updates (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  status text,
  body text not null,
  created_at timestamptz not null default now()
);

create index complaint_updates_complaint_idx
  on public.complaint_updates(complaint_id, created_at asc);

-- =========================================================
-- 6. AUDIT
-- =========================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
  on public.audit_logs(entity_type, entity_id);
create index audit_logs_actor_idx
  on public.audit_logs(actor_id);
create index audit_logs_created_idx
  on public.audit_logs(created_at desc);

-- =========================================================
-- 7. COMMON UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'complex_settings','profiles','rw_units','rt_units','houses',
    'household_members','announcements','dues','due_assignments',
    'due_payments','seller_profiles','products','carts','cart_items',
    'orders','conversations','complaints'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at();',
      'set_' || t || '_updated_at', t
    );
  end loop;
end $$;

-- =========================================================
-- 8. SECURITY HELPER FUNCTIONS
-- SECURITY DEFINER functions are owned by postgres and are used
-- to avoid RLS recursion when checking role/scope.
-- =========================================================

create or replace function public.is_developer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'developer'
      and status = 'active'
  );
$$;

create or replace function public.is_rw_user(target_rw uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'rw'
      and rw_id = target_rw
      and status = 'active'
  );
$$;

create or replace function public.is_rt_user(target_rt uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'rt'
      and rt_id = target_rt
      and status = 'active'
  );
$$;

create or replace function public.can_manage_house(target_house uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_developer()
    or exists (
      select 1
      from public.houses h
      where h.id = target_house
        and (
          public.is_rw_user(h.rw_id)
          or public.is_rt_user(h.rt_id)
        )
    );
$$;

create or replace function public.is_house_member(target_house uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.house_id = target_house
      and hm.user_id = (select auth.uid())
      and hm.status = 'active'
  );
$$;

create or replace function public.can_access_announcement(
  target_type text,
  target_rw uuid,
  target_rt uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_developer()
    or (target_type = 'complex' and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.resident_status = 'active'
    ))
    or (target_type = 'rw' and (
      public.is_rw_user(target_rw)
      or exists (
        select 1
        from public.household_members hm
        join public.houses h on h.id = hm.house_id
        where hm.user_id = (select auth.uid())
          and hm.status = 'active'
          and h.rw_id = target_rw
      )
    ))
    or (target_type = 'rt' and (
      public.is_rt_user(target_rt)
      or exists (
        select 1
        from public.household_members hm
        join public.houses h on h.id = hm.house_id
        where hm.user_id = (select auth.uid())
          and hm.status = 'active'
          and h.rt_id = target_rt
      )
    ));
$$;

create or replace function public.can_access_complaint(target_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_developer()
    or exists (
      select 1 from public.complaints c
      where c.id = target_id
        and (
          c.reporter_id = (select auth.uid())
          or c.assigned_to = (select auth.uid())
          or public.can_manage_house(c.house_id)
        )
    );
$$;

create or replace function public.is_conversation_participant(target_conv uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = target_conv
      and cp.user_id = (select auth.uid())
  );
$$;

-- =========================================================
-- 9. RLS ENABLE
-- =========================================================

alter table public.complex_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.rw_units enable row level security;
alter table public.rt_units enable row level security;
alter table public.houses enable row level security;
alter table public.household_members enable row level security;
alter table public.user_roles enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.dues enable row level security;
alter table public.due_assignments enable row level security;
alter table public.due_payments enable row level security;
alter table public.categories enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.complaint_categories enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_updates enable row level security;
alter table public.audit_logs enable row level security;

-- =========================================================
-- 10. RLS: CORE / IDENTITY
-- =========================================================

create policy complex_settings_select
on public.complex_settings for select to authenticated
using (true);

create policy complex_settings_manage
on public.complex_settings for all to authenticated
using (public.is_developer())
with check (public.is_developer());

create policy profiles_select
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.is_developer()
  or exists (
    select 1 from public.household_members hm
    join public.houses h on h.id = hm.house_id
    where hm.user_id = profiles.id
      and hm.status = 'active'
      and (public.is_rw_user(h.rw_id) or public.is_rt_user(h.rt_id))
  )
);

create policy profiles_insert_self
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()) or public.is_developer())
with check (id = (select auth.uid()) or public.is_developer());

create policy rw_select
on public.rw_units for select to authenticated
using (true);

create policy rw_manage
on public.rw_units for all to authenticated
using (public.is_developer())
with check (public.is_developer());

create policy rt_select
on public.rt_units for select to authenticated
using (true);

create policy rt_manage
on public.rt_units for all to authenticated
using (public.is_developer() or public.is_rw_user(rw_id))
with check (public.is_developer() or public.is_rw_user(rw_id));

create policy houses_select
on public.houses for select to authenticated
using (
  public.is_developer()
  or public.is_rw_user(rw_id)
  or public.is_rt_user(rt_id)
  or public.is_house_member(id)
);

create policy houses_manage
on public.houses for all to authenticated
using (
  public.is_developer()
  or public.is_rw_user(rw_id)
  or public.is_rt_user(rt_id)
)
with check (
  public.is_developer()
  or public.is_rw_user(rw_id)
  or public.is_rt_user(rt_id)
);

create policy household_select
on public.household_members for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_developer()
  or public.can_manage_house(house_id)
  or public.is_house_member(house_id)
);

create policy household_manage
on public.household_members for all to authenticated
using (
  public.is_developer()
  or public.can_manage_house(house_id)
  or user_id = (select auth.uid())
)
with check (
  public.is_developer()
  or public.can_manage_house(house_id)
  or user_id = (select auth.uid())
);

create policy roles_select_own_or_admin
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.is_developer());

create policy roles_manage_developer
on public.user_roles for all to authenticated
using (public.is_developer())
with check (public.is_developer());

-- =========================================================
-- 11. RLS: ANNOUNCEMENTS / NOTIFICATIONS
-- =========================================================

create policy announcements_select
on public.announcements for select to authenticated
using (
  status = 'published'
  and publish_at <= now()
  and (expires_at is null or expires_at > now())
  and public.can_access_announcement(target_type, target_rw_id, target_rt_id)
);

create policy announcements_manage
on public.announcements for all to authenticated
using (
  public.is_developer()
  or (target_type = 'rw' and public.is_rw_user(target_rw_id))
  or (target_type = 'rt' and public.is_rt_user(target_rt_id))
)
with check (
  public.is_developer()
  or (target_type = 'rw' and public.is_rw_user(target_rw_id))
  or (target_type = 'rt' and public.is_rt_user(target_rt_id))
);

create policy notifications_select
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy notifications_insert_system
on public.notifications for insert to authenticated
with check (
  public.is_developer()
  or user_id = (select auth.uid())
);

create policy notifications_update_own
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy notifications_delete_own
on public.notifications for delete to authenticated
using (user_id = (select auth.uid()));

-- =========================================================
-- 12. RLS: IURAN
-- =========================================================

create policy dues_select
on public.dues for select to authenticated
using (true);

create policy dues_manage
on public.dues for all to authenticated
using (public.is_developer())
with check (public.is_developer());

create policy due_assignments_select
on public.due_assignments for select to authenticated
using (
  public.is_developer()
  or public.can_manage_house(house_id)
  or public.is_house_member(house_id)
);

create policy due_assignments_manage
on public.due_assignments for all to authenticated
using (
  public.is_developer()
  or public.can_manage_house(house_id)
)
with check (
  public.is_developer()
  or public.can_manage_house(house_id)
);

create policy due_payments_select
on public.due_payments for select to authenticated
using (
  paid_by_user_id = (select auth.uid())
  or public.is_developer()
  or exists (
    select 1 from public.due_assignments da
    where da.id = due_payments.assignment_id
      and public.can_manage_house(da.house_id)
  )
);

create policy due_payments_insert
on public.due_payments for insert to authenticated
with check (
  paid_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.due_assignments da
    where da.id = assignment_id
      and public.is_house_member(da.house_id)
  )
);

create policy due_payments_update_verifier
on public.due_payments for update to authenticated
using (
  public.is_developer()
  or exists (
    select 1 from public.due_assignments da
    where da.id = due_payments.assignment_id
      and public.can_manage_house(da.house_id)
  )
)
with check (
  public.is_developer()
  or exists (
    select 1 from public.due_assignments da
    where da.id = due_payments.assignment_id
      and public.can_manage_house(da.house_id)
  )
);

-- =========================================================
-- 13. RLS: MARKETPLACE
-- =========================================================

create policy categories_select
on public.categories for select to authenticated
using (status = 'active');

create policy categories_manage
on public.categories for all to authenticated
using (public.is_developer())
with check (public.is_developer());

create policy sellers_select
on public.seller_profiles for select to authenticated
using (status = 'active' or user_id = (select auth.uid()) or public.is_developer());

create policy sellers_insert_self
on public.seller_profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy sellers_update_own_or_admin
on public.seller_profiles for update to authenticated
using (user_id = (select auth.uid()) or public.is_developer())
with check (user_id = (select auth.uid()) or public.is_developer());

create policy products_select
on public.products for select to authenticated
using (
  (status = 'active')
  or seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
);

create policy products_insert_own
on public.products for insert to authenticated
with check (
  seller_id in (
    select id from public.seller_profiles
    where user_id = (select auth.uid()) and status = 'active'
  )
);

create policy products_update_own_or_admin
on public.products for update to authenticated
using (
  seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
)
with check (
  seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
);

create policy products_delete_own_or_admin
on public.products for delete to authenticated
using (
  seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
);

create policy product_images_select
on public.product_images for select to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (
        p.status = 'active'
        or p.seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
        or public.is_developer()
      )
  )
);

create policy product_images_manage
on public.product_images for all to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (
        p.seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
        or public.is_developer()
      )
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (
        p.seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
        or public.is_developer()
      )
  )
);

create policy carts_own
on public.carts for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy cart_items_own
on public.cart_items for all to authenticated
using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
);

create policy orders_select
on public.orders for select to authenticated
using (
  buyer_id = (select auth.uid())
  or seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
);

create policy orders_insert_buyer
on public.orders for insert to authenticated
with check (buyer_id = (select auth.uid()));

create policy orders_update_participant
on public.orders for update to authenticated
using (
  buyer_id = (select auth.uid())
  or seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
)
with check (
  buyer_id = (select auth.uid())
  or seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
  or public.is_developer()
);

create policy order_items_select
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = (select auth.uid())
        or o.seller_id in (select id from public.seller_profiles where user_id = (select auth.uid()))
        or public.is_developer()
      )
  )
);

create policy order_items_insert
on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.buyer_id = (select auth.uid())
  )
);

-- =========================================================
-- 14. RLS: CHAT
-- =========================================================

create policy conversations_select
on public.conversations for select to authenticated
using (public.is_conversation_participant(id));

create policy conversations_insert
on public.conversations for insert to authenticated
with check (true);

create policy participants_select
on public.conversation_participants for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_conversation_participant(conversation_id)
);

create policy participants_insert
on public.conversation_participants for insert to authenticated
with check (
  public.is_conversation_participant(conversation_id)
  or user_id = (select auth.uid())
);

create policy messages_select
on public.messages for select to authenticated
using (public.is_conversation_participant(conversation_id));

create policy messages_insert
on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_conversation_participant(conversation_id)
);

create policy messages_update_own
on public.messages for update to authenticated
using (sender_id = (select auth.uid()))
with check (sender_id = (select auth.uid()));

-- =========================================================
-- 15. RLS: COMPLAINTS
-- =========================================================

create policy complaint_categories_select
on public.complaint_categories for select to authenticated
using (status = 'active');

create policy complaint_categories_manage
on public.complaint_categories for all to authenticated
using (public.is_developer())
with check (public.is_developer());

create policy complaints_select
on public.complaints for select to authenticated
using (public.can_access_complaint(id));

create policy complaints_insert
on public.complaints for insert to authenticated
with check (reporter_id = (select auth.uid()));

create policy complaints_update
on public.complaints for update to authenticated
using (public.can_access_complaint(id))
with check (public.can_access_complaint(id));

create policy complaint_updates_select
on public.complaint_updates for select to authenticated
using (public.can_access_complaint(complaint_id));

create policy complaint_updates_insert
on public.complaint_updates for insert to authenticated
with check (
  author_id = (select auth.uid())
  and public.can_access_complaint(complaint_id)
);

-- =========================================================
-- 16. AUDIT LOGS
-- =========================================================

create policy audit_logs_select_developer
on public.audit_logs for select to authenticated
using (public.is_developer());

create policy audit_logs_insert_authenticated
on public.audit_logs for insert to authenticated
with check (actor_id = (select auth.uid()));

-- =========================================================
-- 17. STORAGE
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp']),
  ('community-images','community-images',true,10485760,array['image/jpeg','image/png','image/webp']),
  ('complaint-images','complaint-images',false,10485760,array['image/jpeg','image/png','image/webp']),
  ('payment-proofs','payment-proofs',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop any existing storage policies to prevent conflicts
drop policy if exists "avatars_select" on storage.objects;
drop policy if exists "avatars_public_select" on storage.objects;
drop policy if exists "avatars_authenticated_insert" on storage.objects;
drop policy if exists "avatars_authenticated_update" on storage.objects;
drop policy if exists "avatars_authenticated_delete" on storage.objects;
drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

drop policy if exists "product_images_select" on storage.objects;
drop policy if exists "product_images_public_select" on storage.objects;
drop policy if exists "product_images_authenticated_insert" on storage.objects;
drop policy if exists "product_images_authenticated_update" on storage.objects;
drop policy if exists "product_images_authenticated_delete" on storage.objects;
drop policy if exists "product_images_insert" on storage.objects;
drop policy if exists "product_images_update" on storage.objects;
drop policy if exists "product_images_delete" on storage.objects;

drop policy if exists "community_images_select" on storage.objects;
drop policy if exists "community_images_manage" on storage.objects;
drop policy if exists "complaint_images_select" on storage.objects;
drop policy if exists "complaint_images_insert" on storage.objects;
drop policy if exists "complaint_images_delete" on storage.objects;
drop policy if exists "payment_proofs_select" on storage.objects;
drop policy if exists "payment_proofs_insert" on storage.objects;
drop policy if exists "payment_proofs_update" on storage.objects;
drop policy if exists "payment_proofs_delete" on storage.objects;

create policy avatars_select
on storage.objects for select
using (bucket_id = 'avatars');

create policy avatars_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_update
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy product_images_select
on storage.objects for select
using (bucket_id = 'product-images');

create policy product_images_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');

create policy product_images_update
on storage.objects for update to authenticated
using (bucket_id = 'product-images');

create policy product_images_delete
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');

create policy community_images_select
on storage.objects for select
using (bucket_id = 'community-images');

create policy community_images_manage
on storage.objects for all to authenticated
using (bucket_id = 'community-images' and public.is_developer())
with check (bucket_id = 'community-images' and public.is_developer());

create policy complaint_images_select
on storage.objects for select to authenticated
using (
  bucket_id = 'complaint-images'
  and (
    public.is_developer()
    or exists (
      select 1
      from public.complaints c
      where c.id::text = (storage.foldername(name))[1]
        and public.can_access_complaint(c.id)
    )
  )
);

create policy complaint_images_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'complaint-images'
  and public.is_developer() = false
);

create policy complaint_images_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'complaint-images'
  and public.is_developer()
);

create policy payment_proofs_select
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_developer()
    or exists (
      select 1
      from public.due_assignments da
      where da.id::text = (storage.foldername(name))[1]
        and (
          public.can_manage_house(da.house_id)
          or exists (
            select 1 from public.household_members hm
            where hm.house_id = da.house_id and hm.user_id = (select auth.uid()) and hm.status = 'active'
          )
        )
    )
    or exists (
      select 1
      from public.due_payments dp
      where dp.id::text = (storage.foldername(name))[1]
        and (
          dp.paid_by_user_id = (select auth.uid())
          or exists (
            select 1
            from public.due_assignments da
            where da.id = dp.assignment_id
              and public.can_manage_house(da.house_id)
          )
        )
    )
  )
);

create policy payment_proofs_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
);

-- =========================================================
-- 18. SEED DATA
-- =========================================================

insert into public.complex_settings (id, name)
values (1, 'Komplekku')
on conflict (id) do nothing;

insert into public.categories (name, slug, sort_order) values
  ('Makanan','makanan',1),
  ('Minuman','minuman',2),
  ('Sembako','sembako',3),
  ('Fashion','fashion',4),
  ('Elektronik','elektronik',5),
  ('Rumah Tangga','rumah-tangga',6),
  ('Kecantikan','kecantikan',7),
  ('Jasa','jasa',8),
  ('Barang Bekas','barang-bekas',9),
  ('Lainnya','lainnya',10)
on conflict (slug) do nothing;

insert into public.complaint_categories (name, sort_order) values
  ('Keamanan',1),
  ('Kebersihan',2),
  ('Fasilitas',3),
  ('Jalan/Lingkungan',4),
  ('Lampu',5),
  ('Administrasi',6),
  ('Lainnya',7)
on conflict (name) do nothing;

commit;

-- =========================================================
-- IMPORTANT IMPLEMENTATION NOTES
-- =========================================================
-- 1. The mobile app must NEVER receive SUPABASE_SERVICE_ROLE_KEY.
-- 2. Use RPC/Edge Function for atomic checkout and stock decrement.
-- 3. User/role assignment should be done by developer-side workflow.
-- 4. Test RLS with multiple test users before production.
-- 5. Do not use this schema to host multiple complexes in one database.
-- 6. Package A/B/C is a commercial offering; module availability is
--    controlled by deployment config, not shown to residents.
