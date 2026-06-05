/**
 * Unit tests for the auto-arrange utility (src/utils/autoArrange.js).
 * Guarantees: every arranged item stays inside the room floor (for every
 * supported shape) and the layout is deterministic.
 */
import { describe, it, expect } from 'vitest'
import { autoArrange } from '../utils/autoArrange'
import { clampToRoom } from '../utils/geometry'

const make = (type, width, height) => ({
  id: `${type}-${Math.random()}`,
  type, width, height, scale: 1, rotation: 0,
  x: 0, y: 0, color: '#888',
})

const sampleFurniture = () => [
  make('Bed', 2.0, 1.6),
  make('Wardrobe', 1.8, 0.6),
  make('Sofa', 2.0, 0.9),
  make('Dining Table', 1.6, 0.9),
  make('Chair', 0.6, 0.6),
  make('Side Table', 0.5, 0.5),
]

const rooms = [
  { name: 'Rectangle', room: { width: 6, length: 5, shape: 'Rectangle' } },
  { name: 'Square', room: { width: 5, length: 5, shape: 'Square' } },
  { name: 'L-Shape', room: { width: 6, length: 5, shape: 'L-Shape' } },
]

describe('autoArrange — keeps every item inside the room', () => {
  for (const { name, room } of rooms) {
    it(`TC-AA-${name}: all items remain within ${name} floor bounds`, () => {
      const arranged = autoArrange(sampleFurniture(), room)
      for (const item of arranged) {
        // Re-clamping a correctly-placed item must be a no-op.
        const reclamped = clampToRoom(item.x, item.y, item, room)
        expect(reclamped.x).toBeCloseTo(item.x, 3)
        expect(reclamped.y).toBeCloseTo(item.y, 3)
      }
    })
  }
})

describe('autoArrange — behaviour', () => {
  it('TC-AA-EMPTY: empty input returns empty output', () => {
    expect(autoArrange([], rooms[0].room)).toEqual([])
  })

  it('TC-AA-DET: deterministic — same input gives the same layout', () => {
    const input = sampleFurniture()
    const a = autoArrange(input, rooms[0].room)
    const b = autoArrange(input, rooms[0].room)
    expect(a.map(i => [i.x, i.y, i.rotation])).toEqual(b.map(i => [i.x, i.y, i.rotation]))
  })

  it('TC-AA-CENTER: a dining table is placed near the room centre', () => {
    const room = rooms[0].room // 6x5 → centre (280,240)
    const arranged = autoArrange([make('Dining Table', 1.6, 0.9)], room)
    const table = arranged.find(i => i.type === 'Dining Table')
    expect(table.x).toBeCloseTo(280, 0)
    expect(table.y).toBeCloseTo(240, 0)
  })

  it('TC-AA-PRESERVE: does not add or drop items', () => {
    const input = sampleFurniture()
    const arranged = autoArrange(input, rooms[0].room)
    expect(arranged).toHaveLength(input.length)
    expect(new Set(arranged.map(i => i.id))).toEqual(new Set(input.map(i => i.id)))
  })
})
