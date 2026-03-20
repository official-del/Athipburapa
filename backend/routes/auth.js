const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const User       = require('../models/User');
const auth       = require('../middleware/auth');

// ── Cloudinary config (ใช้ env เดิมที่มีอยู่แล้ว) ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer — เก็บใน memory แล้วส่งต่อให้ Cloudinary ──
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น'), false);
  },
});

// Helper: อัปโหลดไฟล์ขึ้น Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// ── POST /api/auth/register ──────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'รหัสผ่านไม่ตรงกัน' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'อีเมลนี้ถูกใช้งานแล้ว'
          : 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ fullName, username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      token,
      user: {
        id:             user._id,
        fullName:       user.fullName,
        username:       user.username,
        email:          user.email,
        role:           user.role,
        profileImage:   user.profileImage,
        backgroundImage: user.backgroundImage,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ── POST /api/auth/login ─────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'ไม่พบบัญชีผู้ใช้นี้' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id:             user._id,
        fullName:       user.fullName,
        username:       user.username,
        email:          user.email,
        role:           user.role,
        profileImage:   user.profileImage,
        backgroundImage: user.backgroundImage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ── POST /api/auth/logout ────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'ออกจากระบบสำเร็จ' });
});

// ── GET /api/auth/me ─────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

    res.json({
      id:             user._id,
      fullName:       user.fullName,
      username:       user.username,
      email:          user.email,
      role:           user.role,
      profileImage:   user.profileImage,
      backgroundImage: user.backgroundImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ── PUT /api/auth/profile ────────────────────────────
// ✅ route ใหม่สำหรับ Profile.jsx
// รับ multipart/form-data: fullName, profileImage (file หรือ URL), backgroundImage (file หรือ URL)
router.put(
  '/profile',
  auth,
  upload.fields([
    { name: 'profileImage',    maxCount: 1 },
    { name: 'backgroundImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

      // ── fullName ──
      if (req.body.fullName) {
        user.fullName = req.body.fullName.trim();
      }

      // ── profileImage ──
      if (req.files?.profileImage?.[0]) {
        // กรณีอัปโหลดไฟล์จริง → ส่งขึ้น Cloudinary
        user.profileImage = await uploadToCloudinary(
          req.files.profileImage[0].buffer,
          'athipburapa/profiles'
        );
      } else if (req.body.profileImage) {
        // กรณีเลือก Avatar URL
        user.profileImage = req.body.profileImage;
      }

      // ── backgroundImage ──
      if (req.files?.backgroundImage?.[0]) {
        user.backgroundImage = await uploadToCloudinary(
          req.files.backgroundImage[0].buffer,
          'athipburapa/backgrounds'
        );
      } else if (req.body.backgroundImage) {
        user.backgroundImage = req.body.backgroundImage;
      }

      await user.save();

      const updatedUser = {
        id:             user._id,
        fullName:       user.fullName,
        username:       user.username,
        email:          user.email,
        role:           user.role,
        profileImage:   user.profileImage,
        backgroundImage: user.backgroundImage,
      };

      res.json({
        success: true,
        message: 'อัปเดตโปรไฟล์สำเร็จ',
        user:    updatedUser,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' });
    }
  }
);

module.exports = router;