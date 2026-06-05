/**
 * Unit tests for the smart-snapping utility (src/utils/snapping.js).
 * Coordinate system: x,y are the CENTER of a furniture piece in canvas px.
 * SCALE = 80px/m, PAD = 40px.
 */
import { describe, it, expect } from 'vitest'
import { computeSnap, SNAP_THRESHOLD } from '../utils/snapping'

const chair = { id: 'c', width: 0.6, height: 0.6, scale: 1, rotation: 0 } // 48px, hw=24
const roomRect = { width: 4, length: 3, shape: 'Rectangle' } // centre (200,160)
const roomBig = { width: 6, length: 5, shape: 'Rectangle' }  // centre (280,240)

describe('computeSnap — aligns to other items', () => {
  it('TC-SN-01: snaps centre-to-centre when within threshold', () => {
    const other = { id: 'o', width: 0.6, height: 0.6, scale: 1, rotation: 0, x: 200, y: 160 }
    const res = computeSnap(chair, 203, 160, [other], roomRect)
    expect(res.x).toBeCloseTo(200, 5)
    expect(res.guides.length).toBeGreaterThanOrEqual(1)
  })

  it('TC-SN-02: does NOT snap when every target is beyond threshold', () => {
    const other = { id: 'o', width: 0.6, height: 0.6, scale: 1, rotation: 0, x: 400, y: 400 }
    // (150,150) is far from the other item AND from roomBig centre (280,240)
    const res = computeSnap(chair, 150, 150, [other], roomBig)
    expect(res.x).toBe(150)
    expect(res.y).toBe(150)
    expect(res.guides.length).toBe(0)
  })

  it('TC-SN-03: snaps an edge to a neighbour edge', () => {
    // Other right edge at x=224; dragged left edge (cx-24) should land on it.
    const other = { id: 'o', width: 0.6, height: 0.6, scale: 1, rotation: 0, x: 200, y: 160 }
    const res = computeSnap(chair, 246, 160, [other], roomRect) // left edge = 222, target 224
    expect(res.x).toBeCloseTo(248, 5) // 224 + hw(24)
  })
})

describe('computeSnap — aligns to room centre lines', () => {
  it('TC-SN-04: snaps to the room centre when close, with no other items', () => {
    const res = computeSnap(chair, 283, 240, [], roomBig) // centre (280,240)
    expect(res.x).toBeCloseTo(280, 5)
    expect(res.y).toBeCloseTo(240, 5)
    expect(res.guides.length).toBe(2)
  })
})

describe('computeSnap — threshold boundary', () => {
  it('TC-SN-05: exactly at the threshold still snaps', () => {
    const other = { id: 'o', width: 0.6, height: 0.6, scale: 1, rotation: 0, x: 999, y: 999 }
    const res = computeSnap(chair, 280 + SNAP_THRESHOLD, 999, [other], roomBig)
    expect(res.x).toBeCloseTo(280, 5)
  })
})
