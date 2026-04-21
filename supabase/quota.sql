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

create or replace function public.consume_daily_quota_guarded(
  p_primary_hash text,
  p_day_key date,
  p_sheet_count integer,
  p_primary_limit integer,
  p_guard_hash text default null,
  p_guard_limit integer default null
)
returns table (
  allowed boolean,
  reason text,
  used_sheets integer,
  next_used_sheets integer,
  guard_used_sheets integer,
  guard_next_used_sheets integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_primary_used integer;
  v_guard_used integer := 0;
  v_has_guard boolean := p_guard_hash is not null and p_guard_hash <> '' and p_guard_hash <> p_primary_hash;
begin
  if p_sheet_count <= 0 then
    raise exception 'p_sheet_count must be greater than 0';
  end if;

  if p_primary_limit < 0 then
    raise exception 'p_primary_limit must be greater than or equal to 0';
  end if;

  if v_has_guard and (p_guard_limit is null or p_guard_limit < 0) then
    raise exception 'p_guard_limit must be greater than or equal to 0 when p_guard_hash is set';
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
    p_primary_hash,
    p_day_key,
    0,
    v_now,
    v_now,
    v_now
  )
  on conflict (fingerprint_hash, day_key) do update
    set updated_at = excluded.updated_at,
        last_seen_at = excluded.last_seen_at;

  if v_has_guard then
    insert into public.daily_quota_usage (
      fingerprint_hash,
      day_key,
      used_sheets,
      created_at,
      updated_at,
      last_seen_at
    )
    values (
      p_guard_hash,
      p_day_key,
      0,
      v_now,
      v_now,
      v_now
    )
    on conflict (fingerprint_hash, day_key) do update
      set updated_at = excluded.updated_at,
          last_seen_at = excluded.last_seen_at;
  end if;

  select daily_quota_usage.used_sheets
  into v_primary_used
  from public.daily_quota_usage
  where fingerprint_hash = p_primary_hash
    and day_key = p_day_key
  for update;

  if v_has_guard then
    select daily_quota_usage.used_sheets
    into v_guard_used
    from public.daily_quota_usage
    where fingerprint_hash = p_guard_hash
      and day_key = p_day_key
    for update;
  end if;

  if v_primary_used + p_sheet_count > p_primary_limit then
    return query
    select false, 'quota-exceeded', v_primary_used, v_primary_used, v_guard_used, v_guard_used;
    return;
  end if;

  if v_has_guard and v_guard_used + p_sheet_count > coalesce(p_guard_limit, 0) then
    return query
    select false, 'abuse-limit', v_primary_used, v_primary_used, v_guard_used, v_guard_used;
    return;
  end if;

  update public.daily_quota_usage
  set used_sheets = daily_quota_usage.used_sheets + p_sheet_count,
      updated_at = v_now,
      last_seen_at = v_now
  where fingerprint_hash = p_primary_hash
    and day_key = p_day_key;

  if v_has_guard then
    update public.daily_quota_usage
    set used_sheets = daily_quota_usage.used_sheets + p_sheet_count,
        updated_at = v_now,
        last_seen_at = v_now
    where fingerprint_hash = p_guard_hash
      and day_key = p_day_key;
  end if;

  return query
  select true,
         null::text,
         v_primary_used,
         v_primary_used + p_sheet_count,
         v_guard_used,
         case when v_has_guard then v_guard_used + p_sheet_count else v_guard_used end;
end;
$$;

grant execute on function public.consume_daily_quota_guarded(text, date, integer, integer, text, integer) to service_role;

create table if not exists public.rate_limit_usage (
  bucket_hash text not null,
  window_key text not null,
  hits integer not null default 0 check (hits >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (bucket_hash, window_key)
);

create index if not exists rate_limit_usage_updated_at_idx on public.rate_limit_usage (updated_at desc);

create or replace function public.consume_rate_limit(
  p_bucket_hash text,
  p_window_key text,
  p_limit integer
)
returns table (
  allowed boolean,
  hits integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_hits integer;
begin
  if p_limit <= 0 then
    raise exception 'p_limit must be greater than 0';
  end if;

  insert into public.rate_limit_usage (
    bucket_hash,
    window_key,
    hits,
    created_at,
    updated_at
  )
  values (
    p_bucket_hash,
    p_window_key,
    1,
    v_now,
    v_now
  )
  on conflict (bucket_hash, window_key) do update
    set hits = public.rate_limit_usage.hits + 1,
        updated_at = excluded.updated_at
  returning public.rate_limit_usage.hits into v_hits;

  return query
  select v_hits <= p_limit, v_hits;
end;
$$;

grant execute on function public.consume_rate_limit(text, text, integer) to service_role;
