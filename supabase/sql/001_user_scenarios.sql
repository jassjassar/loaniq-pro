create extension if not exists pgcrypto;

create table if not exists public.user_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  label text not null check (char_length(label) between 1 and 80),
  principal numeric(14, 2) not null check (principal > 0),
  annual_rate numeric(6, 3) not null check (annual_rate >= 0 and annual_rate <= 100),
  term_months integer not null check (term_months between 1 and 480),
  extra_monthly_payment numeric(14, 2) not null default 0 check (extra_monthly_payment >= 0),
  income_monthly numeric(14, 2) not null check (income_monthly > 0),
  debt_monthly numeric(14, 2) not null default 0 check (debt_monthly >= 0),
  credit_score integer not null check (credit_score between 300 and 850),
  approval_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_scenarios enable row level security;
alter table public.user_scenarios force row level security;

create policy "Users can read their own scenarios"
on public.user_scenarios
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own scenarios"
on public.user_scenarios
for insert
to authenticated
with check (auth.uid() = user_id and approval_result = '{}'::jsonb);

create policy "Users can delete their own scenarios"
on public.user_scenarios
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists user_scenarios_user_created_idx
on public.user_scenarios (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_scenarios_updated_at on public.user_scenarios;

create trigger set_user_scenarios_updated_at
before update on public.user_scenarios
for each row
execute function public.set_updated_at();
