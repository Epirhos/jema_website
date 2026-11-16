/**
 * Plugin rehype : préfixe les liens internes absolus (« /legal/... ») des
 * contenus Markdown avec BASE_PATH, pour qu'ils marchent sous un sous-dossier.
 */
export default function rehypeBase(base = '/') {
  const prefix = base.replace(/\/$/, '')
  return () => (tree) => {
    if (!prefix) return
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'a') {
        const href = node.properties?.href
        if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(prefix + '/')) {
          node.properties.href = prefix + href
        }
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
}
