import axios from 'axios';

// ตรวจสอบตัวแปรจาก Vercel ถ้าไม่มีให้ใช้ localhost
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://athipburapa.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor: แนบ Token ทุก Request ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor: จัดการ Error กลาง ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    if (status === 403) {
      console.warn('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
    }

    if (status >= 500) {
      console.error('เกิดข้อผิดพลาดที่ Server กรุณาลองใหม่อีกครั้ง');
    }

    return Promise.reject(error);
  }
);

// --- Auth ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getMe: () => api.get('/auth/me'),
};

// --- News ---
export const newsAPI = {
  getAll:  (params)      => api.get('/news', { params }),
  getById: (id)          => api.get(`/news/${id}`),
  create:  (data)        => api.post('/news', data),
  update:  (id, data)    => api.put(`/news/${id}`, data),
  delete:  (id)          => api.delete(`/news/${id}`),
};

// --- Category ---
export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

// --- Comment ---
export const commentAPI = {
  getByNewsId: (newsId) => api.get(`/comments/news/${newsId}`),
  create:      (data)   => api.post('/comments', data),
  delete:      (id)     => api.delete(`/comments/${id}`),
};

// --- Video ---
export const videoAPI = {
  getAll:  (params)   => api.get('/videos', { params }),
  getById: (id)       => api.get(`/videos/${id}`),
  // create ใช้ FormData (multipart) — เรียกตรงผ่าน api instance ใน component
  update:  (id, data) => api.put(`/videos/${id}`, data),
  delete:  (id)       => api.delete(`/videos/${id}`),
};

export default api;