import { useState } from 'react'
import { Home, BookOpen, StickyNote, BarChart3, Settings } from 'lucide-react'
import Reveal from './Reveal.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'
import EditorPreview from './EditorPreview.jsx'
import ChatSimulation from './ChatSimulation.jsx'

const NAV_ICONS = [Home, BookOpen, StickyNote, BarChart3, Settings]

export default function Showcase() {
  // Sur mobile, un seul panneau à la fois (éditeur OU Jema) au lieu de les empiler.
  const [pane, setPane] = useState('editor')
  return (
    <section id="showcase" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-8 text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
            Un aperçu vivant de l'atelier
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Écrivez dans l'éditeur, dialoguez avec Jema, changez de thème&nbsp;: l'interface est
            identique à l'application de bureau.
          </p>
          <div className="mt-5 flex justify-center">
            <ThemeSwitcher />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mb-3 flex justify-center gap-2 lg:hidden" role="tablist" aria-label="Panneau affiché">
            {[
              { id: 'editor', label: 'Éditeur' },
              { id: 'chat', label: 'Demander à Jema' }
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={pane === t.id}
                onClick={() => setPane(t.id)}
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={
                  pane === t.id
                    ? { background: 'var(--accent-gradient)', color: '#fff' }
                    : { color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="glass overflow-hidden rounded-3xl">
            {/* Barre de fenêtre */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--glass-border)' }}
            >
              <span className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
                <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
                <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
              </span>
              <span className="ml-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Jema — Sombre Union · Chapitre 1
              </span>
            </div>

            {/* Corps 3 zones */}
            <div className="flex h-[560px] lg:h-[min(72vh,620px)]">
              {/* Sidebar gauche */}
              <div
                aria-hidden="true"
                className="hidden w-14 flex-col items-center gap-2 py-4 sm:flex"
                style={{ background: 'var(--tab-bar-bg)', borderRight: '1px solid var(--glass-border)' }}
              >
                {NAV_ICONS.map((Icon, i) => (
                  <span
                    key={i}
                    className="grid h-10 w-10 place-items-center rounded-xl "
                    style={{
                      color: i === 1 ? 'var(--accent-color)' : 'var(--tab-inactive-color)',
                      background: i === 1 ? 'var(--nav-icon-bg-hover, rgba(0,0,0,0.05))' : 'transparent'
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                ))}
              </div>

              {/* Éditeur */}
              <div
                className={`${pane === 'editor' ? 'block' : 'hidden'} min-w-0 flex-1 lg:block`}
                style={{ background: 'var(--toolbar-bg)' }}
              >
                <EditorPreview />
              </div>

              {/* Panneau droit */}
              <aside
                className={`${pane === 'chat' ? 'block' : 'hidden'} w-full shrink-0 lg:block lg:w-[300px]`}
                style={{ borderLeft: '1px solid var(--glass-border)' }}
              >
                <ChatSimulation />
              </aside>
            </div>
          </div>

        </Reveal>
      </div>
    </section>
  )
}
