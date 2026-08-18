export type CodeType = '2' | '4' | '11' | '12' | '13'

export interface Row {
  id: string
  type: CodeType
  data: string
  image: string | null
  error: string | null
}

export interface SessionState {
  rows: Row[]
}

export type SessionEvent =
  | { type: 'ADD_ROW' }
  | { type: 'DELETE_ROW'; id: string }
  | { type: 'DELETE_ALL' }
  | { type: 'CHANGE_TYPE'; id: string; codeType: CodeType }
  | { type: 'CHANGE_DATA'; id: string; data: string }
  | { type: 'GENERATE_ALL' }

export type Encoder = (data: string, codeType: CodeType) => Promise<string>

export function createInitialState(): SessionState {
  return {
    rows: [{
      id: crypto.randomUUID(),
      type: '11',
      data: '',
      image: null,
      error: null,
    }]
  }
}

export function sessionReducer(
  state: SessionState,
  event: SessionEvent,
  encoder?: Encoder
): SessionState | Promise<SessionState> {
  switch (event.type) {
    case 'ADD_ROW': {
      const last = state.rows[state.rows.length - 1]
      return {
        rows: [...state.rows, {
          id: crypto.randomUUID(),
          type: last.type,
          data: '',
          image: null,
          error: null,
        }]
      }
    }
    case 'DELETE_ROW': {
      if (state.rows.length === 1) return state
      return {
        rows: state.rows.filter(r => r.id !== event.id)
      }
    }
    case 'DELETE_ALL': {
      return createInitialState()
    }
    case 'CHANGE_TYPE': {
      return {
        rows: state.rows.map(r =>
          r.id === event.id
            ? { ...r, type: event.codeType, image: null, error: null }
            : r
        )
      }
    }
    case 'CHANGE_DATA': {
      return {
        rows: state.rows.map(r =>
          r.id === event.id
            ? { ...r, data: event.data, error: null }
            : r
        )
      }
    }
    case 'GENERATE_ALL': {
      if (!encoder) return state
      return (async () => {
        const newRows = await Promise.all(state.rows.map(async (row) => {
          if (row.data === '') {
            return { ...row, image: null, error: 'Invalid Code' }
          }
          try {
            const image = await encoder(row.data, row.type)
            return { ...row, image, error: null }
          } catch {
            return { ...row, image: null, error: 'Invalid Code' }
          }
        }))
        return { rows: newRows }
      })()
    }
    default:
      return state
  }
}
