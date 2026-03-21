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

// ── Helper: สร้าง thumbnail URL จาก videoUrl ──
// เช่น .../video/upload/v123/videos/abc.mp4
// → .../video/upload/so_5,w_640,h_360,c_fill/videos/abc.jpg
function buildThumbnailUrl(videoUrl) {
  if (!videoUrl) return '';
  return videoUrl
    .replace('/upload/', '/upload/so_5,w_640,h_360,c_fill/')
    .replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.jpg');
}

// ── Multer + Cloudinary storage ──
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [{ quality: 'auto' }],
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

    const videoUrl = req.file.path;

    // ✅ สร้าง thumbnail จาก videoUrl โดยตรง ไม่ต้องใช้ eager
    // เปลี่ยน /upload/ → /upload/so_5,w_640,h_360,c_fill/ และ .mp4 → .jpg
    const thumbnailUrl = buildThumbnailUrl(videoUrl);

    const VideoModel = mongoose.models.Video || Video;
    const video = new VideoModel({
      title:              title.trim(),
      description:        description || '',
      videoUrl,
      thumbnailUrl,
      cloudinaryPublicId: req.file.filename,
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