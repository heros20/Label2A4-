# Paiement, promotions, quota et impact

## Paiement Stripe

Le projet garde Stripe Checkout Sessions, deja present dans le code. C'est le bon choix ici : Stripe heberge la saisie des moyens de paiement, gere la conformite carte, les wallets et les abonnements.

La route `app/api/checkout/route.ts` ne fait pas confiance au prix envoye par le client. Le client envoie seulement `planId`, les consentements et un code promo eventuel. Le backend choisit le Price Stripe depuis les variables serveur, valide le code promo, cree le coupon Stripe si necessaire, puis cree la session Checkout.

Les moyens de paiement modernes sont geres par les moyens dynamiques Stripe :
- carte bancaire disponible par defaut ;
- PayPal si active dans Stripe et compatible avec le pays/devise ;
- Apple Pay et Google Pay si le domaine est enregistre, l'appareil compatible et un wallet disponible ;
- fallback carte si un wallet ou PayPal n'est pas affichable.

## Promotions

Tables :
- `promo_codes` : code, type (`percent`, `fixed`, `trial`), montant, essai, dates, limites, plans compatibles, coupon Stripe optionnel.
- `promo_code_redemptions` : reservation pending, session Stripe, compte ou invite, statut, remise calculee, essai active.

Flux :
1. `/api/promos/validate` affiche un devis avant paiement.
2. `/api/checkout` revalide et reserve le code en transaction SQL.
3. Stripe Checkout applique le coupon serveur ou l'essai gratuit.
4. `/api/stripe/webhook` et `/api/checkout/success` marquent la redemption comme terminee.

Une reservation expire apres 30 minutes pour eviter qu'un checkout abandonne bloque definitivement un code limite.

L'admin peut creer, activer et desactiver les promos via `/admin`. La route `/api/admin/promos` exige la session admin, utilise Supabase service role, normalise le code, valide les limites et stocke seulement des champs serveur. Elle ne permet pas de modifier le prix final du checkout : `/api/checkout` revalide toujours le code et recalcule la remise.

## Quota gratuit

Le quota est d'abord serveur :
- premium : pas de limite quotidienne d'export ;
- compte gratuit : cle `account:{hash(userId)}` ;
- invite : cle `guest:{hash(anonymousId signe)}` avec limite plus basse ;
- garde anti-abus invite : cle secondaire `guest-abuse:{hash(prefixe reseau)}` avec limite plus haute que le quota invite.

Le reseau n'est pas une identite fiable. Une IP peut etre partagee par plusieurs personnes, masquer un VPN, changer en mobile, ou representer une entreprise entiere. Elle sert uniquement de limite large contre les resets evidents en navigation privee ou changement de navigateur, jamais de compte utilisateur.

Apple Pay, Safari et la navigation privee ne doivent pas porter la logique metier. Un wallet peut ne pas apparaitre, un stockage local peut etre efface, mais les droits premium, les quotas et les promos restent verifies par le backend, Supabase et les webhooks Stripe.

## Compteur ecologique

La formule centrale est dans `lib/impact.ts` :

```txt
feuilles_sans_optimisation = nombre_etiquettes
feuilles_avec_label2a4 = ceil(nombre_etiquettes / 4)
feuilles_economisees = max(feuilles_sans_optimisation - feuilles_avec_label2a4, 0)
arbres_estimes = feuilles_economisees / 8000
```

Le chiffre arbre est volontairement indicatif. L'UI affiche d'abord les feuilles economisees et les etiquettes optimisees, plus fiables pour l'utilisateur.

## Admin et purge planifiee

Le dashboard admin affiche un tableau operationnel impact/quota/promo :
- impact plateforme depuis `label_impact_counters` ;
- quota du jour depuis `daily_quota_usage` ;
- redemptions promo depuis `promo_code_redemptions` ;
- buckets anti-abus depuis `rate_limit_usage`.

La purge planifiee est exposee par `/api/cron/cleanup` et declaree dans `vercel.json`. Elle exige `Authorization: Bearer $CRON_SECRET`, expire les redemptions pending arrivees a echeance, supprime les vieux buckets de rate limit, supprime les redemptions expirees/annulees anciennes, et conserve les donnees business completes. Les retentions par defaut sont configurables avec `RATE_LIMIT_RETENTION_DAYS`, `QUOTA_USAGE_RETENTION_DAYS` et `PROMO_REDEMPTION_RETENTION_DAYS`.
