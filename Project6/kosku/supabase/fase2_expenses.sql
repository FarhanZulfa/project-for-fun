-- ====================================================================
-- SKEMA FASE 2: TABEL EXPENSES (PENGELUARAN OPERASIONAL KOS)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in ('listrik', 'air', 'pemeliharaan', 'kebersihan', 'gaji', 'lainnya')
  ),
  description text not null,
  amount numeric not null check (amount > 0),
  expense_date date not null default current_date,
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz default now()
);

-- Index untuk mempercepat query berdasarkan tanggal
create index if not exists idx_expenses_date on public.expenses(expense_date);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================
alter table public.expenses enable row level security;

-- Drop policies jika ada
drop policy if exists "Authenticated users can view expenses" on public.expenses;
drop policy if exists "Admins can manage expenses" on public.expenses;

-- Semua authenticated user (keluarga) bisa membaca data pengeluaran
create policy "Authenticated users can view expenses"
  on public.expenses for select
  using (auth.role() = 'authenticated');

-- Hanya Admin yang bisa menambah, mengubah, atau menghapus pengeluaran
create policy "Admins can manage expenses"
  on public.expenses for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
    or not exists (select 1 from public.profiles where role = 'admin')
  );
