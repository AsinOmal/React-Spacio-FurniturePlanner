const express = require('express')
const authMiddleware = require('../middleware/auth')
const { upload, uploadModel } = require('../controllers/modelController')

const router = express.Router()

// POST /api/models/upload — multipart/form-data with a 'model' file field
router.post('/upload', authMiddleware, upload.single('model'), uploadModel)

module.exports = router
