const LEGAL_LINKS = [
  { href: '#mentions-legales', label: 'Mentions légales' },
  { href: '#confidentialite', label: 'Confidentialité' },
  { href: `${import.meta.env.BASE_URL}legal/licence-beta.txt`, label: 'Licence bêta' },
  { href: '#contact', label: 'Contact' }
]

export default function Footer() {
  return (
    <footer className="px-4 pb-10 pt-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="glass rounded-3xl px-6 py-8 sm:px-10">
          <nav aria-label="Liens légaux" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {LEGAL_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="transition-colors hover:underline" style={{ color: 'var(--text-secondary)' }}>
                {l.label}
              </a>
            ))}
          </nav>
          <div
            className="mt-6 flex flex-col items-center justify-between gap-2 pt-6 text-xs sm:flex-row"
            style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
          >
            <span>© {new Date().getFullYear()} Jema · Dahirou Nounsi (Epirhos)</span>
            <span>Conçu pour les auteurs · Local-first · Chiffrement AES-256</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
