# Label2A4

Outil web pour transformer des PDF d’étiquettes d’expédition en planches A4 prêtes à imprimer.

Fonctionnement actuel :
- import d'un ou plusieurs PDF
- profil `Chronopost`, `Colissimo`, `Mondial Relay`, `Happy Post` ou `Rognage manuel`
- fusion dans l'ordre
- sélection des pages utiles pour les PDF multipages
- rognage métier
- placement automatique par 4 sur feuille A4

Profils actuels :
- `Chronopost`
- `Colissimo`
- `Mondial Relay`
- `Happy Post`
- `Rognage manuel` : zone définie directement sur l’aperçu du PDF, fichier par fichier

PDF multipages :
- chaque page incluse est traitée comme une étiquette distincte
- les pages incluses sont placées dans les emplacements A4 suivants, sans superposition
- les pages non utiles peuvent être décochées dans la liste des fichiers

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

## Authentification et données serveur

Variables nécessaires pour l’authentification et les données serveur :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` pour afficher le bouton "Continuer avec Google" une fois la connexion Google activée

Scripts de base de données à appliquer depuis le dossier dédié du projet.

Pour la reconnexion sans email magique, activez Google dans le service d’authentification, ajoutez l’URL de callback du site dans les URLs autorisées, puis activez `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`.

## Paiement

Variables nécessaires :
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_DAY_PASS`
- `STRIPE_BILLING_PORTAL_CONFIGURATION`

Le webhook de paiement doit pointer vers `/api/stripe/webhook`.

Le paiement utilise une page hébergée avec moyens dynamiques : carte bancaire par défaut, PayPal si activé, Apple Pay et Google Pay quand le domaine est enregistré et que l’appareil/navigateur est compatible. Les wallets ne doivent pas être forcés côté front : le prestataire décide ce qui est affichable et la carte reste le fallback.

## Promotions, quota et impact

Les codes promo sont validés côté serveur, puis réservés avant la création de la session de paiement. Les remises de prix sont appliquées côté serveur, les essais gratuits par durée d’essai, et les webhooks marquent la rédemption comme terminée.

L’admin `/admin` permet maintenant de créer, activer et désactiver les codes promo sans SQL manuel, une fois la configuration promo appliquée. Il affiche aussi un tableau impact/quota/promo pour suivre les compteurs écologiques, le quota du jour, les rédemptions promo et les limites serveur.

Le quota gratuit est piloté côté serveur :
- invité : identifiant temporaire signé + quota plus limité
- compte gratuit : quota lié au compte
- premium : exports illimités tant qu’un accès actif existe
- anti-abus : garde secondaire par fenêtre réseau et limitation serveur

La logique "même réseau = même utilisateur" est volontairement évitée : une IP peut représenter une famille, une entreprise, un VPN ou changer régulièrement. Elle n’est utilisée que comme garde anti-abus large, jamais comme identité principale. Safari, Apple Pay, Google Pay et la navigation privée ne portent pas la logique métier : l’accès, les promos et le quota sont revus par le backend et les webhooks de paiement.

Le compteur écologique utilise une formule explicable : sans optimisation, une étiquette = une feuille A4 ; avec Label2A4, quatre étiquettes peuvent tenir sur une feuille. Les arbres sauvés restent une estimation indicative basée sur 8 000 feuilles A4 par arbre.

Note technique détaillée : `docs/payment-promo-quota-architecture.md`.

## Cron de purge

`vercel.json` déclare une purge quotidienne sur `/api/cron/cleanup`. Configurez `CRON_SECRET` en production : la route refuse les appels sans `Authorization: Bearer $CRON_SECRET`. Les variables optionnelles `RATE_LIMIT_RETENTION_DAYS`, `QUOTA_USAGE_RETENTION_DAYS` et `PROMO_REDEMPTION_RETENTION_DAYS` ajustent la rétention.

## Email transactionnel

Le formulaire `/contact` envoie les demandes support avec l’API transactionnelle configurée. Variables serveur :
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL` : expéditeur valide, recommandé `support@label2a4.com`
- `BREVO_SENDER_NAME`
- `BREVO_SUPPORT_TO_EMAIL` : destinataire support, fallback sur `NEXT_PUBLIC_SUPPORT_EMAIL`
- `BREVO_SUPPORT_TO_NAME`

Les emails de création/connexion de compte passent aussi par `/api/auth/magic-link`, qui génère le lien côté serveur puis l’envoie via le prestataire d’email transactionnel.

Ne jamais exposer `BREVO_API_KEY` côté client et ne jamais la commit. Ajoutez-la dans `.env.local` en local et dans les variables d’environnement de production. Si un SMTP système est aussi configuré, alignez son sender sur `support@label2a4.com` pour éviter les emails système incohérents.

## Fallback actuel

Si l’authentification serveur n’est pas configurée, l’application conserve un fallback de développement basé sur cookies signés. En production, l’authentification serveur et les RPC SQL sont nécessaires pour éviter les contournements évidents par navigateur privé ou changement de navigateur.
