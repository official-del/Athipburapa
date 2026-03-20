import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [authError, setAuthError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (isMounted.current) setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getMe();
      if (isMounted.current) {
        // ✅ แก้: /auth/me ส่งกลับ flat object ไม่มี .user wrapper
        const userData = response.data.user ?? response.data;
        setUser(userData);
        setAuthError(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      if (isMounted.current) {
        setUser(null);
        if (error.response?.status === 401) setAuthError('session_expired');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      if (!token || !userData) throw new Error('Invalid response from server');
      localStorage.setItem('token', token);
      if (isMounted.current) setUser(userData);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
      if (isMounted.current) setAuthError(msg);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setAuthError(null);
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      if (!token || !newUser) throw new Error('Invalid response from server');
      localStorage.setItem('token', token);
      if (isMounted.current) setUser(newUser);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ';
      if (isMounted.current) setAuthError(msg);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    if (isMounted.current) { setUser(null); setAuthError(null); }
    try { await authAPI.logout(); } catch { /* best-effort */ }
  }, []);

  // ✅ updateUser: merge เฉพาะ fields ที่เปลี่ยน
  const updateUser = useCallback((updatedFields) => {
    if (isMounted.current) setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  }, []);

  const value = {
    user,
    loading,
    authError,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
    clearAuthError: () => setAuthError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};