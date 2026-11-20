/**
 * Numéro de la dernière version publiée sur GitHub, pour l'affichage.
 *
 * SÉCURITÉ : le navigateur ne construit plus aucune adresse de fichier. Tous les
 * boutons passent par /telecharger/<système> (functions/telecharger/[os].js), qui
 * seul décide vers quel fichier rediriger, et uniquement dans le dépôt officiel.
 *
 * Le résultat est gardé pour la session (Hero et section Télécharger partagent
 * un seul appel à l'API GitHub). Repli sans réseau : `fallbackVersion` (site.json).
 */
const CACHE_KEY = 'jema-latest-version'
const VERSION_SURE = /^v\d+\.\d+\.\d+$/

let pending = null

export function latestRelease(repo, fallbackVersion) {
  if (pending) return pending
  pending = (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached && VERSION_SURE.test(cached)) return { version: cached, live: true }
    } catch { /* stockage indisponible */ }
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      if (!res.ok) throw new Error(String(res.status))
      const tag = (await res.json()).tag_name
      if (!VERSION_SURE.test(tag)) throw new Error('version illisible')
      try { sessionStorage.setItem(CACHE_KEY, tag) } catch { /* ignoré */ }
      return { version: tag, live: true }
    } catch {
      return { version: fallbackVersion, live: false }
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
