-- One row per user, mirroring the app's existing local persistence model:
-- AppProvider already treats the whole AppData object as one atomic blob
-- saved on every change, so the server side matches that shape exactly
-- rather than normalising into per-log-type tables. Simpler schema, simpler
-- sync logic, no joins — this app has no need to query individual logs
-- server-side.

create table public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- A user can only ever see or touch their own row. This is the entire
-- privacy boundary for synced data — the anon key is safe to ship in the
-- client build because RLS, not secrecy, is what enforces isolation.
create policy "select own row" on public.user_data
  for select using (auth.uid() = user_id);

create policy "insert own row" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "update own row" on public.user_data
  for update using (auth.uid() = user_id);

create policy "delete own row" on public.user_data
  for delete using (auth.uid() = user_id);
