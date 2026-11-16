import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import rehypeBase from './src/lib/rehype-base.mjs'

const BASE = process.env.BASE_PATH || '/'

// SITE_URL : domaine public (Cloudflare Pages). BASE_PATH : sous-dossier
// éventuel (GitHub Pages sert le site sous /jema_website/).
export default defineConfig({
  site: process.env.SITE_URL || 'https://jema.app',
  base: BASE,
  trailingSlash: 'ignore',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  markdown: { rehypePlugins: [rehypeBase(BASE)] }
})
