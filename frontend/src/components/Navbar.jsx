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
        const translated = await translateBatch(rawNames, { from: 'th', to: 'en' });
        setDisplayCats(translated);
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
        <div className="nb-top">
          <div className="nb-left">
            <button className="nb-icon-btn" onClick={() => setShowMobileMenu(true)}>
              <IoMenu />
            </button>
          </div>

          <div className="nb-center">
            <Link to="/" className="nb-logo">Athip<span>burapa</span></Link>
          </div>

          <div className="nb-right">
            <div className="nb-lang-switcher">
              <button 
                className={`nb-lang-btn${lang === 'th' ? ' active' : ''}`} 
                onClick={() => handleSwitchLang('th')}
              >TH</button>
              <button 
                className={`nb-lang-btn${lang === 'en' ? ' active' : ''}`} 
                onClick={() => handleSwitchLang('en')}
              >EN</button>
            </div>
            
            <button className="nb-icon-btn" onClick={() => setShowSearch(true)}><CiSearch /></button>

            {user ? (
              <div className="nb-profile-wrap">
                <div className="nb-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                  {user.profileImage || user.image ? (
                    <img src={user.profileImage || user.image} alt="Profile" />
                  ) : <IoPerson />}
                </div>

                {showUserMenu && (
                  <div className="nb-dropdown">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                      <IoPerson /> {t('nav_profile')}
                    </Link>

                    {user.role === 'admin' && (
                      <>
                        <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                          <IoSettingsOutline /> {t('nav_admin') || 'จัดการข่าวสาร'}
                        </Link>
                        <Link to="/admin/videos" onClick={() => setShowUserMenu(false)}>
                          <IoVideocamOutline /> จัดการวิดีโอ
                        </Link>
                      </>
                    )}

                    <button onClick={handleLogout} className="nb-logout-item">
                      <IoLogOut /> {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nb-login-btn"><IoPerson /> <span>{t('nav_login')}</span></Link>
            )}
          </div>
        </div>

        {/* ── Category Bar (Desktop) ── */}
        <div className="nb-cats">
          <Link to="/news" className={`nb-cat-link${isAllActive ? ' active' : ''}`}>
            {t('nav_allNews')}
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
          <Link
            to="/videos"
            className={`nb-cat-link nb-cat-video${isVideoActive ? ' active' : ''}`}
          >
            <IoVideocamOutline className="nb-video-icon" />
            {lang === 'en' ? 'Videos' : 'วิดีโอ'}
          </Link>
        </div>
      </nav>

      {/* Search Overlay */}
      {showSearch && (
        <>
          <div className="nb-drawer-backdrop" onClick={() => setShowSearch(false)} />
          <div className="nb-search-overlay">
            <div className="nb-search-box">
              <form onSubmit={handleSearch}>
                <input
                  ref={searchRef}
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('nav_searchPlaceholder') || 'ค้นหาข่าว...'}
                />
                <button type="submit"><CiSearch /></button>
              </form>
              <button className="nb-search-close-btn" onClick={() => setShowSearch(false)}><IoClose /></button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Drawer (ส่วนที่ Redesign ใหม่) */}
      {showMobileMenu && (
        <>
          <div className="nb-drawer-backdrop" onClick={() => setShowMobileMenu(false)} />
          <div className="nb-drawer">
            <div className="nb-drawer-header">
              <Link to="/" className="nb-logo" onClick={() => setShowMobileMenu(false)}>Athip<span>burapa</span></Link>
              <button className="nb-icon-btn" onClick={() => setShowMobileMenu(false)}><IoClose /></button>
            </div>

            <div className="nb-drawer-content">
              {/* Language Switcher */}
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Language</span>
                <div className="nb-lang-switcher full-width">
                  <button onClick={() => handleSwitchLang('th')} className={lang === 'th' ? 'active' : ''}>TH</button>
                  <button onClick={() => handleSwitchLang('en')} className={lang === 'en' ? 'active' : ''}>EN</button>
                </div>
              </div>

              {/* Main Links */}
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Menu</span>
                <Link to="/news" className={`nb-drawer-item ${isAllActive ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                  {t('nav_allNews')}
                </Link>
                <Link to="/videos" className={`nb-drawer-item video-item ${isVideoActive ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                  <IoVideocamOutline /> {lang === 'en' ? 'Videos' : 'วิดีโอทั้งหมด'}
                </Link>
              </div>

              {/* Categories Grid */}
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Categories</span>
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

              {/* Admin Panel (ธีมเดียวกับ Sidebar - ไม่มีเส้นใต้) */}
              {user?.role === 'admin' && (
                <div className="nb-drawer-section admin-group">
                  <span className="nb-drawer-label">Admin Panel</span>
                  <Link to="/admin" className="nb-drawer-item admin-link" onClick={() => setShowMobileMenu(false)}>
                    <IoSettingsOutline /> {t('nav_admin') || 'จัดการข่าวสาร'}
                  </Link>
                  <Link to="/admin/videos" className="nb-drawer-item admin-link" onClick={() => setShowMobileMenu(false)}>
                    <IoVideocamOutline /> จัดการวิดีโอ
                  </Link>
                </div>
              )}
            </div>

            {user && (
              <div className="nb-drawer-footer">
                <button className="nb-drawer-logout-btn" onClick={handleLogout}>
                  <IoLogOut /> {t('nav_logout')}
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