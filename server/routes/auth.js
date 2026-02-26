const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

// Make sure you define a JWT_SECRET in your .env file
// If it's missing, we provide a fallback for local testing
const JWT_SECRET = process.env.JWT_SECRET

// ── REGISTER ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already taken' })
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Save the user
    const newUser = new User({ email, password: hashedPassword })
    await newUser.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' } // Token lasts for 7 days
    )

    res.status(201).json({ token, email: newUser.email })

  } catch (error) {
    console.error('Registration Error:', error)
    res.status(500).json({ error: 'Server error during registration' })
  }
})

// ── LOGIN ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find the user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Compare the provided password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({ token, email: user.email })

  } catch (error) {
    console.error('Login Error:', error)
    res.status(500).json({ error: 'Server error during login' })
  }
})

module.exports = router
