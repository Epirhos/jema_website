/**
 * Préfixe un chemin interne avec la base du site (BASE_PATH), pour que les
 * liens marchent aussi bien à la racine (Cloudflare) que sous /jema_website/
 * (GitHub Pages). `url('/telecharger')`, `url('/#features')`.
 */
export function url(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
