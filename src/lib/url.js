/**
 * Construit un lien interne à partir de la base du site (BASE_URL d'Astro,
 * « / » sur Cloudflare). `url('/telecharger')`, `url('/#features')`.
 * Garder ce passage obligé : changer d'hébergement ne touche qu'ici.
 */
export function url(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
