const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'ทั่วไป'
  },
  tags: {
    type: [String],
    default: []
  },
  views: {
    type: Number,
    default: 0
  },
  author: {
    type: String,
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Video', videoSchema);