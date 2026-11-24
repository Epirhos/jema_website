/**
 * Cloudflare Pages Function : jema.software/telecharger/<windows|mac|mac-intel|deb|appimage>
 *
 * macOS : depuis la 4.1.2, un .dmg par processeur (« -arm64.dmg » Apple Silicon,
 * « -x64.dmg » Intel). « mac » = Apple Silicon, « mac-intel » = Intel. Une version
 * plus ancienne n'a qu'un .dmg (universel) : les deux adresses y mènent.
 *
 * Seule porte d'entrée vers les fichiers d'installation :
 *  - téléchargements ouverts → redirection vers le fichier de la dernière version
 *    publiée sur GitHub (les versions en brouillon ou « pre-release » sont ignorées) ;
 *  - téléchargements en pause (admin → Téléchargements) → redirection
 *    vers la section Télécharger du site, qui explique pourquoi.
 * Chaque passage est compté dans Umami (événement « fichier » ou « fichier-en-pause »),
 * y compris quand le lien a été partagé hors du site.
 *
 * SÉCURITÉ : le dépôt des versions est écrit ici en dur (DEPOT), pas lu dans les
 * réglages. Même si quelqu'un modifiait les réglages du site, cette fonction ne
 * redirigerait jamais ailleurs que vers les fichiers de github.com/Epirhos/jema-releases.
 * Toute anomalie déclenche une alerte (src/server/alerte.js).
 * Le contrôle de construction (scripts/garde.mjs) vérifie que DEPOT n'a pas changé.
 */
import site from '../../src/data/site.json'
import downloads from '../../src/data/downloads.json'
import { alerter } from '../../src/server/alerte.js'

const DEPOT = 'Epirhos/jema-releases'
const PREFIXE = `https://github.com/${DEPOT}/releases/download/`
const EXT = { windows: '.exe', mac: '.dmg', 'mac-intel': '.dmg', deb: '.deb', appimage: '.appimage' }
// Suffixe propre au processeur, cherché en premier (un .dmg sans suffixe sert de repli).
const ARCH = { mac: '-arm64.dmg', 'mac-intel': '-x64.dmg' }
const CACHE_SECONDS = 600
const VERSION_SURE = /^v\d+\.\d+\.\d+$/

/** Vrai si la version (« v4.1.2 ») publie un .dmg par processeur. */
function dmgParProcesseur(tag) {
  const [a, b, c] = tag.slice(1).split('.').map(Number)
  return a > 4 || (a === 4 && (b > 1 || (b === 1 && c >= 2)))
}

function fallbackUrl(os, tag) {
  const t = VERSION_SURE.test(tag) ? tag : 'v4.0.0'
  const n = t.slice(1)
  const dmg = (arch) => (dmgParProcesseur(t) ? `${t}/jema-editor-${n}-${arch}.dmg` : `${t}/jema-editor-${n}.dmg`)
  return PREFIXE + {
    windows: `${t}/jema-editor-${n}-setup.exe`,
    mac: dmg('arm64'),
    'mac-intel': dmg('x64'),
    appimage: `${t}/jema-editor-${n}.AppImage`,
    deb: `${t}/jema-editor_${n}_amd64.deb`
  }[os]
}

/** Dernière version GitHub, mise en cache 10 min (l'API publique limite les appels). */
async function latestAssetUrl(os) {
  const api = `https://api.github.com/repos/${DEPOT}/releases/latest`
  try {
    const res = await fetch(api, {
      headers: { 'User-Agent': 'jema-site', Accept: 'application/vnd.github+json' },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    const noms = (data.assets || []).filter((a) => a.name && a.browser_download_url)
    const fin = (suffixe) => noms.find((a) => a.name.toLowerCase().endsWith(suffixe))
    // macOS : le fichier du bon processeur, sinon un .dmg universel (sans -arm64 / -x64).
    const asset = ARCH[os]
      ? fin(ARCH[os]) || noms.find((a) => /\.dmg$/i.test(a.name) && !/-(arm64|x64)\.dmg$/i.test(a.name))
      : fin(EXT[os])
    return asset?.browser_download_url || fallbackUrl(os, data.tag_name || site.fallbackVersion)
  } catch {
    return fallbackUrl(os, site.fallbackVersion)
  }
}

/** Une adresse de fichier n'est acceptée que si elle pointe vers le dépôt officiel. */
function estSure(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'github.com' && u.href.startsWith(PREFIXE) && !u.href.includes('..')
  } catch {
    return false
  }
}

async function track(request, name, data) {
  const id = site.analytics?.umamiWebsiteId
  if (!id) return
  const url = new URL(request.url)
  // Seul le vrai domaine est mesuré (pas les aperçus *.pages.dev).
  if (url.hostname !== new URL(site.siteUrl).hostname) return
  // RGPD : on respecte les signaux de refus du visiteur (« Ne pas suivre », Global Privacy Control),
  // comme le script Umami côté navigateur (data-do-not-track).
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return
  // L'adresse IP du visiteur n'est pas transmise à Umami : la requête part du serveur Cloudflare.
  try {
    await fetch('https://cloud.umami.is/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: id,
          hostname: url.hostname,
          url: url.pathname,
          referrer: request.headers.get('Referer') || '',
          language: (request.headers.get('Accept-Language') || '').split(',')[0],
          name,
          data
        }
      })
    })
  } catch { /* la mesure ne doit jamais bloquer un téléchargement */ }
}

const redirect = (location) =>
  new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } })

export async function onRequestGet({ request, params, env, waitUntil }) {
  const os = String(params.os || '').toLowerCase()
  const origin = new URL(request.url).origin
  if (!EXT[os]) return redirect(`${origin}/#telecharger`)

  if (downloads.open === false) {
    waitUntil(track(request, 'fichier-en-pause', { os }))
    return redirect(`${origin}/#telecharger`)
  }

  let target = await latestAssetUrl(os)
  if (!estSure(target)) {
    // Ne devrait jamais arriver : on refuse, on sert le fichier de secours et on alerte.
    waitUntil(alerter(env, 'Téléchargement : adresse refusée', `Système ${os}. Adresse proposée : ${target}`))
    target = fallbackUrl(os, site.fallbackVersion)
  }
  if (site.releasesRepo !== DEPOT) {
    waitUntil(alerter(env, 'Réglage suspect', `Le réglage « Dépôt GitHub des versions » vaut « ${site.releasesRepo} ». Il est ignoré : seul ${DEPOT} est utilisé.`))
  }
  waitUntil(track(request, 'fichier', { os }))
  return redirect(target)
}
