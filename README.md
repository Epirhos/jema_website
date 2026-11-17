# Jema — Site officiel (jema.app)

Site d'annonce et de téléchargement de **Jema**, le logiciel d'écriture avec IA locale.
Slogan : _« Racontez, Jema s'occupe du reste. »_

- **Publier un contenu** (version, article, pause des téléchargements, bandeau) : `jema.app/admin`,
  bouton « Mode d'emploi » en bas à droite.
- **Tout le reste** (installation, code, hébergement, domaine, dépannage) :
  [`docs/manuel/Manuel-site-Jema.pdf`](docs/manuel/Manuel-site-Jema.pdf).

## Démarrer

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # site final → dist/ (à lancer avant chaque envoi)
npm run preview    # sert dist/
npm run sync:guide # recopie le mode d'emploi depuis jema-editor_v2
npm run manuel     # régénère le PDF du manuel depuis docs/manuel/manuel.html
```

Stack : Astro 5 (statique) · React (barre de navigation) · Tailwind 3 + `src/styles/global.css` ·
Sveltia CMS (`public/admin`) · Cloudflare Pages + Function (`functions/telecharger`) · Umami.

Branches : `main` = production (jema.app), `bulle` = test (bulle.jema.pages.dev).
