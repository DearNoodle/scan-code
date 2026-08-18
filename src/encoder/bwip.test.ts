import { describe, it, expect } from 'vitest'
import { encode } from './bwip'

describe('bwip encoder', () => {
  it('returns a data URL for a known-good QR payload', async () => {
    const image = await encode('ABC123', '11')
    expect(image.startsWith('data:image/png;base64,')).toBe(true)
    expect(image.length).toBeGreaterThan(40)
  })

  it('throws for a known-bad QR payload', async () => {
    await expect(encode('', '11')).rejects.toBeTruthy()
  })

  it.each([
    ['2', 'ABC123'] as const,
    ['4', 'Hello'] as const,
    ['12', 'PDF payload'] as const,
    ['13', 'DM payload'] as const,
  ])('returns a data URL for type %s', async (type, data) => {
    const image = await encode(data, type)
    expect(image.startsWith('data:image/png;base64,')).toBe(true)
    expect(image.length).toBeGreaterThan(40)
  })

  it('throws for a known-bad Code39 payload', async () => {
    await expect(encode('lowercase', '2')).rejects.toBeTruthy()
  })
})
