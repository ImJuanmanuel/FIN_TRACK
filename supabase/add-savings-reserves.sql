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

drop trigger if exists savings_reserves_set_updated_at on public.savings_reserves;
create trigger savings_reserves_set_updated_at
before update on public.savings_reserves
for each row execute function public.set_updated_at();

alter table public.savings_reserves enable row level security;

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
