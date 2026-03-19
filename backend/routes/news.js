const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const News = require('../models/News');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─────────────────────────────────────────────
// GET /api/news
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const news = await News.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลข่าว', error: error.message });
  }
});

// ─────────────────────────────────────────────
// ✅ GET /api/news/category/:categoryId
// ต้องอยู่เหนือ /:id เสมอ ไม่งั้น Express จะตีความ
// "category" ว่าเป็น :id แล้วพัง
// ─────────────────────────────────────────────
router.get('/category/:categoryId', async (req, res) => {
  try {
    const news = await News.find({ category: req.params.categoryId })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.json(news);
  } catch (error) {
    console.error('Get news by category error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/news/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    const news = await News.findById(req.params.id).populate('category', 'name slug');

    if (!news) {
      return res.status(404).json({ message: 'ไม่พบข่าว' });
    }

    news.views += 1;
    await news.save();

    res.json(news);
  } catch (error) {
    console.error('Get single news error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/news  (Admin only)
// ─────────────────────────────────────────────
router.post('/', auth, admin, async (req, res) => {
  try {
    // ✅ เพิ่ม albumImages
    const { title, content, excerpt, image, category, author, albumImages } = req.body;

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'หมวดหมู่ไม่ถูกต้อง' });
    }

    // ✅ ส่ง albumImages เข้า constructor ด้วย
    const news = new News({ title, content, excerpt, image, category, author, albumImages });
    await news.save();

    const populatedNews = await News.findById(news._id).populate('category', 'name slug');
    res.status(201).json({ message: 'สร้างข่าวสำเร็จ', news: populatedNews });

  } catch (error) {
    console.error('Create news error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: `ข้อมูลไม่ครบถ้วน: ${messages}` });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างข่าว', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/news/:id  (Admin only)
// ─────────────────────────────────────────────
router.put('/:id', auth, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    // ✅ เพิ่ม albumImages
    const { title, content, excerpt, image, category, author, albumImages } = req.body;

    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'หมวดหมู่ไม่ถูกต้อง' });
    }

    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'ไม่พบข่าว' });
    }

    if (title)                 news.title    = title;
    if (content)               news.content  = content;
    if (excerpt !== undefined) news.excerpt  = excerpt;
    if (image)                 news.image    = image;
    if (category)              news.category = category;
    if (author !== undefined)  news.author   = author;
    // ✅ ต้องเช็ค Array.isArray เพราะ [] เป็น falsy ใน if ธรรมดา
    if (Array.isArray(albumImages)) news.albumImages = albumImages;

    await news.save();

    const populatedNews = await News.findById(news._id).populate('category', 'name slug');
    res.json({ message: 'อัปเดตข่าวสำเร็จ', news: populatedNews });

  } catch (error) {
    console.error('Update news error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: `ข้อมูลไม่ครบถ้วน: ${messages}` });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข่าว', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/news/:id  (Admin only)
// ─────────────────────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'ไม่พบข่าว' });
    }

    res.json({ message: 'ลบข่าวสำเร็จ' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข่าว', error: error.message });
  }
});

module.exports = router;