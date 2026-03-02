import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../css/Auth.css';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const { t }                   = useLanguage();
  const navigate                = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth_errLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title">{t('auth_login')}</h1>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth_email')}</label>
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                required placeholder={t('auth_phEmail')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('auth_password')}</label>
              <input
                type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                required placeholder={t('auth_phLoginPwd')} minLength="6"
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? t('auth_loggingBtn') : t('auth_loginBtn')}
            </button>
          </form>

          <p className="auth-link">
            {t('auth_noAccount')} <Link to="/register">{t('auth_toRegister')}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Login;