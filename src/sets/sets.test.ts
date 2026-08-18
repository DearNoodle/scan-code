import { describe, it, expect } from 'vitest'
import { saveSet, loadSet, deleteSet, type LabelSet, type SetStore } from './sets'
import type { SessionState } from '../session/session'

function memoryStore(initial: LabelSet[] = []): SetStore & { data: LabelSet[] } {
  const store = {
    data: [...initial],
    load: () => store.data,
    save: (sets: LabelSet[]) => {
      store.data = sets
    },
  }
  return store
}

function session(rows: { type: '11' | '4'; data: string; image?: string | null }[]): SessionState {
  return {
    rows: rows.map((r, i) => ({
      id: `r${i}`,
      type: r.type,
      data: r.data,
      image: r.image ?? 'IMG',
      error: null,
      stale: false,
    })),
  }
}

describe('sets', () => {
  it('save stores type and data only, not images', () => {
    const store = memoryStore()
    const sets = saveSet(store, {
      name: 'login suite',
      session: session([
        { type: '11', data: 'https://a', image: 'BIG' },
        { type: '4', data: 'SKU-1', image: 'BIG2' },
      ]),
    })
    expect(sets).toHaveLength(1)
    expect(sets[0].name).toBe('login suite')
    expect(sets[0].rows).toEqual([
      { type: '11', data: 'https://a' },
      { type: '4', data: 'SKU-1' },
    ])
    expect(store.data).toEqual(sets)
    expect(sets[0].id).toBeTruthy()
  })

  it('save with same name overwrites that set', () => {
    const store = memoryStore()
    saveSet(store, { name: 'login suite', session: session([{ type: '11', data: 'old' }]) })
    const sets = saveSet(store, { name: 'login suite', session: session([{ type: '4', data: 'new' }]) })
    expect(sets).toHaveLength(1)
    expect(sets[0].rows).toEqual([{ type: '4', data: 'new' }])
  })

  it('load rebuilds a session with fresh ids and no images', () => {
    const store = memoryStore()
    const [saved] = saveSet(store, {
      name: 'login suite',
      session: session([
        { type: '11', data: 'https://a' },
        { type: '4', data: 'SKU-1' },
      ]),
    })
    const next = loadSet(store, saved.id)
    expect(next.rows).toHaveLength(2)
    expect(next.rows.map((r) => ({ type: r.type, data: r.data, image: r.image, error: r.error, stale: r.stale }))).toEqual([
      { type: '11', data: 'https://a', image: null, error: null, stale: false },
      { type: '4', data: 'SKU-1', image: null, error: null, stale: false },
    ])
    expect(next.rows[0].id).not.toBe('r0')
    expect(next.rows[1].id).not.toBe(next.rows[0].id)
  })

  it('delete removes a named set', () => {
    const store = memoryStore()
    const [a] = saveSet(store, { name: 'a', session: session([{ type: '11', data: '1' }]) })
    saveSet(store, { name: 'b', session: session([{ type: '11', data: '2' }]) })
    const sets = deleteSet(store, a.id)
    expect(sets.map((s) => s.name)).toEqual(['b'])
  })
})
