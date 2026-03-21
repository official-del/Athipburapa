const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // ── ผูกกับข่าว (เดิม) ──
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    default: null,
  },
  // ── ผูกกับวิดีโอ (ใหม่) ──
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Comment', commentSchema);