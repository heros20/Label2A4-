create extension if not exists pgcrypto;

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  kind text not null check (kind in ('percent', 'fixed', 'trial')),
  discount_value integer check (discount_value is null or discount_value >= 0),
  trial_days integer check (trial_days is null or trial_days > 0),
  currency text not null default 'eur',
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_identity integer check (max_redemptions_per_identity is null or max_redemptions_per_identity > 0),
  applies_to_plans text[] not null default array['monthly', 'annual', 'day-pass'],
  stripe_coupon_id text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint promo_codes_kind_value_check check (
    (kind = 'percent' and discount_value between 1 and 100 and trial_days is null)
    or (kind = 'fixed' and discount_value > 0 and trial_days is null)
    or (kind = 'trial' and coalesce(trial_days, 7) > 0)
  )
);

create unique index if not exists promo_codes_code_upper_idx on public.promo_codes (upper(code));
create index if not exists promo_codes_active_dates_idx on public.promo_codes (active, starts_at, expires_at);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  redeemer_hash text not null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  plan_id text not null check (plan_id in ('monthly', 'annual', 'day-pass')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'void')),
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  amount_discount_cents integer not null default 0 check (amount_discount_cents >= 0),
  trial_days integer check (trial_days is null or trial_days > 0),
  expires_at timestamptz not null default timezone('utc', now()) + interval '30 minutes',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists promo_code_redemptions_code_status_idx
  on public.promo_code_redemptions (promo_code_id, status, created_at desc);

create index if not exists promo_code_redemptions_identity_idx
  on public.promo_code_redemptions (promo_code_id, redeemer_hash, status);

create or replace function public.reserve_promo_code(
  p_code text,
  p_redeemer_hash text,
  p_plan_id text,
  p_user_id uuid,
  p_anonymous_id text,
  p_amount_discount_cents integer,
  p_trial_days integer
)
returns table (
  status text,
  message text,
  redemption_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_promo public.promo_codes%rowtype;
  v_total_count integer;
  v_identity_count integer;
  v_redemption_id uuid;
begin
  update public.promo_code_redemptions
  set status = 'expired',
      updated_at = v_now
  where status = 'pending'
    and expires_at <= v_now;

  select *
  into v_promo
  from public.promo_codes
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    return query select 'invalid', 'Code promo invalide.', null::uuid;
    return;
  end if;

  if not v_promo.active then
    return query select 'inactive', 'Ce code promo n''est pas actif.', null::uuid;
    return;
  end if;

  if v_promo.starts_at is not null and v_promo.starts_at > v_now then
    return query select 'not_started', 'Ce code promo n''est pas encore disponible.', null::uuid;
    return;
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at <= v_now then
    return query select 'expired', 'Ce code promo est expiré.', null::uuid;
    return;
  end if;

  if not p_plan_id = any(v_promo.applies_to_plans) or (v_promo.kind = 'trial' and p_plan_id = 'day-pass') then
    return query select 'incompatible_plan', 'Ce code promo n''est pas compatible avec cette offre.', null::uuid;
    return;
  end if;

  select count(*)
  into v_total_count
  from public.promo_code_redemptions
  where promo_code_id = v_promo.id
    and status in ('pending', 'completed');

  if v_promo.max_redemptions is not null and v_total_count >= v_promo.max_redemptions then
    return query select 'exhausted', 'Ce code promo a atteint sa limite d''utilisation.', null::uuid;
    return;
  end if;

  select count(*)
  into v_identity_count
  from public.promo_code_redemptions
  where promo_code_id = v_promo.id
    and redeemer_hash = p_redeemer_hash
    and status in ('pending', 'completed');

  if v_promo.max_redemptions_per_identity is not null and v_identity_count >= v_promo.max_redemptions_per_identity then
    return query select 'already_used', 'Ce code promo a déjà été utilisé.', null::uuid;
    return;
  end if;

  insert into public.promo_code_redemptions (
    promo_code_id,
    redeemer_hash,
    user_id,
    anonymous_id,
    plan_id,
    amount_discount_cents,
    trial_days,
    expires_at,
    created_at,
    updated_at
  )
  values (
    v_promo.id,
    p_redeemer_hash,
    p_user_id,
    p_anonymous_id,
    p_plan_id,
    coalesce(p_amount_discount_cents, 0),
    p_trial_days,
    v_now + interval '30 minutes',
    v_now,
    v_now
  )
  returning id into v_redemption_id;

  return query select 'valid', 'Code promo réservé.', v_redemption_id;
end;
$$;

grant execute on function public.reserve_promo_code(text, text, text, uuid, text, integer, integer) to service_role;
