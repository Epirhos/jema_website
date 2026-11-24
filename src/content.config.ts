import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

/**
 * Contenus du site. Tout est en Markdown, éditable depuis /admin (Sveltia CMS),
 * sauf le guide, synchronisé depuis l'application (npm run sync:guide).
 */

// Nouveautés : une entrée par version publiée. Le corps suit la structure
// ## Nouveau · ## Amélioré · ## Corrigé · ## Sécurité · ## À savoir
const versions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/versions' }),
  schema: z.object({
    version: z.string(),                       // ex. « 4.0.0 »
    date: z.coerce.date(),
    canal: z.enum(['bêta', 'stable']).default('bêta'),
    titre: z.string(),                         // une phrase-promesse
    resume: z.string(),                        // deux lignes, côté auteur
    brouillon: z.boolean().default(false)
  })
})

// Journal : annonces, coulisses, conseils d'écriture.
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    titre: z.string(),
    date: z.coerce.date(),
    resume: z.string(),
    categorie: z.enum(['Annonce', 'Coulisses', 'Conseil', 'Version']).default('Annonce'),
    brouillon: z.boolean().default(false)
  })
})

// Pages simples : légal (/legal/…) et informations (/…).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.enum(['legal', 'info']).default('info'),
    updated: z.coerce.date()
  })
})

// Mode d'emploi : copie générée depuis jema-editor_v2/docs/guide (ne pas éditer ici).
const guide = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guide' }),
  schema: z.object({
    id: z.string(),
    titre: z.string(),
    ou: z.string().optional(),
    raccourci: z.string().optional(),
    vue: z.string().optional(),
    resume: z.string().optional(),
    mots: z.string().optional()
  })
})

export const collections = { versions, journal, pages, guide }
