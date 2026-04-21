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
  update public.promo_code_redemptions as redemption
  set status = 'expired',
      updated_at = v_now
  where redemption.status = 'pending'
    and redemption.expires_at <= v_now;

  select *
  into v_promo
  from public.promo_codes as promo
  where upper(promo.code) = upper(trim(p_code))
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
  from public.promo_code_redemptions as redemption
  where redemption.promo_code_id = v_promo.id
    and redemption.status in ('pending', 'completed');

  if v_promo.max_redemptions is not null and v_total_count >= v_promo.max_redemptions then
    return query select 'exhausted', 'Ce code promo a atteint sa limite d''utilisation.', null::uuid;
    return;
  end if;

  select count(*)
  into v_identity_count
  from public.promo_code_redemptions as redemption
  where redemption.promo_code_id = v_promo.id
    and redemption.redeemer_hash = p_redeemer_hash
    and redemption.status in ('pending', 'completed');

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
