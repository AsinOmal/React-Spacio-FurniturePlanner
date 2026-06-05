const { z } = require('zod')
const { asyncHandler, ApiError } = require('../middleware/errorHandler')
const designService = require('../services/designService')

const designSchema = z.object({
  name: z.string().max(100).optional(),
  room: z
    .object({
      width: z.number().min(1).max(100),
      length: z.number().min(1).max(100),
      shape: z.string().optional(),
      wallColor: z.string().optional(),
      floorColor: z.string().optional(),
    })
    .passthrough(),
  furniture: z.array(z.any()).max(300, 'Too many furniture items'),
  // Captured PNG/JPEG data URL — capped so a client can't store an unbounded blob.
  thumbnail: z.string().max(2_000_000).optional(),
})

function parseDesign(body) {
  const result = designSchema.safeParse(body)
  if (!result.success) throw new ApiError(400, result.error.issues[0].message)
  return result.data
}

const list = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : undefined
  const page = req.query.page ? Number(req.query.page) : undefined
  const designs = await designService.listDesigns(req.user.userId, { limit, page })
  res.json(designs)
})

const getOne = asyncHandler(async (req, res) => {
  const design = await designService.getDesign(req.user.userId, req.params.id)
  res.json(design)
})

const create = asyncHandler(async (req, res) => {
  const data = parseDesign(req.body)
  const design = await designService.createDesign(req.user.userId, data)
  res.status(201).json(design)
})

const update = asyncHandler(async (req, res) => {
  const data = parseDesign(req.body)
  const design = await designService.updateDesign(req.user.userId, req.params.id, data)
  res.json(design)
})

const rename = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ApiError(400, 'Name is required')
  }
  const design = await designService.renameDesign(req.user.userId, req.params.id, name)
  res.json(design)
})

const remove = asyncHandler(async (req, res) => {
  await designService.deleteDesign(req.user.userId, req.params.id)
  res.json({ message: 'Design deleted successfully' })
})

module.exports = { list, getOne, create, update, rename, remove }
