import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Contenus éditables sans code (depuis /admin) : chaque entrée est un fichier
 * Markdown. Les collections « versions » et « journal » arrivent à l'étape 5.
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.enum(['legal', 'info']).default('info'),
    updated: z.coerce.date()
  })
})

export const collections = { pages }
