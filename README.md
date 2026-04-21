# Label2A4

Outil web pour transformer des PDF d'etiquettes d'expedition en planches A4 pretes a imprimer.

Fonctionnement actuel :
- import d'un ou plusieurs PDF
- profil `Chronopost`, `Colissimo`, `Mondial Relay` ou `Rognage manuel`
- fusion dans l'ordre
- rognage metier
- placement automatique par 4 sur feuille A4

Regles actuelles :
- `Chronopost` : `40% droite`
- `Colissimo` : `X 8%` + `Y 32%` + `L 36%` + `H 29%`
- `Mondial Relay` : `54% gauche` + `40% haut`
- `Rognage manuel` : zone definie directement sur l'apercu du PDF, fichier par fichier

Ordre de placement sur la feuille :
- haut droite
- haut gauche
- bas droite
- bas gauche

## Lancer en local

```bash
npm install
npm run dev
```

## Supabase

Variables necessaires pour l'auth et les donnees serveur :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` pour afficher le bouton "Continuer avec Google" une fois le provider Google active dans Supabase Auth

SQL a appliquer dans Supabase :
- `supabase/quota.sql`
- `supabase/billing.sql`
- `supabase/promo_codes.sql`
- `supabase/impact.sql`

Pour la reconnexion sans email magique, activer Google dans Supabase Auth, ajouter l'URL de callback du site dans les URLs autorisees, puis activer `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`.

## Stripe

Variables necessaires :
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_DAY_PASS`
- `STRIPE_BILLING_PORTAL_CONFIGURATION`

Le webhook Stripe doit pointer vers `/api/stripe/webhook`.

Stripe Checkout est utilise avec les moyens de paiement dynamiques : carte bancaire par defaut, PayPal si active dans le Dashboard Stripe, Apple Pay et Google Pay quand le domaine est enregistre et que l'appareil/navigateur est compatible. Les wallets ne doivent pas etre forces cote front : Stripe decide ce qui est affichable et la carte reste le fallback.

## Promotions, quota et impact

Les codes promo sont valides cote serveur dans `promo_codes`, puis reserves dans `promo_code_redemptions` avant la creation de la session Checkout. Les remises de prix sont appliquees par coupon Stripe serveur, les essais gratuits par `trial_period_days`, et les webhooks marquent la redemption comme terminee.

Le quota gratuit est pilote cote serveur :
- invite : identifiant temporaire signe + quota plus limite
- compte gratuit : quota lie a `auth.users.id`
- premium : exports illimites tant que Stripe/Supabase indique un acces actif
- anti-abus : garde secondaire par fenetre reseau et rate limiting serveur

La logique "meme reseau = meme utilisateur" est volontairement evitee : une IP peut representer une famille, une entreprise, un VPN ou changer regulierement. Elle n'est utilisee que comme garde anti-abus large, jamais comme identite principale. Safari, Apple Pay, Google Pay et la navigation privee ne portent pas la logique metier : l'acces, les promos et le quota sont revus par le backend et les webhooks Stripe.

Le compteur ecologique utilise une formule explicable : sans optimisation, une etiquette = une feuille A4 ; avec Label2A4, quatre etiquettes peuvent tenir sur une feuille. Les arbres sauves restent une estimation indicative basee sur 8 000 feuilles A4 par arbre.

Note technique detaillee : `docs/payment-promo-quota-architecture.md`.

## Fallback actuel

Si Supabase Auth/Admin n'est pas configure, l'application conserve un fallback de developpement base sur cookies signes. En production, Supabase Admin et les RPC SQL sont necessaires pour eviter les contournements evidents par navigateur prive ou changement de navigateur.
