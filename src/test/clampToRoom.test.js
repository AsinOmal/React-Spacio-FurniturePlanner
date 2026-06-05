/**
 * Unit tests for clampToRoom (boundary clamping logic from Editor2D.jsx)
 * These test the pure function directly — no React context needed.
 *
 * Coordinate system: x,y are the CENTER of the furniture piece on the canvas.
 * PAD = 40px (wall area). SCALE = 80px per metre.
 */
import { describe, it, expect } from 'vitest'
import { SCALE, PAD, clampToRoom } from '../utils/geometry'

// ── Test fixtures ──────────────────────────────────────────────────────────────
const room4x3 = { width: 4, length: 3, shape: 'Rectangle' }
const room6x5L = { width: 6, length: 5, shape: 'L-Shape' }

const chair = { width: 0.6, height: 0.6, scale: 1, rotation: 0 }  // 48×48px
const sofa  = { width: 2.0, height: 0.9, scale: 1, rotation: 0 }  // 160×72px
const bed   = { width: 2.0, height: 1.6, scale: 1, rotation: 0 }  // 160×128px

// Floor boundaries for 4×3m room:
// left=40, right=40+320=360, top=40, bottom=40+240=280

// ══════════════════════════════════════════════════════════════════════════════
// 1. Items already inside floor — should not move
// ══════════════════════════════════════════════════════════════════════════════
describe('clampToRoom — item already within floor', () => {
  it('TC-CR-01: centre of floor returns unchanged position', () => {
    const cx = PAD + (4 * SCALE) / 2  // 200
    const cy = PAD + (3 * SCALE) / 2  // 160
    const result = clampToRoom(cx, cy, chair, room4x3)
    expect(result.x).toBe(cx)
    expect(result.y).toBe(cy)
  })

  it('TC-CR-02: position near edge but inside floor is unchanged', () => {
    // Chair half-width = 24px; edge of floor = 360px; valid centre = 360-24 = 336
    const result = clampToRoom(336, 160, chair, room4x3)
    expect(result.x).toBe(336)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 2. Items pushed outside the floor — should be clamped to the boundary
// ══════════════════════════════════════════════════════════════════════════════
describe('clampToRoom — item outside floor boundary', () => {
  it('TC-CR-03: item placed past left wall is clamped to left floor edge', () => {
    // Chair's half-width = 24px; min allowed cx = PAD + 24 = 64
    const result = clampToRoom(0, 160, chair, room4x3)
    expect(result.x).toBeGreaterThanOrEqual(PAD + 24)
  })

  it('TC-CR-04: item placed past right wall is clamped to right floor edge', () => {
    // floorRight=360, chair hw=24; max cx = 360-24 = 336
    const result = clampToRoom(999, 160, chair, room4x3)
    expect(result.x).toBeLessThanOrEqual(360 - 24)
  })

  it('TC-CR-05: item placed above top wall is clamped to top floor edge', () => {
    const result = clampToRoom(200, -999, chair, room4x3)
    expect(result.y).toBeGreaterThanOrEqual(PAD + 24)
  })

  it('TC-CR-06: item placed below bottom wall is clamped to bottom floor edge', () => {
    // floorBottom=280, chair hh=24; max cy = 280-24 = 256
    const result = clampToRoom(200, 999, chair, room4x3)
    expect(result.y).toBeLessThanOrEqual(280 - 24)
  })

  it('TC-CR-07: large sofa clamped at right edge uses its own half-width', () => {
    // Sofa width=160px, hw=80; max cx = 360-80 = 280
    const result = clampToRoom(999, 160, sofa, room4x3)
    expect(result.x).toBeLessThanOrEqual(360 - 80)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 3. Rotation — rotated bounding box should be used for clamping
// ══════════════════════════════════════════════════════════════════════════════
describe('clampToRoom — rotation-aware clamping', () => {
  it('TC-CR-08: 90° rotated sofa uses swapped half-width/height for clamping', () => {
    const rotatedSofa = { ...sofa, rotation: 90 }
    // At 90°: hw = half(0.9*80)=36, hh = half(2.0*80)=80
    // Max cx at right = 360 - 36 = 324
    const result = clampToRoom(999, 160, rotatedSofa, room4x3)
    expect(result.x).toBeLessThanOrEqual(360 - 36)
  })

  it('TC-CR-09: 45° rotated bed has larger half-extents than axis-aligned', () => {
    const bedAxisAligned  = { ...bed, rotation: 0 }
    const bed45           = { ...bed, rotation: 45 }
    // At 45°: hw = hh = (iw+ih)/2*sin45 > iw/2; so max x is smaller
    const axisResult = clampToRoom(999, 160, bedAxisAligned, room4x3)
    const rot45Result = clampToRoom(999, 160, bed45, room4x3)
    expect(rot45Result.x).toBeLessThan(axisResult.x)
  })

  it('TC-CR-10: 0° and 360° rotation give identical clamp result', () => {
    const r0   = clampToRoom(999, 999, { ...chair, rotation: 0   }, room4x3)
    const r360 = clampToRoom(999, 999, { ...chair, rotation: 360 }, room4x3)
    expect(r360.x).toBeCloseTo(r0.x, 5)
    expect(r360.y).toBeCloseTo(r0.y, 5)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 4. Scale — larger scale means item needs more space
// ══════════════════════════════════════════════════════════════════════════════
describe('clampToRoom — scale-aware clamping', () => {
  it('TC-CR-11: scaled-up chair has a smaller maximum allowed x than scale=1', () => {
    const bigChair = { ...chair, scale: 2.0 }   // now 96×96px, hw=48
    const normalResult = clampToRoom(999, 160, chair, room4x3)
    const bigResult    = clampToRoom(999, 160, bigChair, room4x3)
    expect(bigResult.x).toBeLessThan(normalResult.x)
  })

  it('TC-CR-12: scale=0.5 chair allows placing closer to the wall', () => {
    const tinyChair = { ...chair, scale: 0.5 }  // now 24×24px, hw=12
    const result = clampToRoom(999, 160, tinyChair, room4x3)
    // Max x = 360-12 = 348
    expect(result.x).toBeLessThanOrEqual(360 - 12)
    expect(result.x).toBeGreaterThan(360 - 24) // tighter than full-size
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 5. L-Shape room
// ══════════════════════════════════════════════════════════════════════════════
describe('clampToRoom — L-Shape room', () => {
  it('TC-CR-13: item in main bar zone stays within main bar bounds', () => {
    // room6x5: fullW=480, fullH=400, mainH=240, wingH=160, wingW=240
    // main bar: x:40-520, y:40-280
    const result = clampToRoom(0, 100, chair, room6x5L)
    expect(result.x).toBeGreaterThanOrEqual(PAD + 24)
  })

  it('TC-CR-14: item centred in wing zone is clamped to wing width', () => {
    // Wing: x:40-280 (wingW=240), y:280-440
    // Any item centred in wing at cx=999 → clamped to x <= 280-24 = 256
    // cy=350 puts us in wing zone (>280)
    const result = clampToRoom(999, 350, chair, room6x5L)
    const wingRight = PAD + Math.round(6 * SCALE * 0.5)  // PAD + wingW = 40+240=280
    expect(result.x).toBeLessThanOrEqual(wingRight - 24)
  })
})
