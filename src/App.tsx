import { useEffect, useRef, useState } from 'react'
import {
  createInitialState,
  sessionReducer,
  type CodeType,
  type SessionState,
} from './session/session'
import { encode } from './encoder/bwip'
import { deleteSet, loadSet, saveSet, type LabelSet } from './sets/sets'
import { loadDraft, localSetStore, saveDraft } from './sets/localStore'

const TYPES: { value: CodeType; label: string; hint: string }[] = [
  { value: '2', label: 'Code 39', hint: '2' },
  { value: '4', label: 'Code 128', hint: '4' },
  { value: '11', label: 'QR Code', hint: '11' },
  { value: '12', label: 'PDF417', hint: '12' },
  { value: '13', label: 'Data Matrix', hint: '13' },
]

const NATIVE: Record<CodeType, { w: number; h: number }> = {
  '2': { w: 480, h: 160 },
  '4': { w: 480, h: 160 },
  '11': { w: 320, h: 320 },
  '12': { w: 480, h: 200 },
  '13': { w: 320, h: 320 },
}

export default function App() {
  const [state, setState] = useState<SessionState>(() => loadDraft() ?? createInitialState())
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ src: string; w: number; h: number } | null>(null)
  const [sets, setSets] = useState<LabelSet[]>(() => localSetStore.load())
  const [setName, setSetName] = useState('')
  const [selectedSetId, setSelectedSetId] = useState('')
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  function apply(event: Parameters<typeof sessionReducer>[1]) {
    const next = sessionReducer(state, event, encode)
    if (next instanceof Promise) {
      setBusy(true)
      void next.then((s) => {
        setState(s)
        setBusy(false)
      })
    } else {
      setState(next)
    }
  }

  useEffect(() => {
    saveDraft(state)
  }, [state])

  useEffect(() => {
    if (!preview) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  function stampName(): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  function persistNamed() {
    const name = setName.trim() || stampName()
    const next = saveSet(localSetStore, { name, session: state, id: selectedSetId || undefined })
    setSets(next)
    const saved = next.find((s) => s.id === selectedSetId || s.name === name)
    if (saved) setSelectedSetId(saved.id)
  }

  function selectSession(id: string) {
    const nextSession = sets.find((set) => set.id === id)
    if (!nextSession || nextSession.id === selectedSetId) return

    const currentSession = sets.find((set) => set.id === selectedSetId)
    if (currentSession) {
      setSets(saveSet(localSetStore, { name: currentSession.name, session: state, id: currentSession.id }))
    }
    const loaded = loadSet(localSetStore, nextSession.id)
    if (loaded.rows.length) {
      setState(loaded)
      setSelectedSetId(nextSession.id)
      setSetName(nextSession.name)
      setSessionPickerOpen(false)
    }
  }

  function exportSession() {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `code-label-session-${stamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function importSession(file: File) {
    void file.text().then((contents) => {
      const imported = JSON.parse(contents) as SessionState
      const validType = (t: unknown) => TYPES.some((opt) => opt.value === t)
      if (
        !Array.isArray(imported.rows) ||
        !imported.rows.length ||
        imported.rows.some((r) =>
          !r || typeof r.data !== 'string' ||
          !validType(r.type) ||
          typeof r.id !== 'string'
        )
      ) throw new Error('Invalid session')
      setState(imported)
      setSelectedSetId('')
      setSetName('')
    }).catch(() => alert('That file does not contain a valid session.'))
  }

  return (
    <div className="min-h-svh bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-100/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-2 sm:px-8 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Code Label Tool</h1>
              <p className="mt-0.5 text-sm text-zinc-500">Type a payload, generate, scan off the screen.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={busy} className="ui-primary rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50" onClick={() => apply({ type: 'GENERATE_ALL' })}>
                {busy ? 'Generating…' : 'Generate all'}
              </button>
              <button type="button" className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => apply({ type: 'DELETE_ALL' })}>
                Reset
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-2">
            <div className="flex items-center gap-2">
              <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importSession(file)
                e.target.value = ''
              }} />
              <button type="button" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" onClick={() => importInputRef.current?.click()}>
                Import
              </button>
              <button type="button" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" onClick={exportSession}>
                Export
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex items-stretch overflow-visible rounded-lg border border-zinc-300 bg-white">
                <input
                  aria-label="session name"
                  placeholder="New session name"
                  className="w-44 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none focus:bg-zinc-50 sm:w-56"
                  value={setName}
                  onChange={(e) => {
                    const name = e.target.value
                    setSetName(name)
                    if (name !== sets.find((set) => set.id === selectedSetId)?.name) setSelectedSetId('')
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') persistNamed() }}
                />
                <button
                  type="button"
                  aria-label="clear session name"
                  title="Clear session name"
                  className="border-l border-zinc-200 px-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                  onClick={() => {
                    setSetName('')
                    setSelectedSetId('')
                    setSessionPickerOpen(false)
                  }}
                >
                  ×
                </button>
                <button
                  type="button"
                  aria-label="select session"
                  title="Select session"
                  className="border-l border-zinc-200 px-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                  onClick={() => setSessionPickerOpen((open) => !open)}
                >
                  ▾
                </button>
                {sessionPickerOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 max-h-56 min-w-full overflow-y-auto rounded-lg border border-zinc-300 bg-white py-1 shadow-lg">
                    {sets.length ? sets.map((set) => (
                      <button key={set.id} type="button" className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50" onClick={() => selectSession(set.id)}>
                        {set.name} <span className="text-zinc-400">({set.rows.length})</span>
                      </button>
                    )) : <span className="block px-3 py-1.5 text-sm text-zinc-400">No saved sessions</span>}
                  </div>
                )}
              </div>
              <button type="button" aria-label="create session" title="Create session" className="border-l border-zinc-200 px-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40" onClick={persistNamed}>Save</button>
              <button type="button" aria-label="delete session" title="Delete session" disabled={!selectedSetId} className="border-l border-zinc-200 px-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-30" onClick={() => {
                if (!selectedSetId) return
                setSets(deleteSet(localSetStore, selectedSetId))
                setSelectedSetId('')
                setSetName('')
              }}>Delete</button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-5 py-6 pb-20 sm:px-8 sm:py-8 lg:grid-cols-2">
        {state.rows.map((row, index) => {
          const native = NATIVE[row.type]
          return (
            <article
              key={row.id}
              className="flex min-w-0 items-stretch gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm"
            >
              <div className="flex w-40 shrink-0 flex-col gap-1.5 sm:w-44">
                <select
                  aria-label="type"
                  className="w-full rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs"
                  value={row.type}
                  onChange={(e) =>
                    apply({ type: 'CHANGE_TYPE', id: row.id, codeType: e.target.value as CodeType })
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.hint})
                    </option>
                  ))}
                </select>

                <textarea
                  aria-label="data"
                  rows={2}
                  placeholder="Payload"
                  className="h-14 w-full resize-none rounded-md border border-zinc-300 px-2 py-1 font-mono leading-3 outline-none focus:border-zinc-500"
                  style={{ fontSize: '12px', lineHeight: '15px' }}
                  value={row.data}
                  onChange={(e) =>
                    apply({ type: 'CHANGE_DATA', id: row.id, data: e.target.value })
                  }
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="ui-generate w-full rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
                    onClick={() => apply({ type: 'GENERATE_ONE', id: row.id })}
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="relative min-h-0 min-w-0 flex-1 self-stretch">
                <div
                  className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg border bg-white ${row.error
                    ? 'border-red-200 bg-red-50'
                    : row.stale
                      ? 'border-amber-200'
                      : 'border-zinc-200'
                    }`}
                >
                  <span
                    className="absolute top-1.5 left-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-zinc-900 bg-white font-mono text-xs font-semibold tabular-nums text-zinc-900 shadow-sm"
                    title={`Scan ${index + 1} of ${state.rows.length}`}
                  >
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-white/90 text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-30"
                    disabled={state.rows.length === 1}
                    aria-label="delete row"
                    onClick={() => apply({ type: 'DELETE_ROW', id: row.id })}
                  >
                    <span className="text-base leading-none">×</span>
                  </button>
                  {row.image && !row.error ? (
                    <button
                      type="button"
                      aria-label="expand preview"
                      className="absolute bottom-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white/90 text-zinc-600 shadow-sm hover:bg-white"
                      onClick={() => setPreview({ src: row.image!, w: native.w, h: native.h })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </button>
                  ) : null}
                  {row.error ? (
                    <span className="px-3 text-center text-xs font-medium text-red-600">Invalid Code</span>
                  ) : row.image ? (
                    <img
                      src={row.image}
                      alt=""
                      className={`max-h-full max-w-[85%] object-contain ${row.stale ? 'opacity-45' : ''}`}
                    />
                  ) : (
                    <span className="px-3 text-center text-xs text-zinc-400">Empty slot</span>
                  )}
                </div>
              </div>
            </article>
          )
        })}
        <button
          type="button"
          tabIndex={-1}
          className="ui-add group flex min-h-[7.75rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-300 bg-white/70 p-2 text-zinc-500 transition hover:border-zinc-400 hover:bg-white hover:text-zinc-800 hover:shadow-sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply({ type: 'ADD_ROW' })}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-xl leading-none transition group-hover:border-zinc-400 group-hover:bg-zinc-50 group-hover:text-zinc-800">
            +
          </span>
          <span className="text-xs font-medium tracking-wide">Add label</span>
        </button>
      </main>

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex max-h-[92svh] max-w-[92vw] items-center justify-center rounded-2xl bg-white p-8 pt-12 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
              onClick={() => setPreview(null)}
            >
              Close
            </button>
            <img
              src={preview.src}
              alt=""
              className="h-auto w-auto object-contain"
              style={{
                width: `min(80vw, calc(80svh * ${preview.w} / ${preview.h}))`,
                height: `min(80svh, calc(80vw * ${preview.h} / ${preview.w}))`,
                imageRendering: 'pixelated',
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
