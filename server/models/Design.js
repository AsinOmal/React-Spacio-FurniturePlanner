const mongoose = require('mongoose')

const designSchema = new mongoose.Schema({
  // Link this design to the User who created it
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Design'
  },
  thumbnail: {
    type: String, // We'll store the SVG string or a data URL here
    required: false,
  },
  
  // The room configuration
  room: {
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    shape: { type: String, enum: ['Rectangle', 'L-Shape'], required: true },
    floorColor: { type: String, required: true },
    wallColor: { type: String, required: true },
  },

  // The furniture array items
  furniture: [{
    id: String,
    type: String, // e.g. "Sofa"
    color: String,
    material: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    rotation: Number,
    scale: Number,
  }]
}, { timestamps: true })

module.exports = mongoose.model('Design', designSchema)
