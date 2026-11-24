/**
 * Configuration Astro : site statique (aucun rendu serveur), construit par
 * Cloudflare Pages à chaque envoi sur GitHub (main = production, bulle = test).
 *
 * L'adresse publique vient de src/data/site.json (siteUrl), source unique :
 * liens canoniques, sitemap et Open Graph ne peuvent pas diverger du domaine
 * contrôlé par scripts/garde.mjs et par la sentinelle.
 *
 * Le site est servi à la racine du domaine. L'ancienne variable BASE_PATH
 * (sous-dossier GitHub Pages) a été retirée avec la migration Astro 7 (D-14).
 *
 * Markdown : Sätteri, moteur natif d'Astro 7 (aucun plugin remark/rehype).
 */
import { readFileSync } from 'node:fs'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

const site = JSON.parse(readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf8'))

export default defineConfig({
  site: site.siteUrl,
  trailingSlash: 'ignore',
  // Astro 7 applique par défaut les règles d'espaces de JSX, qui suppriment
  // l'espace entre une ligne de texte et la balise suivante (« corrections.Vous »).
  // `true` = compression sans perte, comportement d'Astro 5.
  compressHTML: true,
  integrations: [react(), sitemap()],
  // Tailwind 4 : plugin Vite, configuration dans src/styles/global.css (aucun fichier JS).
  vite: { plugins: [tailwindcss()] }
})
