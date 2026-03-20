import axios from 'axios';

const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) {
    return envURL.endsWith('/api') ? envURL : `${envURL}/api`;
  }
  return 'https://athipburapa.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // ✅ ถ้าเป็น FormData ให้ลบ Content-Type ออก
    // เพื่อให้ browser ตั้ง multipart/form-data พร้อม boundary เองอัตโนมัติ
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  logout:        () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getMe:         () => api.get('/auth/me'),
  // ✅ เพิ่ม updateProfile — ส่ง FormData ได้ทั้งไฟล์และ URL
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const newsAPI = {
  getAll:  (params)   => api.get('/news', { params }),
  getById: (id)       => api.get(`/news/${id}`),
  create:  (data)     => api.post('/news', data),
  update:  (id, data) => api.put(`/news/${id}`, data),
  delete:  (id)       => api.delete(`/news/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

export const commentAPI = {
  getByNewsId: (newsId) => api.get(`/comments/news/${newsId}`),
  create:      (data)   => api.post('/comments', data),
  delete:      (id)     => api.delete(`/comments/${id}`),
};

export const videoAPI = {
  getAll:  (params)   => api.get('/videos', { params }),
  getById: (id)       => api.get(`/videos/${id}`),
  update:  (id, data) => api.put(`/videos/${id}`, data),
  delete:  (id)       => api.delete(`/videos/${id}`),
};

export default api;