-- Migration 20260923000004: Unique 7-Digit Family Code for Houses and Profiles

-- 1. Helper function to generate an unambiguous 7-character uppercase alphanumeric code
create or replace function public.generate_family_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  i integer;
  exists_code boolean;
begin
  loop
    result := '';
    for i in 1..7 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    select exists(select 1 from public.houses where family_code = result) into exists_code;
    if not exists_code then
      return result;
    end if;
  end loop;
end;
$$;

-- 2. Add family_code to houses and profiles
alter table public.houses
  add column if not exists family_code text;

alter table public.profiles
  add column if not exists family_code text;

-- 3. Backfill existing houses with unique 7-digit family code
do $$
declare
  h record;
begin
  for h in select id from public.houses where family_code is null loop
    update public.houses
    set family_code = public.generate_family_code()
    where id = h.id;
  end loop;
end $$;

-- 4. Enforce unique index on houses.family_code
create unique index if not exists houses_family_code_idx on public.houses(family_code);

-- 5. Trigger on houses: auto-generate family_code if omitted on insert
create or replace function public.ensure_house_family_code()
returns trigger
language plpgsql
as $$
begin
  if new.family_code is null or trim(new.family_code) = '' then
    new.family_code := public.generate_family_code();
  else
    new.family_code := upper(trim(new.family_code));
  end if;
  return new;
end;
$$;

drop trigger if exists set_house_family_code on public.houses;
create trigger set_house_family_code
  before insert on public.houses
  for each row execute function public.ensure_house_family_code();

-- 6. Backfill existing profiles based on their active household membership
update public.profiles p
set family_code = h.family_code
from public.household_members hm
join public.houses h on h.id = hm.house_id
where hm.user_id = p.id
  and hm.status = 'active'
  and (p.family_code is null or p.family_code != h.family_code);

-- 7. Trigger on household_members: automatically keep profiles.family_code in sync with house.family_code
create or replace function public.sync_profile_family_code()
returns trigger
language plpgsql
as $$
declare
  v_family_code text;
begin
  if new.status = 'active' then
    select family_code into v_family_code from public.houses where id = new.house_id;
    if v_family_code is not null then
      update public.profiles
      set family_code = v_family_code
      where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_household_profile_family_code on public.household_members;
create trigger sync_household_profile_family_code
  after insert or update on public.household_members
  for each row execute function public.sync_profile_family_code();

-- 8. RPC function for resident (e.g. child, spouse) to join a family by 7-digit code
create or replace function public.join_family_by_code(p_user_id uuid, p_family_code text)
returns json
language plpgsql
security definer
as $$
declare
  v_house record;
  v_user_profile record;
  v_cleaned_code text;
begin
  -- Validate code
  v_cleaned_code := upper(trim(p_family_code));
  if length(v_cleaned_code) != 7 then
    raise exception 'ID Keluarga harus terdiri dari 7 karakter.';
  end if;

  -- Find house
  select * into v_house from public.houses where family_code = v_cleaned_code;
  if not found then
    raise exception 'ID Keluarga % tidak ditemukan.', v_cleaned_code;
  end if;

  -- Get user profile
  select * into v_user_profile from public.profiles where id = p_user_id;
  if not found then
    raise exception 'Profil pengguna tidak ditemukan.';
  end if;

  -- Update profile with family_code
  update public.profiles
  set family_code = v_cleaned_code
  where id = p_user_id;

  -- Upsert household_members
  insert into public.household_members (house_id, user_id, relationship, is_primary, status, joined_at)
  values (v_house.id, p_user_id, 'family', false, 'active', now())
  on conflict (house_id, user_id)
  do update set
    relationship = 'family',
    status = 'active',
    updated_at = now();

  -- If house was vacant, set to occupied
  update public.houses
  set status = 'occupied', updated_at = now()
  where id = v_house.id and status = 'vacant';

  -- If there is an existing family_members entry matching this person's name or unlinked, link user_id
  update public.family_members
  set user_id = p_user_id, updated_at = now()
  where house_id = v_house.id
    and user_id is null
    and (lower(full_name) = lower(v_user_profile.full_name) or (phone is not null and phone = v_user_profile.phone));

  return json_build_object(
    'success', true,
    'house_id', v_house.id,
    'family_code', v_cleaned_code,
    'house_number', v_house.house_number,
    'block', v_house.block
  );
end;
$$;
