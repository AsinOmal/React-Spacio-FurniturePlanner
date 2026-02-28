const express = require('express')
const Design = require('../models/Design')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// ── GET ALL DESIGNS (For the logged-in user) ──────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const designs = await Design.find({ userId: req.user.userId }).sort({ updatedAt: -1 })
    res.json(designs)
  } catch (error) {
    console.error('Error fetching designs:', error)
    res.status(500).json({ error: 'Failed to fetch designs' })
  }
})

// ── GET A SINGLE DESIGN ───────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const design = await Design.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!design) {
      return res.status(404).json({ error: 'Design not found' })
    }
    res.json(design)
  } catch (error) {
    console.error('Error fetching design:', error)
    res.status(500).json({ error: 'Failed to fetch design' })
  }
})

// ── CREATE OR UPDATE A DESIGN ─────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, room, furniture, thumbnail } = req.body

    if (!room || !furniture) {
      return res.status(400).json({ error: 'Room and furniture data are required' })
    }

    // We'll just create a new design for every save right now to keep it simple,
    // or you could pass an ID to update an existing one. For this example, 
    // let's assume it creates a new one every time you click "Save".
    const newDesign = new Design({
      userId: req.user.userId,
      name: name || 'Untitled Design',
      room,
      furniture,
      thumbnail
    })

    const savedDesign = await newDesign.save()
    res.status(201).json(savedDesign)

  } catch (error) {
    console.error('Error saving design:', error)
    res.status(500).json({ error: 'Failed to save design' })
  }
})
// ── UPDATE A DESIGN ───────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, room, furniture, thumbnail } = req.body

    const updatedDesign = await Design.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { name, room, furniture, thumbnail, updatedAt: Date.now() },
      { new: true }
    )

    if (!updatedDesign) {
      return res.status(404).json({ error: 'Design not found' })
    }

    res.json(updatedDesign)
  } catch (error) {
    console.error('Error updating design:', error)
    res.status(500).json({ error: 'Failed to update design' })
  }
})
// ── DELETE A DESIGN ───────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const design = await Design.findOneAndDelete({ _id: req.params.id, userId: req.user.userId })
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found or unauthorized' })
    }

    res.json({ message: 'Design deleted successfully' })
  } catch (error) {
    console.error('Error deleting design:', error)
    res.status(500).json({ error: 'Failed to delete design' })
  }
})

module.exports = router
