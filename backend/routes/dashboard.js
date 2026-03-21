const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const auth     = require('../middleware/auth');
const admin    = require('../middleware/admin');

// โหลด models แบบ safe
const User    = mongoose.models.User    || require('../models/User');
const News    = mongoose.models.News    || require('../models/News');
const Comment = mongoose.models.Comment || require('../models/Comment');

let Video;
try { Video = require('../models/Video'); }
catch { try { Video = require('../models/video'); } catch { Video = null; } }

// ─────────────────────────────────────────────
// GET /api/dashboard  (Admin only)
// ─────────────────────────────────────────────
router.get('/', auth, admin, async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

    // ── ยอดรวม ──
    const [
      totalUsers, totalNews, totalComments, totalVideos,
      newUsersToday, newNewsToday, newCommentsToday,
      newUsersMonth, newNewsMonth,
      lastMonthUsers, lastMonthNews,
    ] = await Promise.all([
      User.countDocuments(),
      News.countDocuments(),
      Comment.countDocuments(),
      Video ? Video.countDocuments() : Promise.resolve(0),
      User.countDocuments({ createdAt: { $gte: today } }),
      News.countDocuments({ createdAt: { $gte: today } }),
      Comment.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      News.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      News.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
    ]);

    // ── ยอดวิวทั้งหมด ──
    const [newsViewsAgg, videoViewsAgg] = await Promise.all([
      News.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Video
        ? Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }])
        : Promise.resolve([]),
    ]);
    const totalNewsViews  = newsViewsAgg[0]?.total  || 0;
    const totalVideoViews = videoViewsAgg[0]?.total || 0;

    // ── กราฟผู้ใช้ใหม่ 7 วัน ──
    const userChart = await User.aggregate([
      { $match: { createdAt: { $gte: thisWeekStart } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // ── กราฟข่าวใหม่ 7 วัน ──
    const newsChart = await News.aggregate([
      { $match: { createdAt: { $gte: thisWeekStart } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // ── ข่าวยอดนิยม Top 5 ──
    const topNews = await News.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views createdAt category')
      .populate('category', 'name');

    // ── วิดีโอยอดนิยม Top 5 ──
    const topVideos = Video
      ? await Video.find().sort({ views: -1 }).limit(5).select('title views createdAt category thumbnailUrl')
      : [];

    // ── comment ล่าสุด 5 รายการ ──
    const recentComments = await Comment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username fullName profileImage')
      .populate('newsId', 'title')
      .populate('videoId', 'title');

    // ── user ล่าสุด 5 รายการ ──
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName username email role profileImage createdAt');

    // ── สัดส่วน user role ──
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalUsers,    totalNews,    totalComments,  totalVideos,
        newUsersToday, newNewsToday, newCommentsToday,
        newUsersMonth, newNewsMonth,
        lastMonthUsers, lastMonthNews,
        totalNewsViews, totalVideoViews,
      },
      charts: { userChart, newsChart },
      topNews,
      topVideos,
      recentComments,
      recentUsers,
      userRoles,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

module.exports = router;