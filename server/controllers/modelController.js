const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const { asyncHandler, ApiError } = require('../middleware/errorHandler')

// ── 3D model upload (.glb / .gltf) ────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext === '.glb' || ext === '.gltf') {
    cb(null, true)
  } else {
    cb(new ApiError(400, 'Only .glb and .gltf files are allowed!'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

const uploadModel = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No valid custom model file provided.')
  const fileUrl = `/uploads/${req.file.filename}`
  req.log.info({ file: req.file.filename, userId: req.user.userId }, 'Custom model uploaded')
  res.status(201).json({ message: 'Model uploaded successfully', url: fileUrl })
})

module.exports = { upload, uploadModel }
