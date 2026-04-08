# Label2A4

Outil web pour transformer des PDF d'etiquettes d'expedition en planches A4 prêtes à imprimer.

Fonctionnement actuel :
- import d'un ou plusieurs PDF
- profil `Chronopost` ou `Vinted`
- fusion dans l'ordre
- rognage metier
- placement automatique par 4 sur feuille A4

Règles actuelles :
- `Chronopost` : `40% droite`
- `Vinted` : `54% gauche` + `40% haut`

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
