# Jema — Site officiel

Site d'annonce et de téléchargement de **Jema**, l'éditeur littéraire augmenté par l'IA locale.
Slogan : _« Racontez, on s'occupe du reste. »_

Site **statique** Astro : HTML pré-rendu (référencement), JavaScript chargé seulement là où il sert
(démo interactive, téléchargements, menu). Design repris de l'application (thèmes Clair / Sombre /
Éditorial, verre dépoli, Inter + Merriweather auto-hébergées).

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # site statique → dist/
npm run preview  # sert le build
```

Variables de build (facultatives) :

| Variable | Rôle | Défaut |
|---|---|---|
| `SITE_URL` | domaine public (balises canoniques, sitemap) | `https://jema.app` |
| `BASE_PATH` | sous-dossier de publication | `/` (GitHub Pages : `/jema_website/`) |

## Modifier le contenu

| Quoi | Où |
|---|---|
| Email, dépôt des versions, dates de bêta, configuration requise, bandeau d'annonce | `src/data/site.json` |
| Pages légales (Markdown) | `src/content/pages/*.md` |
| Accueil (sections) | `src/pages/index.astro` + `src/components/` |

## Structure

```
src/
  layouts/Base.astro        # <head>, thème sans flash, navigation, bandeau, footer
  layouts/Prose.astro       # gabarit des pages de texte
  pages/                    # index, legal/[slug], 404
  content/pages/            # pages Markdown (légal…)
  content.config.ts         # schémas des contenus
  data/site.json            # réglages éditables
  components/astro/         # sections statiques (Hero, Features, Footer, Banner)
  components/*.jsx          # îlots React : Navbar, Showcase (démo Tiptap), Download, Contact
  lib/                      # url() (base), thème partagé, plugin rehype
```

## Section Licence (monétisation)

`src/components/Pricing.jsx` existe mais n'est pas monté tant que le modèle économique n'est pas arrêté.
