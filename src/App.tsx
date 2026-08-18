import { useState } from 'react'
import {
  createInitialState,
  sessionReducer,
  type CodeType,
  type SessionState,
} from './session/session'
import { encode } from './encoder/bwip'

const TYPES: { value: CodeType; label: string }[] = [
  { value: '2', label: 'Code39 (2)' },
  { value: '4', label: 'Code128 (4)' },
  { value: '11', label: 'QRCode (11)' },
  { value: '12', label: 'PDF417 (12)' },
  { value: '13', label: 'Datamatrix (13)' },
]

const SLOT: Record<CodeType, { w: number; h: number }> = {
  '2': { w: 480, h: 160 },
  '4': { w: 480, h: 160 },
  '11': { w: 320, h: 320 },
  '12': { w: 480, h: 200 },
  '13': { w: 320, h: 320 },
}

export default function App() {
  const [state, setState] = useState<SessionState>(createInitialState)

  function apply(event: Parameters<typeof sessionReducer>[1]) {
    const next = sessionReducer(state, event, encode)
    if (next instanceof Promise) {
      void next.then(setState)
    } else {
      setState(next)
    }
  }

  return (
    <main className="min-h-svh bg-zinc-50 px-6 py-8 text-zinc-900">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Code Label Tool</h1>
      {state.rows.map((row) => {
        const slot = SLOT[row.type]
        const lines = Math.max(3, row.data.split('\n').length)
        return (
          <article
            key={row.id}
            className="mb-4 flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <select
                aria-label="type"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5"
                value={row.type}
                onChange={(e) =>
                  apply({ type: 'CHANGE_TYPE', id: row.id, codeType: e.target.value as CodeType })
                }
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <textarea
                aria-label="data"
                rows={lines}
                className="min-h-[4.5rem] w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5"
                value={row.data}
                onChange={(e) =>
                  apply({ type: 'CHANGE_DATA', id: row.id, data: e.target.value })
                }
              />
              <button
                type="button"
                className="w-8 rounded-md border border-zinc-300 text-lg disabled:opacity-40"
                disabled={state.rows.length === 1}
                onClick={() => apply({ type: 'DELETE_ROW', id: row.id })}
              >
                ×
              </button>
            </div>
            <div
              className="flex shrink-0 items-center justify-center border border-zinc-200 bg-white"
              style={{ width: slot.w, height: slot.h }}
            >
              {row.error ? (
                <span>Invalid Code</span>
              ) : row.image ? (
                <img
                  src={row.image}
                  alt=""
                  className="max-h-full max-w-full"
                />
              ) : null}
            </div>
          </article>
        )
      })}
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-md bg-zinc-900 px-3 py-2 text-white"
          onClick={() => apply({ type: 'GENERATE_ALL' })}
        >
          Generate all
        </button>
        <button
          type="button"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2"
          onClick={() => apply({ type: 'DELETE_ALL' })}
        >
          Delete all
        </button>
      </div>
    </main>
  )
}
