/**
 * Dernière version publiée sur GitHub + lien direct par système.
 * Repli sans réseau : liens construits depuis `fallbackVersion` (site.json).
 * Le résultat est mis en cache pour la session (Hero et section Télécharger
 * partagent un seul appel à l'API GitHub).
 */
const CACHE_KEY = 'jema-latest-release'

function fallbackUrls(repo, tag) {
  const n = tag.replace(/^v/, '')
  const base = `https://github.com/${repo}/releases/download/${tag}`
  return {
    windows: `${base}/jema-editor-${n}-setup.exe`,
    mac: `${base}/jema-editor-${n}.dmg`,
    appimage: `${base}/jema-editor-${n}.AppImage`,
    deb: `${base}/jema-editor_${n}_amd64.deb`
  }
}

let pending = null

export function latestRelease(repo, fallbackVersion) {
  if (pending) return pending
  pending = (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) return JSON.parse(cached)
    } catch { /* stockage indisponible */ }
    const fallback = { version: fallbackVersion, urls: fallbackUrls(repo, fallbackVersion), live: false }
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      if (!res.ok) return fallback
      const data = await res.json()
      const assets = Array.isArray(data.assets) ? data.assets : []
      const find = (ext) => assets.find((a) => (a.name || '').toLowerCase().endsWith(ext))?.browser_download_url
      const tag = data.tag_name || fallbackVersion
      const fb = fallbackUrls(repo, tag)
      const result = {
        version: tag,
        live: true,
        urls: {
          windows: find('.exe') || fb.windows,
          mac: find('.dmg') || fb.mac,
          appimage: find('.appimage') || fb.appimage,
          deb: find('.deb') || fb.deb
        }
      }
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch { /* ignoré */ }
      return result
    } catch {
      return fallback
    }
  })()
  return pending
}

/** 'windows' | 'mac' | 'linux' | 'mobile' | null */
export function detectOS() {
  const ua = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile'
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'mac'
  if (/Linux|X11/i.test(ua)) return 'linux'
  return null
}

export const OS_LABEL = { windows: 'Windows', mac: 'macOS', linux: 'Linux' }
