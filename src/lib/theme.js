/**
 * Thème partagé entre îlots React : la classe vit sur <html> (posée avant le
 * rendu par le script de Base.astro), un événement synchronise les sélecteurs.
 */
import { useEffect, useState } from 'react'

export const THEMES = [
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
  { id: 'editorial', label: 'Éditorial' }
]
const STORAGE_KEY = 'jema-website-theme'
const EVENT = 'jema-theme'

function current() {
  if (typeof document === 'undefined') return 'light'
  return THEMES.find((t) => document.documentElement.classList.contains(t.id))?.id ?? 'light'
}

export function applyTheme(id) {
  const root = document.documentElement
  root.classList.remove(...THEMES.map((t) => t.id))
  root.classList.add(id)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* stockage indisponible : le choix vaut pour la page en cours */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }))
}

export function useTheme() {
  const [theme, setTheme] = useState('light')
  useEffect(() => {
    setTheme(current())
    const onChange = (e) => setTheme(e.detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  return { theme, setTheme: applyTheme }
}
