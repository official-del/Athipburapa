import React, { useState, useEffect, useRef } from 'react';
import { IoPerson, IoSettingsOutline, IoMenu, IoClose, IoLogOut, IoVideocamOutline } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import { categoryAPI } from '../services/api';
import { translateBatch } from '../services/translationService';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, switchLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [displayCats, setDisplayCats] = useState([]);

  const searchRef = useRef(null);

  useEffect(() => {
    categoryAPI.getAll()
      .then(res => setCategories(res.data))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    const updateNames = async () => {
      if (categories.length === 0) return;
      const rawNames = categories.map(c => c.name);
      if (lang === 'en') {
        try {
          const translated = await translateBatch(rawNames, { from: 'th', to: 'en' });
          setDisplayCats(translated);
        } catch { setDisplayCats(rawNames); }
      } else {
        setDisplayCats(rawNames);
      }
    };
    updateNames();
  }, [lang, categories]);

  const handleSwitchLang = (newLang) => {
    switchLang(newLang);
    setShowMobileMenu(false);
  };

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

  const path = location.pathname;
  const isAllActive   = path === '/news';
  const isVideoActive = path === '/videos';
  const activeCat = path.startsWith('/news/category/')
    ? decodeURIComponent(path.split('/news/category/')[1])
    : null;

  return (
    <>
      <nav className="nb-root">

        {/* ══════════════ TOP BAR (Red) ══════════════ */}
        <div className="nb-top">

          {/* Left: Hamburger + Logo */}
          <div className="nb-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="nb-icon-btn" onClick={() => setShowMobileMenu(true)} aria-label="Menu">
              <IoMenu />
            </button>
            <Link to="/" className="nb-logo">
              <span className="nb-logo-main">ATHIPBURAPA</span>
              <div className="nb-logo-sub">
                <span className="nb-logo-sub-text">ข่าว</span>
                <span className="nb-logo-online">ONLINE</span>
              </div>
            </Link>
          </div>

          {/* Center: Shortcut buttons (desktop only) */}
          <div className="nb-shortcuts desktop-only">
            <Link to="/news/category/ข่าวด่วน" className="nb-shortcut-btn">
              <span className="nb-shortcut-icon green">🏠</span>
              ข่าวด่วน
            </Link>
            <Link to="/news/category/เศรษฐกิจ" className="nb-shortcut-btn">
              <span className="nb-shortcut-icon gold">💰</span>
              เศรษฐกิจ
            </Link>
            <Link to="/news/category/หวย" className="nb-shortcut-btn">
              <span className="nb-shortcut-icon blue">🎲</span>
              ตรวจหวย
            </Link>
            <Link to="/news/category/ดวง" className="nb-shortcut-btn">
              <span className="nb-shortcut-icon teal">⭐</span>
              ดูดวง
            </Link>
          </div>

          {/* Right: Lang + Search + User */}
          <div className="nb-right">
            <div className="nb-lang-switcher desktop-only">
              <button className={`nb-lang-btn${lang === 'th' ? ' active' : ''}`} onClick={() => switchLang('th')}>TH</button>
              <button className={`nb-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')}>EN</button>
            </div>

            <button className="nb-search-pill" onClick={() => setShowSearch(true)}>
              <CiSearch />
              <span className="desktop-only">{lang === 'en' ? 'Search' : 'ค้นหา'}</span>
            </button>

            {user ? (
              <div className="nb-profile-wrap">
                <div className="nb-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                  {user.profileImage || user.image
                    ? <img src={user.profileImage || user.image} alt="Profile" />
                    : <IoPerson />}
                </div>

                {showUserMenu && (
                  <div className="nb-dropdown">
                    <div className="nb-dropdown-header">
                      <span className="name">{user.username}</span>
                      <span className="role">{user.role}</span>
                    </div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                      <IoPerson /> {t('nav_profile') || 'โปรไฟล์'}
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                          <IoSettingsOutline /> จัดการข่าวสาร
                        </Link>
                        <Link to="/admin/videos" onClick={() => setShowUserMenu(false)}>
                          <IoVideocamOutline /> จัดการวิดีโอ
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="nb-logout-item">
                      <IoLogOut /> {t('nav_logout') || 'ออกจากระบบ'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nb-login-btn">
                <IoPerson /> <span>{t('nav_login') || 'เข้าสู่ระบบ'}</span>
              </Link>
            )}
          </div>
        </div>

        {/* ══════════════ BOTTOM CATEGORY BAR (Dark) ══════════════ */}
        <div className="nb-cats-bar">
          {/* Home icon */}
          <Link to="/news" className={`nb-cat-link${isAllActive ? ' active' : ''}`}>
            🏠
          </Link>
          {categories.map((cat, i) => (
            <Link
              key={cat._id}
              to={`/news/category/${encodeURIComponent(cat.name)}`}
              className={`nb-cat-link${activeCat === cat.name ? ' active' : ''}`}
            >
              {displayCats[i] || cat.name}
            </Link>
          ))}
          <Link to="/videos" className={`nb-cat-link nb-cat-video${isVideoActive ? ' active' : ''}`}>
            <IoVideocamOutline /> {lang === 'en' ? 'Videos' : 'วิดีโอ'}
          </Link>
        </div>
      </nav>

      {/* ══════════════ SEARCH OVERLAY ══════════════ */}
      {showSearch && (
        <>
          <div className="nb-overlay-backdrop" onClick={() => setShowSearch(false)} />
          <div className="nb-search-modal">
            <div className="nb-search-container">
              <form onSubmit={handleSearch}>
                <input
                  ref={searchRef} autoFocus type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาหัวข้อข่าวที่คุณสนใจ..."
                />
                <button type="submit"><CiSearch /></button>
              </form>
              <button className="nb-close-search" onClick={() => setShowSearch(false)}><IoClose /></button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ MOBILE DRAWER ══════════════ */}
      {showMobileMenu && (
        <>
          <div className="nb-overlay-backdrop" onClick={() => setShowMobileMenu(false)} />
          <div className="nb-drawer">
            <div className="nb-drawer-header">
              <div className="nb-drawer-user-info">
                {user ? (
                  <div className="nb-user-card">
                    <div className="nb-user-avatar">
                      {user.image ? <img src={user.image} alt="" /> : <IoPerson />}
                    </div>
                    <div className="nb-user-text">
                      <span className="nb-uname">{user.username}</span>
                      <span className="nb-urole">{user.role}</span>
                    </div>
                  </div>
                ) : (
                  <Link to="/" className="nb-logo" onClick={() => setShowMobileMenu(false)}>
                    <span className="nb-logo-main">ATHIPBURAPA</span>
                    <span className="nb-logo-online">ONLINE</span>
                  </Link>
                )}
              </div>
              <button className="nb-close-drawer" onClick={() => setShowMobileMenu(false)}><IoClose /></button>
            </div>

            <div className="nb-drawer-body">
              {/* Language */}
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Language / ภาษา</span>
                <div className="nb-drawer-langs">
                  <button onClick={() => handleSwitchLang('th')} className={lang === 'th' ? 'active' : ''}>ไทย (TH)</button>
                  <button onClick={() => handleSwitchLang('en')} className={lang === 'en' ? 'active' : ''}>English (EN)</button>
                </div>
              </div>

              {/* Menu */}
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Menu / เมนู</span>
                <Link to="/news" className={`nb-drawer-item ${isAllActive ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                  {t('nav_allNews') || 'ข่าวทั้งหมด'}
                </Link>
                <Link to="/videos" className={`nb-drawer-item video-highlight ${isVideoActive ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                  <IoVideocamOutline /> {lang === 'en' ? 'All Videos' : 'วิดีโอทั้งหมด'}
                </Link>
              </div>

              {/* Categories */}
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Categories / หมวดหมู่</span>
                <div className="nb-drawer-grid">
                  {categories.map((cat, i) => (
                    <Link
                      key={cat._id}
                      to={`/news/category/${encodeURIComponent(cat.name)}`}
                      className={`nb-drawer-grid-item ${activeCat === cat.name ? 'active' : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {displayCats[i] || cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin */}
              {user?.role === 'admin' && (
                <div className="nb-drawer-section admin-tint">
                  <span className="nb-drawer-label">Admin Settings</span>
                  <Link to="/admin" className="nb-drawer-item" onClick={() => setShowMobileMenu(false)}>
                    <IoSettingsOutline /> จัดการข่าวสาร
                  </Link>
                  <Link to="/admin/videos" className="nb-drawer-item" onClick={() => setShowMobileMenu(false)}>
                    <IoVideocamOutline /> จัดการวิดีโอ
                  </Link>
                </div>
              )}
            </div>

            {user && (
              <div className="nb-drawer-footer">
                <button className="nb-drawer-logout" onClick={handleLogout}>
                  <IoLogOut /> {t('nav_logout') || 'ออกจากระบบ'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;