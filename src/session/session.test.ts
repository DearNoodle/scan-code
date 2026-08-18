import { describe, it, expect, vi } from 'vitest'
import { createInitialState, sessionReducer, type SessionState, type Encoder } from './session'

describe('session', () => {
  it('first state is one empty QR row', () => {
    const state = createInitialState()
    expect(state.rows).toHaveLength(1)
    expect(state.rows[0].type).toBe('11')
    expect(state.rows[0].data).toBe('')
    expect(state.rows[0].image).toBeNull()
    expect(state.rows[0].error).toBeNull()
    expect(state.rows[0].stale).toBe(false)
  })

  it('add copies last row type, empty data/image/error', () => {
    const state0 = createInitialState()
    const state1 = sessionReducer(state0, { type: 'CHANGE_TYPE', id: state0.rows[0].id, codeType: '4' }) as SessionState
    const state2 = sessionReducer(state1, { type: 'ADD_ROW' }) as SessionState
    expect(state2.rows).toHaveLength(2)
    expect(state2.rows[1].type).toBe('4')
    expect(state2.rows[1].data).toBe('')
    expect(state2.rows[1].image).toBeNull()
    expect(state2.rows[1].error).toBeNull()
  })

  it('cannot delete the last row', () => {
    const state = createInitialState()
    const result = sessionReducer(state, { type: 'DELETE_ROW', id: state.rows[0].id }) as SessionState
    expect(result.rows).toHaveLength(1)
  })

  it('deleting a non-last row removes only that row', () => {
    const state0 = createInitialState()
    const keepId = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'ADD_ROW' }) as SessionState
    const dropId = state1.rows[1].id
    const state2 = sessionReducer(state1, { type: 'ADD_ROW' }) as SessionState
    const lastId = state2.rows[2].id
    const state3 = sessionReducer(state2, { type: 'DELETE_ROW', id: dropId }) as SessionState
    expect(state3.rows.map(r => r.id)).toEqual([keepId, lastId])
  })

  it('delete all resets to one empty QR row (new identity)', () => {
    const state0 = createInitialState()
    const id0 = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'DELETE_ALL' }) as SessionState
    expect(state1.rows).toHaveLength(1)
    expect(state1.rows[0].type).toBe('11')
    expect(state1.rows[0].id).not.toBe(id0)
  })

  it('type change clears image and error, keeps data', () => {
    const state0 = createInitialState()
    const id = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'CHANGE_DATA', id, data: 'ABC' }) as SessionState
    const state2 = sessionReducer(state1, { type: 'CHANGE_TYPE', id, codeType: '2' }) as SessionState
    expect(state2.rows[0].type).toBe('2')
    expect(state2.rows[0].data).toBe('ABC')
    expect(state2.rows[0].image).toBeNull()
    expect(state2.rows[0].error).toBeNull()
  })

  it('data change keeps image, clears error, does not trim', () => {
    const state0: SessionState = {
      rows: [{
        id: 'r1',
        type: '11',
        data: 'OLD',
        image: 'IMG:OLD',
        error: 'Invalid Code',
        stale: false,
      }],
    }
    const state1 = sessionReducer(state0, { type: 'CHANGE_DATA', id: 'r1', data: '  ABC  ' }) as SessionState
    expect(state1.rows[0].data).toBe('  ABC  ')
    expect(state1.rows[0].image).toBe('IMG:OLD')
    expect(state1.rows[0].error).toBeNull()
    expect(state1.rows[0].stale).toBe(true)
  })

  it('generate: empty string → Invalid Code, encoder not called', async () => {
    const encoder = vi.fn()
    const state0 = createInitialState()
    const state1 = await sessionReducer(state0, { type: 'GENERATE_ALL' }, encoder as Encoder) as SessionState
    expect(state1.rows[0].error).toBe('Invalid Code')
    expect(state1.rows[0].image).toBeNull()
    expect(encoder).not.toHaveBeenCalled()
  })

  it('generate: encoder throw → Invalid Code, image cleared', async () => {
    const encoder: Encoder = async () => { throw new Error('fail') }
    const state0 = createInitialState()
    const id = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'CHANGE_DATA', id, data: 'BAD' }) as SessionState
    const state2 = await sessionReducer(state1, { type: 'GENERATE_ALL' }, encoder) as SessionState
    expect(state2.rows[0].error).toBe('Invalid Code')
    expect(state2.rows[0].image).toBeNull()
  })

  it('generate: success writes image, mixed rows independent', async () => {
    const encoder: Encoder = async (data) => data === 'GOOD' ? 'IMG:GOOD' : Promise.reject(new Error('bad'))
    const state0 = createInitialState()
    const id0 = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'CHANGE_DATA', id: id0, data: 'GOOD' }) as SessionState
    const state2 = sessionReducer(state1, { type: 'ADD_ROW' }) as SessionState
    const id1 = state2.rows[1].id
    const state3 = sessionReducer(state2, { type: 'CHANGE_DATA', id: id1, data: 'BAD' }) as SessionState
    const state4 = await sessionReducer(state3, { type: 'GENERATE_ALL' }, encoder) as SessionState
    expect(state4.rows[0].image).toBe('IMG:GOOD')
    expect(state4.rows[0].error).toBeNull()
    expect(state4.rows[1].image).toBeNull()
    expect(state4.rows[1].error).toBe('Invalid Code')
  })

  it('generate: spaces-only is sent to the encoder', async () => {
    const encoder = vi.fn(async () => 'IMG')
    const state0 = createInitialState()
    const id = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'CHANGE_DATA', id, data: '   ' }) as SessionState
    await sessionReducer(state1, { type: 'GENERATE_ALL' }, encoder as Encoder)
    expect(encoder).toHaveBeenCalledWith('   ', '11')
  })

  it('generate one encodes only that row',
    async () => {
    const encoder = vi.fn(async (data) => `IMG:${data}`)
    const state0 = createInitialState()
    const id0 = state0.rows[0].id
    const state1 = sessionReducer(state0, { type: 'CHANGE_DATA', id: id0, data: 'A' }) as SessionState
    const state2 = sessionReducer(state1, { type: 'ADD_ROW' }) as SessionState
    const id1 = state2.rows[1].id
    const state3 = sessionReducer(state2, { type: 'CHANGE_DATA', id: id1, data: 'B' }) as SessionState
    const state4 = await sessionReducer(state3, { type: 'GENERATE_ONE', id: id0 }, encoder as Encoder) as SessionState
    expect(state4.rows[0].image).toBe('IMG:A')
    expect(state4.rows[1].image).toBeNull()
    expect(encoder).toHaveBeenCalledTimes(1)
  })
})
