/**
 * Alertes de sécurité envoyées par les fonctions Cloudflare (téléchargements,
 * rapports de la politique de sécurité du navigateur).
 *
 * Canal : une notification push sur téléphone via ntfy.sh (gratuit, sans compte).
 * Réglage dans Cloudflare → Workers & Pages → jema → Settings → Variables and Secrets :
 *   ALERTE_NTFY = https://ntfy.sh/<sujet-secret>   (type « Secret »)
 * puis s'abonner au même sujet dans l'application ntfy (Android, iOS, navigateur).
 * Sans ce réglage, les alertes sont seulement écrites dans les journaux de la fonction.
 *
 * Une même alerte n'est envoyée qu'une fois par heure (anti-avalanche).
 */
const UNE_HEURE = 3600

async function dejaEnvoyee(cle) {
  try {
    const cache = caches.default
    const req = new Request(`https://alertes.jema.invalid/${encodeURIComponent(cle).slice(0, 200)}`)
    if (await cache.match(req)) return true
    await cache.put(req, new Response('1', { headers: { 'Cache-Control': `max-age=${UNE_HEURE}` } }))
  } catch { /* pas de cache disponible : on envoie */ }
  return false
}

export async function alerter(env, titre, detail) {
  console.warn(`[ALERTE] ${titre} — ${detail}`)
  const url = env?.ALERTE_NTFY
  if (!url || !/^https:\/\/ntfy\.sh\/[\w-]{8,}$/.test(url)) return
  if (await dejaEnvoyee(titre + detail)) return
  try {
    await fetch(url, {
      method: 'POST',
      // Titre en UTF-8 encodé (RFC 2047), compris par ntfy : les accents passent.
      headers: { Title: `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(`Jema · ${titre}`)))}?=`, Priority: 'high', Tags: 'warning' },
      body: String(detail).slice(0, 1500)
    })
  } catch { /* l'alerte ne doit jamais casser la page */ }
}
