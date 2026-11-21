#!/usr/bin/env node
/**
 * Garde du site : empêche de publier un site détourné.
 *
 *   node scripts/garde.mjs source   (avant la construction, « prebuild »)
 *   node scripts/garde.mjs dist     (après la construction, « postbuild »)
 *
 * Si un contrôle échoue, la construction échoue : Cloudflare ne publie rien et
 * la version précédente, saine, reste en ligne. Cloudflare peut alors vous prévenir
 * par e-mail (notification « Pages · échec de déploiement », voir le manuel).
 *
 * Ce qui est vérifié :
 *  - les réglages sensibles n'ont pas changé (dépôt des versions, adresse du site,
 *    e-mail de contact, script de mesure d'audience) ;
 *  - la fonction de téléchargement redirige toujours vers le dépôt officiel ;
 *  - aucun contenu (versions, journal, pages, guide, bandeau, pause) ne contient de
 *    script, de cadre, de formulaire, de lien « javascript: », de lien vers un fichier
 *    exécutable hébergé ailleurs, ni d'adresse e-mail autre que celle du contact ;
 *  - dans le site construit : seuls les scripts autorisés sont chargés, aucun
 *    formulaire n'envoie ailleurs, aucun téléchargement ne sort du dépôt officiel ;
 *  - puis écrit dist/_headers : en-têtes de sécurité et politique de sécurité du
 *    navigateur (CSP) qui n'autorise que les scripts présents à la construction.
 *
 * Pour changer légitimement une valeur ATTENDU : la modifier ici ET dans
 * .github/workflows/sentinelle.yml (la sentinelle vous alertera de ce changement).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

export const ATTENDU = {
  releasesRepo: 'Epirhos/jema-releases',
  siteUrl: 'https://jema.software',
  contactEmail: 'editor.jema@gmail.com',
  umamiSrc: 'https://cloud.umami.is/script.js',
  sveltia: 'https://unpkg.com/@sveltia/cms@'
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const erreurs = []
const faute = (fichier, message) => erreurs.push(`${fichier} : ${message}`)
const lire = (f) => readFileSync(join(root, f), 'utf8')
const json = (f) => JSON.parse(lire(f))

function fichiers(dir, ext) {
  const abs = join(root, dir)
  if (!existsSync(abs)) return []
  return readdirSync(abs).flatMap((n) => {
    const p = join(abs, n)
    if (statSync(p).isDirectory()) return fichiers(relative(root, p), ext)
    return ext.some((e) => n.endsWith(e)) ? [relative(root, p).replace(/\\/g, '/')] : []
  })
}

// Fichiers exécutables : un lien vers l'un d'eux doit passer par /telecharger/ ou le dépôt officiel.
const EXECUTABLE = /\.(exe|msi|dmg|pkg|deb|rpm|appimage|apk|zip|rar|7z|bat|cmd|ps1|scr|jar)(\?|#|$)/i
const lienExecutableSur = (url) =>
  url.startsWith(`https://github.com/${ATTENDU.releasesRepo}/releases/download/`) || /^\/telecharger\/[a-z]+$/.test(url)

/** Contrôles communs au texte des contenus (Markdown, JSON). */
function controlerTexte(fichier, texte) {
  const interdits = [
    [/<\s*(script|iframe|frame|object|embed|form|input|meta|base|link|style|svg|math)\b/i, 'balise HTML interdite'],
    [/<[^>]*\son[a-z]+\s*=/i, 'attribut d\'événement (on…=) interdit'],
    [/javascript\s*:/i, 'lien « javascript: » interdit'],
    [/(data|vbscript)\s*:\s*text\/html/i, 'lien « data:text/html » interdit']
  ]
  for (const [re, msg] of interdits) if (re.test(texte)) faute(fichier, msg)
  for (const m of texte.matchAll(/mailto:([^)\s"'<>?]*)/gi)) {
    const adresse = decodeURIComponent(m[1]).toLowerCase()
    if (adresse && adresse !== ATTENDU.contactEmail) faute(fichier, `adresse e-mail non autorisée : ${adresse}`)
  }
  for (const m of texte.matchAll(/(https?:\/\/[^\s)"'<>]+|\/[^\s)"'<>]*)/g)) {
    if (EXECUTABLE.test(m[1]) && !lienExecutableSur(m[1])) faute(fichier, `lien vers un fichier exécutable non autorisé : ${m[1]}`)
  }
}

// ───────────── Avant la construction ─────────────
function source() {
  const site = json('src/data/site.json')
  if (site.releasesRepo !== ATTENDU.releasesRepo) faute('src/data/site.json', `releasesRepo modifié (« ${site.releasesRepo} »)`)
  if (site.siteUrl !== ATTENDU.siteUrl) faute('src/data/site.json', `siteUrl modifié (« ${site.siteUrl} »)`)
  if (String(site.contactEmail).toLowerCase() !== ATTENDU.contactEmail) faute('src/data/site.json', `contactEmail modifié (« ${site.contactEmail} »)`)
  if (site.analytics?.umamiSrc !== ATTENDU.umamiSrc) faute('src/data/site.json', `script de mesure modifié (« ${site.analytics?.umamiSrc} »)`)
  if (!/^v\d+\.\d+\.\d+$/.test(site.fallbackVersion)) faute('src/data/site.json', `version de secours invalide (« ${site.fallbackVersion} »)`)
  if (site.analytics?.umamiWebsiteId && !/^[0-9a-f-]{36}$/.test(site.analytics.umamiWebsiteId)) faute('src/data/site.json', 'identifiant Umami invalide')
  controlerTexte('src/data/site.json', JSON.stringify(site))

  const banner = json('src/data/banner.json')
  if (banner.link && !(/^\/(?!\/)/.test(banner.link) || banner.link.startsWith(ATTENDU.siteUrl + '/'))) {
    faute('src/data/banner.json', `le lien du bandeau doit rester sur le site (« ${banner.link} »)`)
  }
  controlerTexte('src/data/banner.json', JSON.stringify(banner))
  controlerTexte('src/data/downloads.json', lire('src/data/downloads.json'))

  const fn = lire('functions/telecharger/[os].js')
  if (!fn.includes(`const DEPOT = '${ATTENDU.releasesRepo}'`)) faute('functions/telecharger/[os].js', 'le dépôt des versions écrit en dur a changé')
  if (!fn.includes('if (!estSure(target))')) faute('functions/telecharger/[os].js', 'le contrôle des adresses de fichier a été retiré')

  for (const f of fichiers('src/content', ['.md', '.mdx'])) controlerTexte(f, lire(f))
}

// ───────────── Après la construction ─────────────
const sha256 = (t) => `'sha256-${createHash('sha256').update(t, 'utf8').digest('base64')}'`

function dist() {
  const site = json('src/data/site.json')
  const pages = fichiers('dist', ['.html'])
  if (!pages.length) faute('dist', 'aucune page construite')
  const hashesSite = new Set()
  const hashesAdmin = new Set()

  for (const f of pages) {
    const html = lire(f)
    const admin = f.startsWith('dist/admin/')
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1]
      const src = attrs.match(/\ssrc\s*=\s*["']?([^"'\s>]+)/i)?.[1]
      if (src) {
        const local = src.startsWith('/') && !src.startsWith('//')
        const umami = src === site.analytics?.umamiSrc && src === ATTENDU.umamiSrc
        const sveltia = admin && src.startsWith(ATTENDU.sveltia) && /\sintegrity\s*=\s*["']sha(384|512)-/.test(attrs)
        if (!local && !umami && !sveltia) faute(f, `script externe non autorisé : ${src}`)
      } else if (m[2].trim()) {
        ;(admin ? hashesAdmin : hashesSite).add(sha256(m[2]))
      }
    }
    for (const m of html.matchAll(/<form\b[^>]*\saction\s*=\s*["']?([^"'\s>]*)/gi)) {
      if (m[1] && !(m[1].startsWith('/') && !m[1].startsWith('//'))) faute(f, `formulaire envoyé ailleurs : ${m[1]}`)
    }
    // L'admin ouvre son mode d'emploi dans un cadre (/admin/aide/) : seule exception.
    if (!admin && /<\s*(iframe|frame|object|embed)\b/i.test(html)) faute(f, 'cadre ou objet intégré interdit')
    for (const m of html.matchAll(/\b(?:href|src|action)\s*=\s*["']([^"']+)["']/gi)) {
      const v = m[1].replace(/&amp;/g, '&')
      if (/^\s*javascript:/i.test(v)) faute(f, `lien « javascript: » : ${v}`)
      const mail = v.match(/^mailto:([^?]*)/i)
      if (mail && mail[1] && decodeURIComponent(mail[1]).toLowerCase() !== ATTENDU.contactEmail) faute(f, `e-mail non autorisé : ${mail[1]}`)
      if (EXECUTABLE.test(v) && !lienExecutableSur(v)) faute(f, `lien vers un fichier exécutable non autorisé : ${v}`)
    }
  }
  if (erreurs.length) return

  const commun = [
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy: same-origin',
    'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    'Reporting-Endpoints: csp="/securite/rapport"'
  ]
  const rapport = 'report-uri /securite/rapport; report-to csp'
  const cspSite = [
    "default-src 'self'",
    `script-src 'self' ${[...hashesSite].join(' ')} https://cloud.umami.is`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com https://cloud.umami.is https://gateway.umami.is https://api-gateway.umami.dev",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
    rapport
  ].join('; ')
  const cspAdmin = [
    "default-src 'self'",
    `script-src 'self' ${[...hashesAdmin].join(' ')} https://unpkg.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://*.githubusercontent.com https://github.com",
    "media-src 'self' blob: https://*.githubusercontent.com",
    "connect-src 'self' data: blob: https://api.github.com https://*.githubusercontent.com https://unpkg.com https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    "frame-src 'self' blob:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    rapport
  ].join('; ')

  const regle = (chemin, lignes) => [chemin, ...lignes.map((l) => `  ${l}`)].join('\n')
  const headers = [
    '# Généré par scripts/garde.mjs à chaque construction : ne pas modifier à la main.',
    regle('/*', [...commun, 'X-Frame-Options: DENY', `Content-Security-Policy: ${cspSite}`]),
    ...['/admin', '/admin/*'].map((p) =>
      regle(p, ['! Content-Security-Policy', `Content-Security-Policy: ${cspAdmin}`, '! X-Frame-Options', 'X-Frame-Options: SAMEORIGIN', 'Cache-Control: no-store'])
    )
  ].join('\n\n')
  writeFileSync(join(root, 'dist', '_headers'), headers + '\n')
  console.log(`Garde : ${pages.length} pages vérifiées, ${hashesSite.size} scripts intégrés autorisés, dist/_headers écrit.`)
}

const mode = process.argv[2]
if (mode === 'source') source()
else if (mode === 'dist') dist()
else { console.error('Usage : node scripts/garde.mjs source|dist'); process.exit(2) }

if (erreurs.length) {
  console.error('\n✖ GARDE : publication bloquée, le site semble avoir été modifié de façon dangereuse.\n')
  for (const e of erreurs) console.error('  - ' + e)
  console.error('\nSi ce changement est voulu, voir le manuel technique, chapitre « Sécurité ».\n')
  process.exit(1)
}
if (mode === 'source') console.log('Garde : réglages et contenus vérifiés.')
