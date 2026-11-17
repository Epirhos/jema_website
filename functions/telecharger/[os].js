/**
 * Cloudflare Pages Function : jema.app/telecharger/<windows|mac|deb|appimage>
 *
 * Seule porte d'entrée vers les fichiers d'installation :
 *  - téléchargements ouverts → redirection vers le fichier de la dernière version
 *    publiée sur GitHub (les versions en brouillon ou « pre-release » sont ignorées) ;
 *  - téléchargements en pause (admin → Réglages → Téléchargements) → redirection
 *    vers la section Télécharger du site, qui explique pourquoi.
 * Chaque passage est compté dans Umami (événement « fichier » ou « fichier-en-pause »),
 * y compris quand le lien a été partagé hors du site.
 *
 * Le réglage est lu dans src/data/site.json au moment de la publication :
 * basculer l'interrupteur dans l'admin republie le site et cette fonction.
 */
import site from '../../src/data/site.json'

const EXT = { windows: '.exe', mac: '.dmg', deb: '.deb', appimage: '.appimage' }
const CACHE_SECONDS = 600

function fallbackUrl(os, tag) {
  const n = tag.replace(/^v/, '')
  const base = `https://github.com/${site.releasesRepo}/releases/download/${tag}`
  return {
    windows: `${base}/jema-editor-${n}-setup.exe`,
    mac: `${base}/jema-editor-${n}.dmg`,
    appimage: `${base}/jema-editor-${n}.AppImage`,
    deb: `${base}/jema-editor_${n}_amd64.deb`
  }[os]
}

/** Dernière version GitHub, mise en cache 10 min (l'API publique limite les appels). */
async function latestAssetUrl(os) {
  const api = `https://api.github.com/repos/${site.releasesRepo}/releases/latest`
  try {
    const res = await fetch(api, {
      headers: { 'User-Agent': 'jema-site', Accept: 'application/vnd.github+json' },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    const asset = (data.assets || []).find((a) => (a.name || '').toLowerCase().endsWith(EXT[os]))
    return asset?.browser_download_url || fallbackUrl(os, data.tag_name || site.fallbackVersion)
  } catch {
    return fallbackUrl(os, site.fallbackVersion)
  }
}

async function track(request, name, data) {
  const id = site.analytics?.umamiWebsiteId
  if (!id) return
  const url = new URL(request.url)
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

export async function onRequestGet({ request, params, waitUntil }) {
  const os = String(params.os || '').toLowerCase()
  const origin = new URL(request.url).origin
  if (!EXT[os]) return redirect(`${origin}/#telecharger`)

  if (site.downloads?.open === false) {
    waitUntil(track(request, 'fichier-en-pause', { os }))
    return redirect(`${origin}/#telecharger`)
  }

  const target = await latestAssetUrl(os)
  waitUntil(track(request, 'fichier', { os }))
  return redirect(target)
}
