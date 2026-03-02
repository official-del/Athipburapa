import React, { useState, useEffect, useRef } from 'react';
import { IoPerson, IoSettingsOutline, IoMenu, IoClose, IoLogOut } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import { categoryAPI } from '../services/api';
import './Navbar.css';

function Navbar() {
  const { user, logout }        = useAuth();
  const { lang, switchLang, t } = useLanguage();
  const navigate                = useNavigate();
  const location                = useLocation();
  const [showUserMenu, setShowUserMenu]     = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch]         = useState(false);
  const [searchTerm, setSearchTerm]         = useState('');
  const [categories, setCategories]         = useState([]);
  const searchRef = useRef(null);

  const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';

  useEffect(() => {
    categoryAPI.getAll()
      .then(res => setCategories(res.data))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/news?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearch(false);
      setSearchTerm('');
      setShowMobileMenu(false);
    }
  };

  const path        = location.pathname;
  const isAllActive = path === '/news';
  const activeCat   = path.startsWith('/news/category/')
    ? decodeURIComponent(path.split('/news/category/')[1])
    : null;

  return (
    <>
      <nav className="nb-root">
        {/* ── TOP BAR ── */}
        <div className="nb-top">
          <div className="nb-left">
            <button className="nb-icon-btn" onClick={() => setShowMobileMenu(true)} aria-label="เมนู">
              <IoMenu />
            </button>
          </div>

          <div className="nb-center">
            <Link to="/" className="nb-logo">
              Athip<span>burapa</span>
            </Link>
          </div>

          <div className="nb-right">
            {/* ── Language switcher ── */}
            <div className="nb-lang-switcher">
              <button
                className={`nb-lang-btn${lang === 'th' ? ' active' : ''}`}
                onClick={() => switchLang('th')}
                aria-label="ภาษาไทย"
              >TH</button>
              <button
                className={`nb-lang-btn${lang === 'en' ? ' active' : ''}`}
                onClick={() => switchLang('en')}
                aria-label="English"
              >EN</button>
            </div>

            <button className="nb-icon-btn" onClick={() => setShowSearch(true)} aria-label="ค้นหา">
              <CiSearch />
            </button>

            {user ? (
              <div className="nb-profile-wrap">
                <div className="nb-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                  {(user.profileImage || user.image) ? (
                    <img
                      src={user.profileImage || user.image}
                      alt="Profile"
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                    />
                  ) : (
                    <IoPerson />
                  )}
                </div>

                {showUserMenu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowUserMenu(false)} />
                    <div className="nb-dropdown" style={{ zIndex: 1000 }}>
                      <div className="nb-dropdown-header">
                        <p className="name">{user.fullName || user.username}</p>
                        <span className="email">{user.email}</span>
                      </div>
                      <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                        <IoPerson /> {t('nav_profile')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                          <IoSettingsOutline /> {t('nav_admin')}
                        </Link>
                      )}
                      <button onClick={handleLogout}>
                        <IoLogOut /> {t('nav_logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="nb-login-btn">
                <IoPerson /><span className="nb-login-text">{t('nav_login')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div className="nb-cats">
          <Link to="/news" className={`nb-cat-link${isAllActive ? ' active' : ''}`}>
            {t('nav_allNews')}
          </Link>
          {categories.map(cat => (
            <Link
              key={cat._id}
              to={`/news/category/${encodeURIComponent(cat.name)}`}
              className={`nb-cat-link${activeCat === cat.name ? ' active' : ''}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── SEARCH OVERLAY ── */}
      {showSearch && (
        <div className="nb-search-overlay" onClick={() => setShowSearch(false)}>
          <div className="nb-search-box" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch}>
              <input
                ref={searchRef}
                type="text"
                placeholder={t('nav_search')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button type="submit"><CiSearch /></button>
            </form>
          </div>
        </div>
      )}

      {/* ── MOBILE DRAWER ── */}
      {showMobileMenu && (
        <>
          <div className="nb-drawer-backdrop" onClick={() => setShowMobileMenu(false)} />
          <div className="nb-drawer">
            <div className="nb-drawer-header">
              <Link to="/" className="nb-drawer-logo" onClick={() => setShowMobileMenu(false)}>
                Athip<span>burapa</span>
              </Link>
              <button className="nb-icon-btn" onClick={() => setShowMobileMenu(false)}>
                <IoClose />
              </button>
            </div>

            {/* Lang switcher ใน drawer — แสดงเฉพาะ ≤360px */}
            <div className="nb-drawer-lang">
              <span className="nb-drawer-lang-label">Language</span>
              <div className="nb-lang-switcher">
                <button
                  className={`nb-lang-btn${lang === 'th' ? ' active' : ''}`}
                  onClick={() => { switchLang('th'); setShowMobileMenu(false); }}
                >TH</button>
                <button
                  className={`nb-lang-btn${lang === 'en' ? ' active' : ''}`}
                  onClick={() => { switchLang('en'); setShowMobileMenu(false); }}
                >EN</button>
              </div>
            </div>

            <div className="nb-drawer-links">
              <Link
                to="/news"
                className={`nb-drawer-link${isAllActive ? ' active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                {t('nav_allNews')}
              </Link>
              {categories.length > 0 && (
                <>
                  <div className="nb-drawer-section-title">{t('nav_categories')}</div>
                  {categories.map(cat => (
                    <Link
                      key={cat._id}
                      to={`/news/category/${encodeURIComponent(cat.name)}`}
                      className={`nb-drawer-cat${activeCat === cat.name ? ' active' : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;