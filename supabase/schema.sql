create extension if not exists pgcrypto;

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'MXN' check (currency in ('USD', 'MXN')),
  exchange_rate numeric(12, 4) not null default 1 check (exchange_rate > 0),
  converted_to_mxn boolean not null default false,
  category text not null check (
    category in (
      'Ingreso',
      'Comida',
      'Transporte',
      'Vivienda',
      'Servicios',
      'Entretenimiento',
      'Salud',
      'Otros'
    )
  ),
  description text not null,
  movement_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.movements
  add column if not exists currency text not null default 'MXN';

alter table public.movements
  add column if not exists exchange_rate numeric(12, 4) not null default 1;

alter table public.movements
  add column if not exists converted_to_mxn boolean not null default false;

alter table public.movements
  alter column currency set default 'MXN';

alter table public.movements
  alter column converted_to_mxn set default false;

update public.movements
set currency = 'MXN'
where currency is null;

update public.movements
set exchange_rate = 1
where exchange_rate is null or exchange_rate <= 0;

alter table public.movements
  drop constraint if exists movements_currency_check;

alter table public.movements
  add constraint movements_currency_check check (currency in ('USD', 'MXN'));

alter table public.movements
  drop constraint if exists movements_exchange_rate_check;

alter table public.movements
  add constraint movements_exchange_rate_check check (exchange_rate > 0);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_month date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, budget_month)
);

create table if not exists public.savings_reserves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'MXN' check (currency in ('USD', 'MXN')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movements_user_date_idx
  on public.movements (user_id, movement_date desc);

create index if not exists monthly_budgets_user_month_idx
  on public.monthly_budgets (user_id, budget_month desc);

create index if not exists savings_reserves_user_created_idx
  on public.savings_reserves (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists movements_set_updated_at on public.movements;
create trigger movements_set_updated_at
before update on public.movements
for each row execute function public.set_updated_at();

drop trigger if exists monthly_budgets_set_updated_at on public.monthly_budgets;
create trigger monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function public.set_updated_at();

drop trigger if exists savings_reserves_set_updated_at on public.savings_reserves;
create trigger savings_reserves_set_updated_at
before update on public.savings_reserves
for each row execute function public.set_updated_at();

alter table public.movements enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.savings_reserves enable row level security;

drop policy if exists "Users can read their movements" on public.movements;
create policy "Users can read their movements"
on public.movements for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their movements" on public.movements;
create policy "Users can insert their movements"
on public.movements for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their movements" on public.movements;
create policy "Users can update their movements"
on public.movements for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their movements" on public.movements;
create policy "Users can delete their movements"
on public.movements for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their budgets" on public.monthly_budgets;
create policy "Users can read their budgets"
on public.monthly_budgets for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their budgets" on public.monthly_budgets;
create policy "Users can insert their budgets"
on public.monthly_budgets for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their budgets" on public.monthly_budgets;
create policy "Users can update their budgets"
on public.monthly_budgets for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their budgets" on public.monthly_budgets;
create policy "Users can delete their budgets"
on public.monthly_budgets for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their savings reserves" on public.savings_reserves;
create policy "Users can read their savings reserves"
on public.savings_reserves for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their savings reserves" on public.savings_reserves;
create policy "Users can insert their savings reserves"
on public.savings_reserves for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their savings reserves" on public.savings_reserves;
create policy "Users can update their savings reserves"
on public.savings_reserves for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their savings reserves" on public.savings_reserves;
create policy "Users can delete their savings reserves"
on public.savings_reserves for delete
to authenticated
using (auth.uid() = user_id);
