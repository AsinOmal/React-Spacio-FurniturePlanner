// ── Canvas geometry constants & helpers ──────────────────────
// Coordinate system: a furniture item's x,y is its CENTER on the canvas.
// SCALE = pixels per metre. PAD = wall/padding area around the floor.
// GRID_PX = grid snap resolution (0.25m).

export const SCALE = 80
export const PAD = 40
export const GRID_PX = SCALE / 4   // 20px = 0.25m snap resolution

// ── L-Shape helper ───────────────────────────────────────────
// Returns the two rectangles (main bar + wing) that make up an L-Shape floor.
export function getLShapeRects(room) {
  const fullW = room.width * SCALE
  const fullH = room.length * SCALE
  const mainH = Math.round(fullH * 0.6)
  const wingH = fullH - mainH
  const wingW = Math.round(fullW * 0.5)
  return [
    { x: PAD, y: PAD, w: fullW, h: mainH },
    { x: PAD, y: PAD + mainH, w: wingW, h: wingH },
  ]
}

// ── Boundary clamp — x,y are the CENTER of the item ─────────
// Keeps a (possibly rotated/scaled) item fully inside the room floor.
export function clampToRoom(cx, cy, item, room) {
  const iw = item.width * SCALE * item.scale
  const ih = item.height * SCALE * item.scale
  const rad = (item.rotation || 0) * Math.PI / 180

  // Half-extents of the rotated bounding box
  const hw = (Math.abs(Math.cos(rad)) * iw + Math.abs(Math.sin(rad)) * ih) / 2
  const hh = (Math.abs(Math.sin(rad)) * iw + Math.abs(Math.cos(rad)) * ih) / 2

  if (room.shape === 'L-Shape') {
    const [main, wing] = getLShapeRects(room)
    // Check if the item's center is in the wing zone
    const inWing = cy + hh > main.y + main.h
    const r = inWing ? wing : main
    return {
      x: Math.max(r.x + hw, Math.min(cx, r.x + r.w - hw)),
      y: Math.max(r.y + hh, Math.min(cy, r.y + r.h - hh)),
    }
  }

  const floorLeft = PAD
  const floorTop = PAD
  const floorRight = PAD + room.width * SCALE
  const floorBottom = PAD + room.length * SCALE

  return {
    x: Math.max(floorLeft + hw, Math.min(cx, floorRight - hw)),
    y: Math.max(floorTop + hh, Math.min(cy, floorBottom - hh)),
  }
}

// ── Grid snap helper ─────────────────────────────────────────
export function snapGrid(val) {
  return Math.round(val / GRID_PX) * GRID_PX
}
