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
