const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    content:  { type: String, required: true },
    excerpt:  { type: String, default: '' },
    image:    { type: String, default: '' },
    // ✅ เปลี่ยนจาก String → ObjectId ref 'Category' ให้ .populate() ทำงานได้
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    author:   { type: String, default: '' },
    views:    { type: Number, default: 0 },
  },
  {
    timestamps: true // ✅ สร้าง createdAt + updatedAt อัตโนมัติ แทน createdAt: Date.now ที่เขียนเอง
  }
);

module.exports = mongoose.model('News', NewsSchema);