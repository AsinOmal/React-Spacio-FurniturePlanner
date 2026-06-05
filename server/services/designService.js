const Design = require('../models/Design')
const { ApiError } = require('../middleware/errorHandler')

// ── Design business logic — all queries are scoped to the owning user ─────

async function listDesigns(userId, { limit, page } = {}) {
  const query = Design.find({ userId }).sort({ updatedAt: -1 })
  if (limit) {
    query.limit(limit).skip(limit * ((page || 1) - 1))
  }
  return query
}

async function getDesign(userId, id) {
  const design = await Design.findOne({ _id: id, userId })
  if (!design) throw new ApiError(404, 'Design not found')
  return design
}

async function createDesign(userId, { name, room, furniture, thumbnail }) {
  return new Design({
    userId,
    name: name || 'Untitled Design',
    room,
    furniture,
    thumbnail,
  }).save()
}

async function updateDesign(userId, id, { name, room, furniture, thumbnail }) {
  const updated = await Design.findOneAndUpdate(
    { _id: id, userId },
    { name, room, furniture, thumbnail, updatedAt: Date.now() },
    { new: true }
  )
  if (!updated) throw new ApiError(404, 'Design not found')
  return updated
}

async function renameDesign(userId, id, name) {
  const updated = await Design.findOneAndUpdate(
    { _id: id, userId },
    { name: name.trim().slice(0, 100), updatedAt: Date.now() },
    { new: true }
  )
  if (!updated) throw new ApiError(404, 'Design not found')
  return updated
}

async function deleteDesign(userId, id) {
  const design = await Design.findOneAndDelete({ _id: id, userId })
  if (!design) throw new ApiError(404, 'Design not found or unauthorized')
  return design
}

module.exports = {
  listDesigns,
  getDesign,
  createDesign,
  updateDesign,
  renameDesign,
  deleteDesign,
}
