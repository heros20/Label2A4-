create table if not exists public.exported_document_usage (
  fingerprint_hash text not null,
  export_id text not null,
  day_key date not null,
  sheet_count integer not null default 0 check (sheet_count >= 0),
  first_action text not null check (first_action in ('download', 'print')),
  file_name text,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  primary key (fingerprint_hash, export_id)
);

create index if not exists exported_document_usage_day_key_idx on public.exported_document_usage (day_key);
create index if not exists exported_document_usage_last_seen_at_idx on public.exported_document_usage (last_seen_at desc);

create or replace function public.consume_daily_quota_guarded_once(
  p_primary_hash text,
  p_day_key date,
  p_export_id text,
  p_sheet_count integer,
  p_primary_limit integer,
  p_guard_hash text default null,
  p_guard_limit integer default null,
  p_action text default 'download',
  p_file_name text default null
)
returns table (
  allowed boolean,
  reason text,
  used_sheets integer,
  next_used_sheets integer,
  guard_used_sheets integer,
  guard_next_used_sheets integer,
  already_exported boolean,
  consumed_sheets integer
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
  v_existing_sheet_count integer;
begin
  if p_sheet_count <= 0 then
    raise exception 'p_sheet_count must be greater than 0';
  end if;

  if p_primary_limit < 0 then
    raise exception 'p_primary_limit must be greater than or equal to 0';
  end if;

  if p_export_id is null or btrim(p_export_id) = '' then
    raise exception 'p_export_id must not be empty';
  end if;

  if p_action not in ('download', 'print') then
    raise exception 'p_action must be download or print';
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

  select exported_document_usage.sheet_count
  into v_existing_sheet_count
  from public.exported_document_usage
  where fingerprint_hash = p_primary_hash
    and export_id = p_export_id
  for update;

  if found then
    update public.exported_document_usage
    set last_seen_at = v_now
    where fingerprint_hash = p_primary_hash
      and export_id = p_export_id;

    return query
    select true,
           null::text,
           v_primary_used,
           v_primary_used,
           v_guard_used,
           v_guard_used,
           true,
           0;
    return;
  end if;

  if v_primary_used + p_sheet_count > p_primary_limit then
    return query
    select false, 'quota-exceeded', v_primary_used, v_primary_used, v_guard_used, v_guard_used, false, 0;
    return;
  end if;

  if v_has_guard and v_guard_used + p_sheet_count > coalesce(p_guard_limit, 0) then
    return query
    select false, 'abuse-limit', v_primary_used, v_primary_used, v_guard_used, v_guard_used, false, 0;
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

  insert into public.exported_document_usage (
    fingerprint_hash,
    export_id,
    day_key,
    sheet_count,
    first_action,
    file_name,
    created_at,
    last_seen_at
  )
  values (
    p_primary_hash,
    p_export_id,
    p_day_key,
    p_sheet_count,
    p_action,
    left(p_file_name, 255),
    v_now,
    v_now
  );

  return query
  select true,
         null::text,
         v_primary_used,
         v_primary_used + p_sheet_count,
         v_guard_used,
         case when v_has_guard then v_guard_used + p_sheet_count else v_guard_used end,
         false,
         p_sheet_count;
end;
$$;

grant execute on function public.consume_daily_quota_guarded_once(text, date, text, integer, integer, text, integer, text, text) to service_role;
