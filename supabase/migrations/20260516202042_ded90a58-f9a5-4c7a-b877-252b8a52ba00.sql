
-- PROFILES
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text unique not null,
  business_name text not null,
  bio text,
  avatar_url text,
  whatsapp_phone text,
  instagram_url text,
  theme jsonb not null default '{"accent":"#a8543a","font":"serif","bg":"#fafaf7"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles owner insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles owner update" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles owner delete" on public.profiles for delete using (auth.uid() = user_id);

-- STAFF
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  role text,
  avatar_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;
create policy "staff public read" on public.staff for select using (true);
create policy "staff owner all" on public.staff for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- BUTTONS (link-in-bio actions)
create table public.buttons (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(user_id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('whatsapp','catalog','link','instagram','booking')),
  value text,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.buttons enable row level security;
create policy "buttons public read" on public.buttons for select using (true);
create policy "buttons owner all" on public.buttons for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- CATALOG ITEMS (services)
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(user_id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  name text not null,
  description text,
  duration_min int not null default 60,
  price_cents int,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.catalog_items enable row level security;
create policy "catalog public read" on public.catalog_items for select using (true);
create policy "catalog owner all" on public.catalog_items for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- BLOCKED SLOTS
create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(user_id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.blocked_slots enable row level security;
create policy "blocks public read" on public.blocked_slots for select using (true);
create policy "blocks owner all" on public.blocked_slots for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- BOOKINGS
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(user_id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  service_name text not null,
  customer_name text not null,
  customer_phone text not null,
  notes text,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','done')),
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "bookings public insert" on public.bookings for insert with check (true);
create policy "bookings owner read" on public.bookings for select using (auth.uid() = profile_id);
create policy "bookings owner update" on public.bookings for update using (auth.uid() = profile_id);
create policy "bookings owner delete" on public.bookings for delete using (auth.uid() = profile_id);

create index on public.staff(profile_id);
create index on public.buttons(profile_id);
create index on public.catalog_items(profile_id);
create index on public.blocked_slots(staff_id, start_ts);
create index on public.bookings(staff_id, start_ts);

-- Auto-create profile after signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  n int := 0;
begin
  base_slug := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email,'@',1)), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'studio'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;
  insert into public.profiles (user_id, slug, business_name)
  values (new.id, final_slug, coalesce(new.raw_user_meta_data->>'business_name', 'Meu Studio'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
