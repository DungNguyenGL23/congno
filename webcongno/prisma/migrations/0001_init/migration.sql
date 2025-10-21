-- Enable required extensions
create extension if not exists "pgcrypto";

-- Profiles table stores onboarding information for each Supabase user.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  bank_code text,
  bank_account text,
  bank_owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text;

create unique index if not exists profiles_email_key
  on public.profiles(email)
  where email is not null;

alter table public.profiles enable row level security;

drop policy if exists "Users manage their profile" on public.profiles;
drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users insert their profile" on public.profiles;
create policy "Users insert their profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Expenses created by a profile (one per Supabase user).
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  amount numeric(16, 2) not null,
  note text,
  paid_at date,
  created_at timestamptz not null default now()
);

create index if not exists expenses_created_by_idx
  on public.expenses(created_by);

alter table public.expenses enable row level security;

drop policy if exists "Owners manage expenses" on public.expenses;
create policy "Owners manage expenses"
  on public.expenses
  for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'expenses_created_by_fkey'
  ) then
    alter table public.expenses
      drop constraint expenses_created_by_fkey;
  end if;
end $$;

alter table public.expenses
  add constraint expenses_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete cascade;

-- Debtors linked to expenses.
create table if not exists public.expense_debtors (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  debtor_email text not null,
  debtor_name text,
  owed_amount numeric(16, 2),
  created_at timestamptz not null default now()
);

alter table public.expense_debtors
  add column if not exists debtor_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expense_debtors_debtor_id_fkey'
  ) then
    alter table public.expense_debtors
      add constraint expense_debtors_debtor_id_fkey
      foreign key (debtor_id) references public.profiles(id) on delete set null;
  end if;
end $$;

create index if not exists expense_debtors_expense_id_idx
  on public.expense_debtors(expense_id);

create index if not exists expense_debtors_debtor_id_idx
  on public.expense_debtors(debtor_id);

alter table public.expense_debtors enable row level security;

drop policy if exists "Expense owners manage debtor list" on public.expense_debtors;
create policy "Expense owners manage debtor list"
  on public.expense_debtors
  for all
  using (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id and e.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id and e.created_by = auth.uid()
    )
  );
