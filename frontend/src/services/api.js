import axios from 'axios';

// --- แก้ไขจุดนี้: ทำให้มั่นใจว่ามี /api แน่นอน ---
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) {
    // ถ้ามี VITE_API_URL และยังไม่มี /api ต่อท้าย ให้เติมให้
    return envURL.endsWith('/api') ? envURL : `${envURL}/api`;
  }
  // ถ้าไม่มี Env ให้ใช้ URL Render และต้องมี /api ปิดท้าย
  return 'https://athipburapa.onrender.com/api'; 
};

const API_URL = getBaseURL();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- ส่วนที่เหลือคงเดิม ---
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- API Modules (Auth, News, etc.) ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getMe: () => api.get('/auth/me'),
};

export const newsAPI = {
  getAll:  (params)      => api.get('/news', { params }),
  getById: (id)          => api.get(`/news/${id}`),
  create:  (data)        => api.post('/news', data),
  update:  (id, data)    => api.put(`/news/${id}`, data),
  delete:  (id)          => api.delete(`/news/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

export const commentAPI = {
  getByNewsId: (newsId) => api.get(`/comments/news/${newsId}`),
  create:       (data)   => api.post('/comments', data),
  delete:       (id)     => api.delete(`/comments/${id}`),
};

export const videoAPI = {
  getAll:  (params)   => api.get('/videos', { params }),
  getById: (id)       => api.get(`/videos/${id}`),
  update:  (id, data) => api.put(`/videos/${id}`, data),
  delete:  (id)       => api.delete(`/videos/${id}`),
};

export default api;