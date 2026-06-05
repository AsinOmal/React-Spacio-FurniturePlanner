// ── Colour shading utility ───────────────────────────────────
// Lightens (positive amount) or darkens (negative amount) a hex colour,
// clamping each channel to 0–255. Accepts #rgb or #rrggbb.
export function shadeColor(hex, amount) {
  let col = hex.replace('#', '')
  if (col.length === 3) col = col.split('').map(c => c + c).join('')
  const num = parseInt(col, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
