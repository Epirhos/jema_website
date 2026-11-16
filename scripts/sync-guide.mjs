#!/usr/bin/env node
/**
 * Synchronise le mode d'emploi depuis l'application (source unique, spécification U13) :
 *   jema-editor_v2/docs/guide/*.md  →  src/content/guide/*.md
 *   jema-editor_v2/docs/guide/_parcours.md  →  src/data/guide-parcours.json
 * Les jetons [[id]] sont remplacés par le raccourci du registre de commandes de l'app
 * (src/renderer/src/lib/commands.js), affiché en touches <kbd>.
 *
 * Usage : npm run sync:guide [-- <chemin vers jema-editor_v2>]
 * Les fichiers générés sont versionnés : le build du site n'a pas besoin du dépôt de l'app.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = resolve(process.argv[2] || join(site, '..', 'jema-editor_v2'))
const guideDir = join(app, 'docs', 'guide')
const commandsFile = join(app, 'src', 'renderer', 'src', 'lib', 'commands.js')
if (!existsSync(guideDir)) {
  console.error(`Guide introuvable : ${guideDir}`)
  process.exit(1)
}

// Registre des raccourcis : { id: 'save', keys: ['Ctrl', 'S'], ... }
const shortcuts = {}
const src = readFileSync(commandsFile, 'utf8')
for (const m of src.matchAll(/\{\s*id:\s*'([^']+)',\s*keys:\s*\[([^\]]*)\]/g)) {
  shortcuts[m[1]] = [...m[2].matchAll(/'([^']*)'/g)].map((k) => k[1])
}
const kbd = (id) => {
  const keys = shortcuts[id]
  if (!keys) return `[[${id}]]`
  return keys.map((k) => `<kbd>${k}</kbd>`).join('+')
}

const outDir = join(site, 'src', 'content', 'guide')
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const unknown = new Set()
let n = 0
for (const file of readdirSync(guideDir)) {
  if (!file.endsWith('.md') || file.startsWith('_') || file === 'README.md') continue
  const text = readFileSync(join(guideDir, file), 'utf8').replace(/\r\n/g, '\n')
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) { console.warn(`En-tête absent : ${file}`); continue }
  const track = (id) => { if (!shortcuts[id]) unknown.add(id) }
  // En-tête : l'app le lit avec un analyseur « clé: valeur » maison ; on le
  // réécrit en YAML strict (valeurs entre guillemets, raccourcis en texte simple).
  const front = m[1].split('\n').filter((l) => l.includes(':')).map((l) => {
    const i = l.indexOf(':')
    const value = l.slice(i + 1).trim().replace(/\[\[([a-z0-9-]+)\]\]/g, (_, id) => {
      track(id)
      return (shortcuts[id] || [id]).join('+')
    })
    return `${l.slice(0, i).trim()}: ${JSON.stringify(value)}`
  })
  // Corps : raccourcis en touches <kbd>.
  const body = m[2].replace(/\[\[([a-z0-9-]+)\]\]/g, (_, id) => { track(id); return kbd(id) })
  writeFileSync(join(outDir, file), `---\n${front.join('\n')}\n---\n${body}`)
  n += 1
}

// Sommaire par tâche : « ## Je veux… » puis la liste des fiches.
const parcours = []
const raw = readFileSync(join(guideDir, '_parcours.md'), 'utf8').replace(/\r\n/g, '\n')
let current = null
for (const line of raw.split('\n')) {
  const h = line.match(/^##\s+(.+)/)
  if (h) {
    current = { tache: h[1].trim(), fiches: [] }
    parcours.push(current)
  } else if (current && line.trim()) {
    current.fiches.push(...line.split(',').map((s) => s.trim()).filter(Boolean))
  }
}
writeFileSync(join(site, 'src', 'data', 'guide-parcours.json'), JSON.stringify(parcours, null, 2) + '\n')

console.log(`Guide synchronisé : ${n} fiches, ${parcours.length} parcours.`)
if (unknown.size) console.warn(`Raccourcis inconnus : ${[...unknown].join(', ')}`)
