import { useState, useEffect } from 'react'
import { Download as DownloadIcon, Check } from 'lucide-react'
import Reveal from './Reveal.jsx'
import site from '../data/site.json'

const GITHUB_RELEASE_REPO = site.releasesRepo
const FALLBACK_VERSION = site.fallbackVersion
const DEFAULT_DOWNLOADS = {
  windows: 'https://github.com/Epirhos/jema-releases/releases/download/v4.0.0/jema-editor-4.0.0-setup.exe',
  mac: 'https://github.com/Epirhos/jema-releases/releases/download/v4.0.0/jema-editor-4.0.0.dmg',
  appimage: 'https://github.com/Epirhos/jema-releases/releases/download/v4.0.0/jema-editor-4.0.0.AppImage',
  deb: 'https://github.com/Epirhos/jema-releases/releases/download/v4.0.0/jema-editor_4.0.0_amd64.deb'
}

// Icônes OS en SVG inline (marques → tracé neutre monochrome).
const Windows = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M3 5.5 10.5 4.4v7.1H3V5.5Zm0 13 7.5 1.1v-7H3v5.9Zm8.5 1.2L21 21V12.5h-9.5v7.2Zm0-15.4v7.2H21V3l-9.5 1.3Z" />
  </svg>
)
const Apple = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.4 12.9c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8ZM14 5.7c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z" />
  </svg>
)
const Linux = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2c-2 0-3 1.7-3 3.6 0 1.2.1 2.1-.5 3-.7 1-2 2.2-2.6 3.9-.3.8-.2 1.5 0 2-.5.4-.9 1-.6 1.7.2.6.9.7 1.5 1 .5.2.9.6 1.4.9.6.4 1.3.6 2.4.6s1.8-.2 2.4-.6c.5-.3.9-.7 1.4-.9.6-.3 1.3-.4 1.5-1 .3-.7-.1-1.3-.6-1.7.2-.5.3-1.2 0-2-.6-1.7-1.9-2.9-2.6-3.9-.6-.9-.5-1.8-.5-3C15 3.7 14 2 12 2Zm-1.4 4c.3 0 .5.3.5.7s-.2.7-.5.7-.5-.3-.5-.7.2-.7.5-.7Zm2.8 0c.3 0 .5.3.5.7s-.2.7-.5.7-.5-.3-.5-.7.2-.7.5-.7Z" />
  </svg>
)

const PLATFORMS = [
  {
    os: 'macOS',
    Icon: Apple,
    meta: 'Apple Silicon & Intel · .dmg',
    note: 'Universel',
    hrefKey: 'mac',
  },
  {
    os: 'Windows',
    Icon: Windows,
    meta: 'Windows 10/11 · .exe',
    note: 'Installeur < 300 Mo',
    hrefKey: 'windows'
  },
  {
    os: 'Linux',
    Icon: Linux,
    meta: 'AppImage · .deb',
    note: 'x86_64',
    linuxOptions: [
      {
        label: 'DEB',
        hrefKey: 'deb',
        description: 'Paquet Debian pour installation système sur Ubuntu/Mint.'
      },
      {
        label: 'AppImage',
        hrefKey: 'appimage',
        description: 'Exécutable portable, aucun paquet à installer.'
      }
    ],
  }
]

export default function Download() {
  const [linuxVariant, setLinuxVariant] = useState('DEB')
  const [downloadUrls, setDownloadUrls] = useState(DEFAULT_DOWNLOADS)
  const [version, setVersion] = useState(FALLBACK_VERSION)
  const [userOs, setUserOs] = useState('Windows')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch latest release and update URLs. Exposed for manual retry.
  async function fetchLatestRelease() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`https://api.github.com/repos/${GITHUB_RELEASE_REPO}/releases/latest`)
      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`)
      }

      const data = await response.json()
      const assets = Array.isArray(data.assets) ? data.assets : []

      if (data.tag_name) setVersion(data.tag_name)

      const exeAsset = assets.find((asset) => (asset.name || '').toLowerCase().endsWith('.exe'))
      const dmgAsset = assets.find((asset) => (asset.name || '').toLowerCase().endsWith('.dmg'))
      const appImageAsset = assets.find((asset) => (asset.name || '').toLowerCase().endsWith('.appimage'))
      const debAsset = assets.find((asset) => (asset.name || '').toLowerCase().endsWith('.deb'))

      setDownloadUrls({
        windows: exeAsset?.browser_download_url ?? DEFAULT_DOWNLOADS.windows,
        mac: dmgAsset?.browser_download_url ?? DEFAULT_DOWNLOADS.mac,
        appimage: appImageAsset?.browser_download_url ?? DEFAULT_DOWNLOADS.appimage,
        deb: debAsset?.browser_download_url ?? DEFAULT_DOWNLOADS.deb
      })
    } catch (err) {
      setError('Les dernières versions GitHub sont momentanément indisponibles. Le téléchargement reste disponible avec la version stable.')
      console.error('Impossible de récupérer les liens de la release GitHub', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestRelease()
    const ua = navigator.userAgent
    if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) setUserOs('macOS')
    else if (/Linux/i.test(ua) && !/Android/i.test(ua)) setUserOs('Linux')
  }, [])

  return (
    <section id="download" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
            Installez Jema
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Léger à l'installation. Le moteur IA se télécharge en un clic, au premier usage, avec
            votre accord.
          </p>
          <p className="mt-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Version {version}{site.beta.active ? ` · ${site.beta.label.replace(/^Bêta ouverte · /, 'Bêta ')}` : ''}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.os} delay={i * 0.08}>
              <div
                className="glass flex h-full flex-col items-center rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
                style={p.os === userOs ? { boxShadow: 'var(--glass-shadow), 0 0 40px var(--accent-glow)' } : undefined}
              >
                <span style={{ color: 'var(--text-primary)' }}>
                  <p.Icon width={40} height={40} />
                </span>
                <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {p.os}
                </h3>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {p.meta}
                </p>
                {p.linuxOptions ? (
                  <>
                    <div className="mt-4 flex w-full gap-2">
                      {p.linuxOptions.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setLinuxVariant(option.label)}
                          className={`inline-flex flex-1 items-center justify-center rounded-xl border px-3 py-2 text-[13px] font-semibold transition ${
                            linuxVariant === option.label
                              ? 'border-transparent text-white'
                              : 'border-[var(--glass-border)] bg-transparent text-[var(--text-primary)]'
                          }`}
                          style={{ background: linuxVariant === option.label ? 'var(--accent-gradient)' : undefined }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {p.linuxOptions.find((option) => option.label === linuxVariant)?.description}
                    </p>
                    <a
                      href={
                        linuxVariant === 'DEB'
                          ? downloadUrls.deb
                          : downloadUrls.appimage
                      }
                      target="_blank" rel="noopener noreferrer"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                      style={
                        p.os === userOs
                          ? { background: 'var(--accent-gradient)', color: '#fff' }
                          : { background: 'var(--search-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }
                      }
                    >
                      <DownloadIcon size={16} /> Télécharger {linuxVariant}
                    </a>
                  </>
                ) : (
                  <a
                    href={downloadUrls[p.hrefKey]}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                    style={
                      p.os === userOs
                        ? { background: 'var(--accent-gradient)', color: '#fff' }
                        : { background: 'var(--search-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }
                    }
                  >
                    <DownloadIcon size={16} /> Télécharger
                  </a>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--success-color)' }}>
                  <Check size={12} /> {p.note}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        {!loading && error ? (
          <div className="mt-6 text-center">
            <p className="mb-3 text-sm font-medium" style={{ color: 'var(--danger-color)' }}>
              {error}
            </p>
            <div>
              <button
                type="button"
                onClick={fetchLatestRelease}
                className="inline-flex items-center gap-2 rounded-lg bg-[rgba(0,0,0,0.06)] px-4 py-2 text-sm font-medium"
                style={{ border: '1px solid var(--glass-border)' }}
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Gratuit. Vos manuscrits vous appartiennent — aucune donnée n'est envoyée sans votre accord.
          </p>
        )}

        <div className="glass mx-auto mt-8 max-w-3xl rounded-2xl p-5 text-left text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Un avertissement à l'installation ? C'est normal pendant la bêta.
          </p>
          <p className="mt-2">
            Jema n'est pas encore signé numériquement. <strong>Windows</strong> peut afficher « Windows a protégé votre
            ordinateur » : cliquez sur <em>Informations complémentaires</em>, puis <em>Exécuter quand même</em>.{' '}
            <strong>macOS</strong> peut refuser d'ouvrir l'application : faites un clic droit sur Jema dans le dossier
            Applications, puis <em>Ouvrir</em>.
          </p>
          <p className="mt-2">
            <strong>Configuration :</strong> {site.requirements.ram}. Il fonctionne entièrement sur votre
            ordinateur. Pendant la bêta, exportez régulièrement vos manuscrits.
          </p>
        </div>
      </div>
    </section>
  )
}
