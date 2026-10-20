create table if not exists public.gifts (
  share_id text primary key check (share_id ~ '^[A-Za-z0-9_-]{20,80}$'),
  config jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.gifts enable row level security;
revoke all on table public.gifts from anon, authenticated;

drop policy if exists "deny direct gifts access" on public.gifts;
create policy "deny direct gifts access"
on public.gifts
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.save_gift(p_share_id text, p_config jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_share_id is null or p_share_id !~ '^[A-Za-z0-9_-]{20,80}$' then
    raise exception 'Invalid share id';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'Invalid gift config';
  end if;

  insert into public.gifts (share_id, config)
  values (p_share_id, p_config)
  on conflict (share_id) do update
    set config = excluded.config,
        updated_at = timezone('utc', now());
end;
$$;

create or replace function public.get_gift(p_share_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select config
  from public.gifts
  where share_id = p_share_id
  limit 1;
$$;

revoke execute on function public.save_gift(text, jsonb) from public, anon, authenticated;
revoke execute on function public.get_gift(text) from public, anon, authenticated;
grant execute on function public.save_gift(text, jsonb) to anon, authenticated;
grant execute on function public.get_gift(text) to anon, authenticated;
