const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type:     String,
    required: true,
    trim:     true,
  },
  username: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
    lowercase: true,
  },
  email: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
    lowercase: true,
  },
  password: {
    type:     String,
    required: true,
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user',
  },
  // ✅ profileImage และ backgroundImage ต้องมีอยู่ใน schema
  profileImage: {
    type:    String,
    default: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
  },
  backgroundImage: {
    type:    String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);