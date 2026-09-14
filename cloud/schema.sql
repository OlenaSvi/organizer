-- Организатор: одна строка на человека — все его данные целиком.
-- Выполняется один раз в Supabase → SQL Editor. Повторный запуск безвреден.

create table if not exists public.states (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb        not null,
  rev        integer      not null default 1,
  updated_at timestamptz  not null default now(),
  device     text         not null default ''
);

-- Каждому видна и доступна только своя строка. Это правило базы,
-- а не обещание в коде: чужую строку не прочитать даже нарочно.
alter table public.states enable row level security;

drop policy if exists "own row: read"   on public.states;
drop policy if exists "own row: insert" on public.states;
drop policy if exists "own row: update" on public.states;
drop policy if exists "own row: delete" on public.states;

create policy "own row: read"   on public.states for select using (auth.uid() = user_id);
create policy "own row: insert" on public.states for insert with check (auth.uid() = user_id);
create policy "own row: update" on public.states for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own row: delete" on public.states for delete using (auth.uid() = user_id);
