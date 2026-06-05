const express = require('express')
const authMiddleware = require('../middleware/auth')
const designController = require('../controllers/designController')

const router = express.Router()

// All design routes require an authenticated user.
router.use(authMiddleware)

router.get('/', designController.list)
router.get('/:id', designController.getOne)
router.post('/', designController.create)
router.put('/:id', designController.update)
router.patch('/:id', designController.rename)
router.delete('/:id', designController.remove)

module.exports = router
