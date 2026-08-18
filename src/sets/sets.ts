import type { CodeType, SessionState } from '../session/session'

export interface SetRow {
  type: CodeType
  data: string
}

export interface LabelSet {
  id: string
  name: string
  rows: SetRow[]
}

export interface SetStore {
  load: () => LabelSet[]
  save: (sets: LabelSet[]) => void
}

function snapshot(session: SessionState): SetRow[] {
  return session.rows.map((r) => ({ type: r.type, data: r.data }))
}

export function saveSet(
  store: SetStore,
  input: { name: string; session: SessionState; id?: string },
): LabelSet[] {
  const sets = store.load()
  const existing = sets.find((s) => s.id === input.id || s.name === input.name)
  const next: LabelSet = {
    id: existing?.id ?? input.id ?? crypto.randomUUID(),
    name: input.name,
    rows: snapshot(input.session),
  }
  const updated = existing
    ? sets.map((s) => (s.id === existing.id ? next : s))
    : [...sets, next]
  store.save(updated)
  return updated
}

export function loadSet(store: SetStore, id: string): SessionState {
  const found = store.load().find((s) => s.id === id)
  if (!found) {
    return { rows: [] }
  }
  return {
    rows: found.rows.map((r) => ({
      id: crypto.randomUUID(),
      type: r.type,
      data: r.data,
      image: null,
      error: null,
      stale: false,
    })),
  }
}

export function deleteSet(store: SetStore, id: string): LabelSet[] {
  const updated = store.load().filter((s) => s.id !== id)
  store.save(updated)
  return updated
}

