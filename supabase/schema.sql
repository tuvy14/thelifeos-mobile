-- TheLifeOS — cloud sync schema
-- ───────────────────────────────────────────────────────────────────────────
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query →
-- paste this whole file → Run. It is idempotent, so re-running is safe.
--
-- The mobile + web apps share ONE row per user in `user_state`. The synced
-- document is { shortKey: rawJsonString } for each lifeos_ slice. `updated_at`
-- is stamped SERVER-SIDE by a trigger so "who's newer" never trusts a device
-- clock. Row Level Security ensures each user can only ever touch their own row.
-- See src/lib/sync.tsx (TABLE = "user_state", upsert onConflict "user_id").
-- ───────────────────────────────────────────────────────────────────────────

-- 1. The table: one row per authenticated user.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Server-side updated_at stamp (fires on every insert/update, incl. upserts).
create or replace function public.set_user_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_state_set_updated_at on public.user_state;
create trigger user_state_set_updated_at
  before insert or update on public.user_state
  for each row execute function public.set_user_state_updated_at();

-- 3. Row Level Security — a user may only read/write their own row.
alter table public.user_state enable row level security;

drop policy if exists "user_state_select_own" on public.user_state;
create policy "user_state_select_own" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "user_state_insert_own" on public.user_state;
create policy "user_state_insert_own" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_state_update_own" on public.user_state;
create policy "user_state_update_own" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- (No delete policy by design — the app never deletes the row; account deletion
--  cascades it away automatically.)
