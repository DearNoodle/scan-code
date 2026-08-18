import type { LabelSet, SetStore } from './sets'
import type { SessionState } from '../session/session'

const SETS_KEY = 'scan-code.sets'
const DRAFT_KEY = 'scan-code.draft'

export const localSetStore: SetStore = {
  load() {
    try {
      const raw = localStorage.getItem(SETS_KEY)
      return raw ? (JSON.parse(raw) as LabelSet[]) : []
    } catch {
      return []
    }
  },
  save(sets) {
    localStorage.setItem(SETS_KEY, JSON.stringify(sets))
  },
}

export function loadDraft(): SessionState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as SessionState) : null
  } catch {
    return null
  }
}

export function saveDraft(state: SessionState) {
  const slim: SessionState = {
    rows: state.rows.map((r) => ({
      ...r,
      image: null,
      error: null,
      stale: false,
    })),
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(slim))
}
