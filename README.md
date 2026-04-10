# Label2A4

Outil web pour transformer des PDF d’étiquettes d’expédition en planches A4 prêtes à imprimer.

Fonctionnement actuel :
- import d’un ou plusieurs PDF
- profil `Chronopost`, `Colissimo`, `Mondial Relay` ou `Rognage manuel`
- fusion dans l’ordre
- rognage métier
- placement automatique par 4 sur feuille A4

Règles actuelles :
- `Chronopost` : `40% droite`
- `Colissimo` : `X 8%` + `Y 32%` + `L 36%` + `H 29%`
- `Mondial Relay` : `54% gauche` + `40% haut`
- `Rognage manuel` : zone définie directement sur l’aperçu du PDF, fichier par fichier

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
