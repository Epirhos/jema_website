# Jema — Site officiel (jema.software)

Site d'annonce et de téléchargement de **Jema**, le logiciel d'écriture avec IA locale.
Slogan : _« Racontez, Jema s'occupe du reste. »_

- **Publier un contenu** (version, article, pause des téléchargements, bandeau) : `jema.software/admin`,
  bouton « Mode d'emploi » en bas à droite.
- **Tout le reste** (installation, code, hébergement, domaine, sécurité, RGPD, dépannage) :
  [`docs/manuel/Manuel-site-Jema.pdf`](docs/manuel/Manuel-site-Jema.pdf).
- **Architecture et journal des décisions** : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Démarrer

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # site final → dist/ (garde de sécurité avant et après ; à lancer avant chaque envoi)
npm run preview    # sert dist/
npm run sync:guide # recopie le mode d'emploi depuis jema-editor_v2
npm run manuel     # régénère le PDF du manuel depuis docs/manuel/manuel.html
```

Stack : Astro 7 (statique) · React 19 (barre de navigation) · Tailwind 4 + `src/styles/global.css` ·
Sveltia CMS (`public/admin`) · Cloudflare Pages + Functions (`functions/`) · Umami (sans cookie).

Branches : `main` = production (jema.software, l'admin y publie), `bulle` = test (bulle.jema.pages.dev).
Avant de travailler sur `bulle` : `git merge origin/main`.

## Sécurité

Signaler une faille : editor.jema@gmail.com (voir `/.well-known/security.txt`).
Contrôles : `scripts/garde.mjs` (construction), `.github/workflows/sentinelle.yml` (dépôt et site en ligne).
Aucun secret dans ce dépôt.
