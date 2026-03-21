const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ✅ โหลด model แบบ safe — รองรับทั้ง Video.js และ video.js
let Video;
try {
  Video = require('../models/Video');
} catch (e) {
  Video = require('../models/video');
}

// ── Cloudinary config ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer + Cloudinary storage ──
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [{ quality: 'auto' }],
    // ✅ generate thumbnail ทันทีหลังอัพโหลด
    eager: [
      {
        width: 640,
        height: 360,
        crop: 'fill',
        format: 'jpg',
        start_offset: '0',
      },
    ],
    eager_async: false,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// ─────────────────────────────────────────────
// GET /api/videos  — ดึงทั้งหมด (พร้อม filter)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ ใช้ mongoose.models.Video โดยตรงเพื่อป้องกัน case-sensitive require พัง
    const VideoModel = mongoose.models.Video || Video;
    const [total, videos] = await Promise.all([
      VideoModel.countDocuments(filter),
      VideoModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ]);

    res.json({ videos, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/videos/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    const VideoModel = mongoose.models.Video || Video;
    const video = await VideoModel.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'ไม่พบวิดีโอ' });

    video.views += 1;
    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/videos  (Admin only) — อัพโหลด
// ─────────────────────────────────────────────
router.post('/', auth, admin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์วิดีโอ' });

    const { title, description, category, tags, author } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'กรุณากรอกชื่อวิดีโอ' });

    const publicId = req.file.filename;

    // ✅ ดึง thumbnail จาก eager result หรือ fallback ด้วย cloudinary.url()
    const eagerResult = req.file.eager?.[0];
    const thumbnailUrl = eagerResult?.secure_url
      || cloudinary.url(publicId, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 640, height: 360, crop: 'fill', start_offset: '0' },
          ],
        });

    const VideoModel = mongoose.models.Video || Video;
    const video = new VideoModel({
      title:              title.trim(),
      description:        description || '',
      videoUrl:           req.file.path,
      thumbnailUrl,
      cloudinaryPublicId: publicId,
      duration:           req.file.duration || 0,
      category:           category || 'ทั่วไป',
      tags:               tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      author:             author || 'Admin',
    });

    await video.save();
    res.status(201).json({ message: 'อัพโหลดวิดีโอสำเร็จ', video });
  } catch (error) {
    console.error('Upload video error:', error);
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' }).catch(() => {});
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพโหลด', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/videos/:id  (Admin only) — แก้ข้อมูล
// ─────────────────────────────────────────────
router.put('/:id', auth, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    const VideoModel = mongoose.models.Video || Video;
    const video = await VideoModel.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'ไม่พบวิดีโอ' });

    const { title, description, category, tags, author } = req.body;
    if (title)                     video.title       = title.trim();
    if (description !== undefined) video.description = description;
    if (category)                  video.category    = category;
    if (author !== undefined)      video.author      = author;
    if (tags !== undefined)        video.tags        = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : tags;
    video.updatedAt = new Date();

    await video.save();
    res.json({ message: 'อัพเดตวิดีโอสำเร็จ', video });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/videos/:id  (Admin only)
// ─────────────────────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    const VideoModel = mongoose.models.Video || Video;
    const video = await VideoModel.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'ไม่พบวิดีโอ' });

    if (video.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' }).catch(() => {});
    }

    await video.deleteOne();
    res.json({ message: 'ลบวิดีโอสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

module.exports = router;