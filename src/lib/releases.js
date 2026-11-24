/**
 * Numéro de la dernière version publiée sur GitHub, pour l'affichage.
 *
 * SÉCURITÉ : le navigateur ne construit plus aucune adresse de fichier. Tous les
 * boutons passent par /telecharger/<système> (functions/telecharger/[os].js), qui
 * seul décide vers quel fichier rediriger, et uniquement dans le dépôt officiel.
 *
 * Le résultat est gardé 10 minutes dans l'onglet (Hero et section Télécharger
 * partagent un seul appel à l'API GitHub). Un numéro mémorisé plus ancien que
 * `fallbackVersion` (version connue à la construction du site) est ignoré : un
 * onglet ouvert avant une publication n'affiche pas l'ancienne version.
 * Repli sans réseau : `fallbackVersion` (site.json).
 */
const CACHE_KEY = 'jema-latest-version-v2'
const CACHE_MS = 10 * 60 * 1000
const VERSION_SURE = /^v\d+\.\d+\.\d+$/

/** Compare « v4.1.2 » et « v4.0.0 » : négatif si a < b. */
const comparer = (a, b) => {
  const x = a.slice(1).split('.').map(Number)
  const y = b.slice(1).split('.').map(Number)
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
}

let pending = null

export function latestRelease(repo, fallbackVersion) {
  if (pending) return pending
  pending = (async () => {
    try {
      sessionStorage.removeItem('jema-latest-version') // ancien format, sans date
      const { v, t } = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}')
      const frais = Date.now() - t < CACHE_MS
      if (frais && VERSION_SURE.test(v) && (!VERSION_SURE.test(fallbackVersion) || comparer(v, fallbackVersion) >= 0)) {
        return { version: v, live: true }
      }
    } catch { /* stockage indisponible */ }
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      if (!res.ok) throw new Error(String(res.status))
      const tag = (await res.json()).tag_name
      if (!VERSION_SURE.test(tag)) throw new Error('version illisible')
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ v: tag, t: Date.now() })) } catch { /* ignoré */ }
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
