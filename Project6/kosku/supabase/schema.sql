-- ====================================================================
-- SKEMA DATABASE KOSKU (Sistem Manajemen Kos Keluarga)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. TABEL PROFILES (Ekstensi user dari Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz default now()
);

-- 2. TABEL ROOMS (Kamar Kos: AC / Kipas)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  room_type text not null default 'kipas' check (room_type in ('ac', 'kipas')),
  monthly_price numeric not null,
  status text not null default 'kosong' check (status in ('kosong', 'terisi', 'maintenance')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABEL TENANTS (Penyewa: soft-delete lewat is_active)
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  full_name text not null,
  phone_number text,
  id_number text,
  move_in_date date not null,
  move_out_date date,
  rent_cycle text default 'bulanan',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. TABEL PAYMENTS (Sewa, Listrik, Air)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  payment_type text not null default 'sewa' check (payment_type in ('sewa', 'listrik', 'air')),
  amount numeric not null,
  due_date date not null,
  paid_date date,
  status text not null default 'belum_bayar' check (status in ('lunas', 'belum_bayar', 'telat')),
  payment_method text,
  notes text,
  created_at timestamptz default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.tenants enable row level security;
alter table public.payments enable row level security;

-- Drop policies jika sudah ada sebelumnya agar idempotent
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated users can view rooms" on public.rooms;
drop policy if exists "Admins can manage rooms" on public.rooms;
drop policy if exists "Authenticated users can view tenants" on public.tenants;
drop policy if exists "Admins can manage tenants" on public.tenants;
drop policy if exists "Authenticated users can view payments" on public.payments;
drop policy if exists "Admins can manage payments" on public.payments;

-- Profiles: semua authenticated user bisa baca, user bisa update dirinya sendiri
create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Rooms: semua authenticated user bisa baca, admin bisa kelola
create policy "Authenticated users can view rooms"
  on public.rooms for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage rooms"
  on public.rooms for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
    or not exists (select 1 from public.profiles where role = 'admin')
  );

-- Tenants: semua authenticated user bisa baca, admin bisa kelola
create policy "Authenticated users can view tenants"
  on public.tenants for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage tenants"
  on public.tenants for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
    or not exists (select 1 from public.profiles where role = 'admin')
  );

-- Payments: semua authenticated user bisa baca, admin bisa kelola
create policy "Authenticated users can view payments"
  on public.payments for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage payments"
  on public.payments for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
    or not exists (select 1 from public.profiles where role = 'admin')
  );

-- ====================================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================================

-- Trigger: auto-create profile saat ada user baru sign up di auth.users
-- User pertama otomatis jadi 'admin', user berikutnya jadi 'viewer'
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles where role = 'admin') into is_first_user;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when is_first_user then 'admin' else 'viewer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: auto-update updated_at kolom
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
  before update on public.rooms
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at
  before update on public.tenants
  for each row execute procedure public.set_updated_at();

-- ====================================================================
-- DATA AWAL (SEED 20 KAMAR KOS)
-- ====================================================================
-- Kamar 101 - 110: Tipe AC (Rp 1.500.000 / bulan)
-- Kamar 201 - 210: Tipe Kipas (Rp 900.000 / bulan)
insert into public.rooms (room_number, room_type, monthly_price, status)
values
  ('101', 'ac', 1500000, 'kosong'),
  ('102', 'ac', 1500000, 'kosong'),
  ('103', 'ac', 1500000, 'kosong'),
  ('104', 'ac', 1500000, 'kosong'),
  ('105', 'ac', 1500000, 'kosong'),
  ('106', 'ac', 1500000, 'kosong'),
  ('107', 'ac', 1500000, 'kosong'),
  ('108', 'ac', 1500000, 'kosong'),
  ('109', 'ac', 1500000, 'kosong'),
  ('110', 'ac', 1500000, 'kosong'),
  ('201', 'kipas', 900000, 'kosong'),
  ('202', 'kipas', 900000, 'kosong'),
  ('203', 'kipas', 900000, 'kosong'),
  ('204', 'kipas', 900000, 'kosong'),
  ('205', 'kipas', 900000, 'kosong'),
  ('206', 'kipas', 900000, 'kosong'),
  ('207', 'kipas', 900000, 'kosong'),
  ('208', 'kipas', 900000, 'kosong'),
  ('209', 'kipas', 900000, 'kosong'),
  ('210', 'kipas', 900000, 'kosong')
on conflict (room_number) do nothing;
