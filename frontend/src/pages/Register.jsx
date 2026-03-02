import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../css/Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', fullName: ''
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register }          = useAuth();
  const { t }                 = useLanguage();
  const navigate              = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      return setError(t('auth_pwdMismatch'));
    }
    if (formData.password.length < 6) {
      return setError(t('auth_pwdTooShort'));
    }
    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth_errRegister'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title">{t('auth_register')}</h1>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">{t('auth_fullName')}</label>
              <input
                type="text" id="fullName" name="fullName"
                value={formData.fullName} onChange={handleChange}
                required placeholder={t('auth_phFullName')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">{t('auth_username')}</label>
              <input
                type="text" id="username" name="username"
                value={formData.username} onChange={handleChange}
                required placeholder={t('auth_phUsername')} minLength="3"
              />
            </div>
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
                required placeholder={t('auth_phPassword')} minLength="6"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth_confirmPwd')}</label>
              <input
                type="password" id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                required placeholder={t('auth_phConfirmPwd')} minLength="6"
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? t('auth_registeringBtn') : t('auth_registerBtn')}
            </button>
          </form>

          <p className="auth-link">
            {t('auth_hasAccount')} <Link to="/login">{t('auth_toLogin')}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Register;