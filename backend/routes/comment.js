const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────────
// GET /api/comments/news/:newsId
// ─────────────────────────────────────────────
router.get('/news/:newsId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.newsId)) {
      return res.status(400).json({ message: 'รูปแบบ ID ข่าวไม่ถูกต้อง' });
    }
    const comments = await Comment.find({ newsId: req.params.newsId })
      .populate('userId', 'username fullName')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคอมเมนต์' });
  }
});

// ─────────────────────────────────────────────
// GET /api/comments/video/:videoId  ✅ ใหม่
// ─────────────────────────────────────────────
router.get('/video/:videoId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) {
      return res.status(400).json({ message: 'รูปแบบ ID วิดีโอไม่ถูกต้อง' });
    }
    const comments = await Comment.find({ videoId: req.params.videoId })
      .populate('userId', 'username fullName profileImage')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Get video comments error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคอมเมนต์' });
  }
});

// ─────────────────────────────────────────────
// POST /api/comments  (รองรับทั้ง newsId และ videoId)
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { newsId, videoId, content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'กรุณาใส่ข้อความคอมเมนต์' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้ (Token อาจผิดพลาด)' });
    }

    // ต้องมีอย่างใดอย่างหนึ่ง
    if (!newsId && !videoId) {
      return res.status(400).json({ message: 'กรุณาระบุ newsId หรือ videoId' });
    }

    if (newsId && !mongoose.Types.ObjectId.isValid(newsId)) {
      return res.status(400).json({ message: 'รูปแบบ newsId ไม่ถูกต้อง', debug_value: newsId });
    }

    if (videoId && !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: 'รูปแบบ videoId ไม่ถูกต้อง', debug_value: videoId });
    }

    const comment = new Comment({
      newsId:  newsId  || null,
      videoId: videoId || null,
      userId:  req.userId,
      content: content.trim(),
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username fullName profileImage');

    res.status(201).json({ message: 'เพิ่มคอมเมนต์สำเร็จ', comment: populatedComment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/comments/:id
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID คอมเมนต์ไม่ถูกต้อง' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'ไม่พบคอมเมนต์' });

    if (comment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบคอมเมนต์นี้' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'ลบคอมเมนต์สำเร็จ' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบคอมเมนต์' });
  }
});

module.exports = router;