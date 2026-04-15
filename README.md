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

## Fallback actuel

Si Supabase Auth n'est pas configure, l'application conserve le fallback historique base sur cookies pour les acces premium et le quota gratuit.
