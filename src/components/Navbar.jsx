import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import { url } from '../lib/url.js'

const LINKS = [
  { href: url('/#comment'), label: 'Comment ça marche' },
  { href: url('/#visite'), label: "Visite de l'atelier" },
  { href: url('/#telecharger'), label: 'Télécharger' },
  { href: url('/#contact'), label: 'Contact' }
]

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
    </svg>
  )
}

/** Barre fixe : logo + nom à gauche, bouton Télécharger toujours visible à droite. */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: scrolled || open ? 'rgba(243, 240, 232, 0.94)' : 'transparent',
        borderBottom: `1px solid ${scrolled || open ? 'var(--rule)' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(10px)' : 'none'
      }}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <a href={url('/')} aria-label="Jema, accueil" className="no-underline">
          <Logo />
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 text-sm lg:flex" style={{ color: 'var(--mute)' }}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="no-underline transition-colors hover:text-[color:var(--ink)]">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={url('/#telecharger')} className="btn btn--ink" data-umami-event="nav-telecharger">
            <DownloadIcon /> Télécharger
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full lg:hidden"
            style={{ boxShadow: 'inset 0 0 0 1px var(--rule)', color: 'var(--ink)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Navigation mobile" className="wrap grid pb-4 lg:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-t py-3 text-base no-underline" style={{ borderColor: 'var(--rule)' }}>
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
