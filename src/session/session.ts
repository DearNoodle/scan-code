export type CodeType = '2' | '4' | '11' | '12' | '13'

export interface Row {
  id: string
  type: CodeType
  data: string
  image: string | null
  error: string | null
  stale: boolean
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
  | { type: 'GENERATE_ONE'; id: string }

export type Encoder = (data: string, codeType: CodeType) => Promise<string>

export function createInitialState(): SessionState {
  return {
    rows: [{
      id: crypto.randomUUID(),
      type: '11',
      data: '',
      image: null,
      error: null,
      stale: false,
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
          stale: false,
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
            ? { ...r, type: event.codeType, image: null, error: null, stale: false }
            : r
        )
      }
    }
    case 'CHANGE_DATA': {
      return {
        rows: state.rows.map(r =>
          r.id === event.id
            ? { ...r, data: event.data, error: null, stale: r.image !== null }
            : r
        )
      }
    }
    case 'GENERATE_ALL': {
      if (!encoder) return state
      return encodeRows(state.rows, encoder)
    }
    case 'GENERATE_ONE': {
      if (!encoder) return state
      return encodeRows(state.rows, encoder, event.id)
    }
    default:
      return state
  }
}

async function encodeOne(row: Row, encoder: Encoder): Promise<Row> {
  if (row.data === '') {
    return { ...row, image: null, error: 'Invalid Code', stale: false }
  }
  try {
    const image = await encoder(row.data, row.type)
    return { ...row, image, error: null, stale: false }
  } catch {
    return { ...row, image: null, error: 'Invalid Code', stale: false }
  }
}

async function encodeRows(
  rows: Row[],
  encoder: Encoder,
  onlyId?: string,
): Promise<SessionState> {
  const newRows = await Promise.all(
    rows.map((row) => {
      if (onlyId && row.id !== onlyId) return row
      return encodeOne(row, encoder)
    }),
  )
  return { rows: newRows }
}
