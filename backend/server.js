require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db.js');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

connectDB();

// ── CORS ──────────────────────────────────────
const allowedOrigins = [
  'https://template-pattayapal-u6n3.vercel.app',
  'https://template-pattayapal.vercel.app',
  /\.vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    console.warn(`CORS blocked: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/news',       require('./routes/news'));
app.use('/api/comments',   require('./routes/comment'));
app.use('/api/videos',     require('./routes/videos'));
app.use('/api/upload',     require('./routes/upload'));
app.use('/api/dashboard',  require('./routes/dashboard')); // ✅ ใหม่

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date(),
    cloudinary: !!process.env.CLOUDINARY_API_KEY ? 'configured' : 'MISSING',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));