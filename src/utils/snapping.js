// ── Smart snapping for furniture dragging ────────────────────
// All coordinates are in canvas pixels. A furniture item's x,y is its CENTER.
// computeSnap nudges the dragged item's center so its center / edges align
// with other items' centers / edges and with the room's center lines.
// It returns the snapped center plus a list of alignment guides to draw.

import { SCALE, PAD } from './geometry'

export const SNAP_THRESHOLD = 8   // canvas px within which a snap engages

// Axis-aligned half extents (snapping ignores rotation — uses the drawn box).
function halfExtents(item) {
  return {
    hw: (item.width * SCALE * item.scale) / 2,
    hh: (item.height * SCALE * item.scale) / 2,
  }
}

// Build candidate snap lines for one axis from the other furniture items.
// Each candidate is { pos, span:[a,b] } where span is the perpendicular
// extent used to draw a tidy guide between the two aligned items.
function itemTargets(others, axis) {
  const targets = []
  for (const o of others) {
    const { hw, hh } = halfExtents(o)
    if (axis === 'x') {
      const span = [o.y - hh, o.y + hh]
      targets.push({ pos: o.x, span })          // center
      targets.push({ pos: o.x - hw, span })      // left edge
      targets.push({ pos: o.x + hw, span })      // right edge
    } else {
      const span = [o.x - hw, o.x + hw]
      targets.push({ pos: o.y, span })          // center
      targets.push({ pos: o.y - hh, span })      // top edge
      targets.push({ pos: o.y + hh, span })      // bottom edge
    }
  }
  return targets
}

// Room center lines (and inner walls) as snap targets spanning the floor.
function roomTargets(room, axis) {
  const floorLeft = PAD
  const floorTop = PAD
  const floorRight = PAD + room.width * SCALE
  const floorBottom = PAD + room.length * SCALE
  if (axis === 'x') {
    const span = [floorTop, floorBottom]
    return [{ pos: (floorLeft + floorRight) / 2, span }]
  }
  const span = [floorLeft, floorRight]
  return [{ pos: (floorTop + floorBottom) / 2, span }]
}

// Resolve the best snap on one axis. `candidates` are the dragged item's
// own reference positions for that axis: its center and its two edges, each
// paired with the delta needed to move the CENTER onto that reference.
function bestSnap(refs, targets, threshold) {
  let best = null
  for (const ref of refs) {
    for (const t of targets) {
      const dist = Math.abs(ref.pos - t.pos)
      if (dist <= threshold && (!best || dist < best.dist)) {
        best = { dist, delta: t.pos - ref.pos, line: t.pos, span: t.span }
      }
    }
  }
  return best
}

export function computeSnap(draggedItem, centerX, centerY, others, room, threshold = SNAP_THRESHOLD) {
  const { hw, hh } = halfExtents(draggedItem)

  const targetsX = [...itemTargets(others, 'x'), ...roomTargets(room, 'x')]
  const targetsY = [...itemTargets(others, 'y'), ...roomTargets(room, 'y')]

  // The dragged item can align via its center or either edge.
  const refsX = [
    { pos: centerX },
    { pos: centerX - hw },
    { pos: centerX + hw },
  ]
  const refsY = [
    { pos: centerY },
    { pos: centerY - hh },
    { pos: centerY + hh },
  ]

  const snapX = bestSnap(refsX, targetsX, threshold)
  const snapY = bestSnap(refsY, targetsY, threshold)

  const x = snapX ? centerX + snapX.delta : centerX
  const y = snapY ? centerY + snapY.delta : centerY

  const guides = []
  if (snapX) {
    // vertical guide line at x = snapX.line, spanning both items
    const ys = [snapX.span[0], snapX.span[1], y - hh, y + hh]
    guides.push({ axis: 'x', pos: snapX.line, from: Math.min(...ys), to: Math.max(...ys) })
  }
  if (snapY) {
    const xs = [snapY.span[0], snapY.span[1], x - hw, x + hw]
    guides.push({ axis: 'y', pos: snapY.line, from: Math.min(...xs), to: Math.max(...xs) })
  }

  return { x, y, guides }
}
