/**
 * Configuration Astro : site statique (aucun rendu serveur), construit par
 * Cloudflare Pages à chaque envoi sur GitHub (main = production, bulle = test).
 *
 * L'adresse publique vient de src/data/site.json (siteUrl), source unique :
 * liens canoniques, sitemap et Open Graph ne peuvent pas diverger du domaine
 * contrôlé par scripts/garde.mjs et par la sentinelle.
 *
 * BASE_PATH (facultatif) : sous-dossier de publication. Inutile sur Cloudflare,
 * conservé pour un éventuel hébergement sous un chemin (ex. /jema_website/).
 */
import { readFileSync } from 'node:fs'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import rehypeBase from './src/lib/rehype-base.mjs'

const site = JSON.parse(readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf8'))
const BASE = process.env.BASE_PATH || '/'

export default defineConfig({
  site: site.siteUrl,
  base: BASE,
  trailingSlash: 'ignore',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  markdown: { rehypePlugins: [rehypeBase(BASE)] }
})
