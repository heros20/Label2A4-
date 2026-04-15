create table if not exists public.daily_quota_usage (
  fingerprint_hash text not null,
  day_key date not null,
  used_sheets integer not null default 0 check (used_sheets >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  primary key (fingerprint_hash, day_key)
);

create index if not exists daily_quota_usage_day_key_idx on public.daily_quota_usage (day_key);
create index if not exists daily_quota_usage_last_seen_at_idx on public.daily_quota_usage (last_seen_at desc);

create or replace function public.consume_daily_quota(
  p_fingerprint_hash text,
  p_day_key date,
  p_sheet_count integer,
  p_daily_limit integer
)
returns table (
  allowed boolean,
  used_sheets integer,
  next_used_sheets integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_updated_used integer;
  v_current_used integer;
begin
  if p_sheet_count <= 0 then
    raise exception 'p_sheet_count must be greater than 0';
  end if;

  if p_daily_limit < 0 then
    raise exception 'p_daily_limit must be greater than or equal to 0';
  end if;

  insert into public.daily_quota_usage (
    fingerprint_hash,
    day_key,
    used_sheets,
    created_at,
    updated_at,
    last_seen_at
  )
  values (
    p_fingerprint_hash,
    p_day_key,
    0,
    v_now,
    v_now,
    v_now
  )
  on conflict (fingerprint_hash, day_key) do update
    set updated_at = excluded.updated_at,
        last_seen_at = excluded.last_seen_at;

  update public.daily_quota_usage
  set used_sheets = daily_quota_usage.used_sheets + p_sheet_count,
      updated_at = v_now,
      last_seen_at = v_now
  where fingerprint_hash = p_fingerprint_hash
    and day_key = p_day_key
    and daily_quota_usage.used_sheets + p_sheet_count <= p_daily_limit
  returning daily_quota_usage.used_sheets into v_updated_used;

  if found then
    return query
    select true, v_updated_used - p_sheet_count, v_updated_used;
    return;
  end if;

  select daily_quota_usage.used_sheets
  into v_current_used
  from public.daily_quota_usage
  where fingerprint_hash = p_fingerprint_hash
    and day_key = p_day_key;

  return query
  select false, coalesce(v_current_used, 0), coalesce(v_current_used, 0);
end;
$$;

grant execute on function public.consume_daily_quota(text, date, integer, integer) to service_role;
