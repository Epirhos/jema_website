import { useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  List,
  Quote,
  Sparkles,
  StickyNote,
  Loader2,
  Check,
  X
} from 'lucide-react'

const SEED = `<h2>Chapitre premier — La cabine d'essayage</h2><p>Darelle poussa le rideau de la cabine, le cœur battant. Dans le miroir, une inconnue lui rendait son regard : plus assurée, presque téméraire. Lucien l'attendait de l'autre côté, et elle savait déjà que rien ne serait plus comme avant.</p>`

function TBtn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className="grid h-8 w-8 place-items-center rounded-lg transition-colors"
      style={{
        color: active ? '#fff' : 'var(--text-secondary)',
        background: active ? 'var(--accent-color)' : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

/**
 * Suggestions simulées, comme dans l'app (CorrectionReview) : Jema PROPOSE,
 * l'auteur accepte ou ignore. Rien n'est réécrit sans son accord.
 */
const SUGGESTIONS = [
  {
    id: 'rythme',
    kind: 'Rythme',
    from: "l'attendait de l'autre côté, et elle savait",
    to: "l'attendait de l'autre côté ; elle savait",
    reason: 'Deux propositions longues liées par « et » : un point-virgule marque mieux la bascule.'
  },
  {
    id: 'cliche',
    kind: 'Style',
    from: null,
    to: null,
    reason: '« Rien ne serait plus comme avant » est une formule très courante. Une image à vous la rendrait plus marquante.'
  }
]

export default function EditorPreview() {
  const [tab, setTab] = useState('redaction')
  const [correcting, setCorrecting] = useState(false)
  const [pending, setPending] = useState([])
  const [toast, setToast] = useState(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Placeholder.configure({ placeholder: 'Commencez votre histoire ici…' })
    ],
    content: SEED,
    editorProps: {
      attributes: { class: 'focus:outline-none', spellcheck: 'false' }
    }
  })

  if (!editor) return <div className="min-h-[420px]" />

  const flash = (text) => {
    setToast(text)
    setTimeout(() => setToast(null), 2400)
  }

  const runCorrection = () => {
    if (correcting) return
    setPending([])
    setCorrecting(true)
    setTimeout(() => {
      setCorrecting(false)
      setPending(SUGGESTIONS)
    }, 1200)
  }

  const resolve = (s, accept) => {
    if (accept && s.from) {
      const html = editor.getHTML()
      if (html.includes(s.from)) editor.commands.setContent(html.replace(s.from, `<mark>${s.to}</mark>`))
    }
    setPending((list) => {
      const next = list.filter((x) => x.id !== s.id)
      if (next.length === 0) flash('Relecture terminée · votre texte, vos choix')
      return next
    })
  }

  const addNote = () => {
    editor.chain().focus().toggleHighlight().run()
    flash('Note inline ajoutée au passage')
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Onglets — Rédaction / Mise en page (comme la toolbar de l'app) */}
      <div
        className="flex items-center gap-1 px-3 pt-2"
        style={{ borderBottom: '1px solid var(--toolbar-border)' }}
      >
        {[
          { id: 'redaction', label: 'Rédaction' },
          { id: 'layout', label: 'Mise en page' }
        ].map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: active ? 'var(--tab-active-color)' : 'var(--tab-inactive-color)' }}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="editor-tab"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: 'var(--tab-active-color)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Barre d'outils */}
      <div
        className="flex flex-wrap items-center gap-1 px-3 py-2"
        style={{ background: 'var(--toolbar-bg)', borderBottom: '1px solid var(--toolbar-border)' }}
      >
        <TBtn title="Titre" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </TBtn>
        <span className="mx-1 h-5 w-px" style={{ background: 'var(--toolbar-border)' }} />
        <TBtn title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </TBtn>
        <TBtn title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </TBtn>
        <TBtn title="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </TBtn>
        <span className="mx-1 h-5 w-px" style={{ background: 'var(--toolbar-border)' }} />
        <TBtn title="Liste" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </TBtn>
        <TBtn title="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </TBtn>

        <div className="ml-auto">
          <button
            onClick={runCorrection}
            disabled={correcting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-70"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {correcting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Correction…
              </>
            ) : pending.length > 0 ? (
              <>
                <Check size={14} /> {pending.length} suggestion{pending.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Sparkles size={14} /> Correction
              </>
            )}
          </button>
        </div>
      </div>

      {/* Surface papier */}
      <div className="paper-surface flex-1 overflow-auto p-5" style={{ background: 'var(--scroller-bg)' }}>
        <div
          className="mx-auto max-w-[62ch] rounded-md px-6 py-7 sm:px-10 sm:py-10"
          style={{ background: 'var(--paper-color)', boxShadow: 'var(--glass-shadow)' }}
        >
          <EditorContent editor={editor} />
        </div>

      </div>

      {/* Suggestions : superposées en bas de la page, toujours visibles */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 mx-auto flex max-w-[62ch] flex-col gap-2">
          <AnimatePresence>
            {pending.map((sug, i) => (
              <motion.div
                key={sug.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
                exit={{ opacity: 0, x: 30 }}
                className="glass pointer-events-auto rounded-xl p-3 text-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
                    style={{ background: 'var(--accent-color)' }}
                  >
                    {sug.kind}
                  </span>
                  <p className="flex-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {sug.reason}
                  </p>
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => resolve(sug, false)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
                  >
                    <X size={12} /> {sug.from ? 'Ignorer' : 'Compris'}
                  </button>
                  {sug.from && (
                    <button
                      type="button"
                      onClick={() => resolve(sug, true)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ background: 'var(--accent-gradient)' }}
                    >
                      <Check size={12} /> Accepter
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
      </div>

      {/* Bubble menu — barre flottante de sélection (Gras / Italique / Note) */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="glass flex items-center gap-1 rounded-xl p-1"
      >
        <TBtn title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </TBtn>
        <TBtn title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </TBtn>
        <TBtn title="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </TBtn>
        <span className="mx-0.5 h-5 w-px" style={{ background: 'var(--glass-border)' }} />
        <TBtn title="Ajouter une note" active={editor.isActive('highlight')} onClick={addNote}>
          <StickyNote size={15} />
        </TBtn>
      </BubbleMenu>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: 'var(--success-color)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
