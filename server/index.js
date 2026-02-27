require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const path = require('path')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve static uploaded files (like 3D models)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spacio')
  .then(() => console.log('✅ Connected to MongoDB locally (spacio)'))
  .catch(err => console.error('❌ MongoDB connection error:', err))

// Basic Health Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Spacio API is running' })
})

// Routes
const authRoutes = require('./routes/auth')
const designRoutes = require('./routes/designs')
const modelRoutes = require('./routes/models')

app.use('/api/auth', authRoutes)
app.use('/api/designs', designRoutes)
app.use('/api/models', modelRoutes)

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
