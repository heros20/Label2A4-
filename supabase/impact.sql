create table if not exists public.label_impact_counters (
  scope_type text not null check (scope_type in ('guest', 'account', 'platform')),
  scope_hash text not null,
  labels_optimized integer not null default 0 check (labels_optimized >= 0),
  optimized_sheets integer not null default 0 check (optimized_sheets >= 0),
  sheets_saved integer not null default 0 check (sheets_saved >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope_type, scope_hash)
);

create index if not exists label_impact_counters_platform_idx
  on public.label_impact_counters (scope_type, updated_at desc);

create or replace function public.record_label_impact(
  p_scope_type text,
  p_scope_hash text,
  p_labels_optimized integer,
  p_optimized_sheets integer,
  p_sheets_saved integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
begin
  if p_scope_type not in ('guest', 'account') then
    raise exception 'invalid impact scope';
  end if;

  if p_labels_optimized < 0 or p_optimized_sheets < 0 or p_sheets_saved < 0 then
    raise exception 'impact counters must be positive';
  end if;

  insert into public.label_impact_counters (
    scope_type,
    scope_hash,
    labels_optimized,
    optimized_sheets,
    sheets_saved,
    created_at,
    updated_at
  )
  values (
    p_scope_type,
    p_scope_hash,
    p_labels_optimized,
    p_optimized_sheets,
    p_sheets_saved,
    v_now,
    v_now
  )
  on conflict (scope_type, scope_hash) do update
    set labels_optimized = label_impact_counters.labels_optimized + excluded.labels_optimized,
        optimized_sheets = label_impact_counters.optimized_sheets + excluded.optimized_sheets,
        sheets_saved = label_impact_counters.sheets_saved + excluded.sheets_saved,
        updated_at = excluded.updated_at;

  insert into public.label_impact_counters (
    scope_type,
    scope_hash,
    labels_optimized,
    optimized_sheets,
    sheets_saved,
    created_at,
    updated_at
  )
  values (
    'platform',
    'global',
    p_labels_optimized,
    p_optimized_sheets,
    p_sheets_saved,
    v_now,
    v_now
  )
  on conflict (scope_type, scope_hash) do update
    set labels_optimized = label_impact_counters.labels_optimized + excluded.labels_optimized,
        optimized_sheets = label_impact_counters.optimized_sheets + excluded.optimized_sheets,
        sheets_saved = label_impact_counters.sheets_saved + excluded.sheets_saved,
        updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.record_label_impact(text, text, integer, integer, integer) to service_role;

