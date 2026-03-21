import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoPerson, IoSettingsOutline, IoMenu, IoClose, IoLogOut, IoVideocamOutline,
         IoSearchOutline, IoTimeOutline, IoTrendingUpOutline, IoNewspaperOutline,
         IoGridOutline } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import { categoryAPI, newsAPI } from '../services/api';
import { translateBatch } from '../services/translationService';
import './Navbar.css';

const RECENT_KEY = 'nb_recent_searches';
const MAX_RECENT = 5;

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, switchLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu]     = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch]         = useState(false);
  const [searchTerm, setSearchTerm]         = useState('');
  const [suggestions, setSuggestions]       = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [categories, setCategories]         = useState([]);
  const [displayCats, setDisplayCats]       = useState([]);

  const searchRef   = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      setRecentSearches(stored);
    } catch { setRecentSearches([]); }
  }, []);

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

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setSuggestions([]);
    }
  }, [showSearch]);

  const fetchSuggestions = useCallback(async (term) => {
    if (!term.trim() || term.length < 2) { setSuggestions([]); return; }
    setSearchLoading(true);
    try {
      const res = await newsAPI.getAll({ search: term });
      setSuggestions((res.data || []).slice(0, 6));
    } catch { setSuggestions([]); }
    finally { setSearchLoading(false); }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const saveRecent = (term) => {
    if (!term.trim()) return;
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const updated = [term, ...prev.filter(s => s !== term)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    saveRecent(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowSearch(false);
    setShowMobileMenu(false);
  };

  const handleSuggestionClick = (item) => {
    saveRecent(item.title);
    navigate(`/news/${item._id}`);
    setShowSearch(false);
  };

  const handleRecentClick = (term) => {
    setSearchTerm(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowSearch(false);
  };

  const removeRecent = (e, term) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };

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

  const path = location.pathname;
  const isAllActive   = path === '/news';
  const isVideoActive = path === '/videos';
  const activeCat = path.startsWith('/news/category/')
    ? decodeURIComponent(path.split('/news/category/')[1])
    : null;

  const showSuggestions = searchTerm.length >= 2;
  const showRecent      = !showSuggestions && recentSearches.length > 0;

  return (
    <>
      <nav className="nb-root">
        {/* ══════════════ TOP BAR ══════════════ */}
        <div className="nb-top">
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
                      <IoPerson /> {t('nav_profile') || 'แก้ไขโปรไฟล์'}
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        {/* ✅ ภาพรวมระบบ */}
                        <Link to="/admin/overview" onClick={() => setShowUserMenu(false)}>
                          <IoGridOutline /> ภาพรวมระบบ
                        </Link>
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

        {/* ══════════════ CATEGORY BAR ══════════════ */}
        <div className="nb-cats-bar">
          <Link to="/news" className={`nb-cat-link${isAllActive ? ' active' : ''}`}>🏠</Link>
          {categories.map((cat, i) => (
            <Link key={cat._id} to={`/news/category/${encodeURIComponent(cat.name)}`}
              className={`nb-cat-link${activeCat === cat.name ? ' active' : ''}`}>
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
            <div className="nb-search-box">
              <div className="nb-search-input-row">
                <IoSearchOutline className="nb-search-icon-left" />
                <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex' }}>
                  <input
                    ref={searchRef}
                    type="text"
                    className="nb-search-input"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
                    placeholder={lang === 'en' ? 'Search news, categories...' : 'ค้นหาข่าว, หมวดหมู่...'}
                  />
                </form>
                {searchTerm && (
                  <button className="nb-search-clear" onClick={() => { setSearchTerm(''); setSuggestions([]); searchRef.current?.focus(); }}>
                    <IoClose />
                  </button>
                )}
                <button className="nb-search-close-btn" onClick={() => setShowSearch(false)}>
                  <IoClose />
                </button>
              </div>

              <div className="nb-search-divider" />

              {showSuggestions && (
                <div className="nb-search-results">
                  {searchLoading ? (
                    <div className="nb-search-loading">
                      <span className="nb-search-spinner" />
                      <span>กำลังค้นหา...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <>
                      <p className="nb-search-section-label">
                        <IoNewspaperOutline /> ผลการค้นหา
                      </p>
                      {suggestions.map(item => (
                        <div key={item._id} className="nb-suggestion-item" onClick={() => handleSuggestionClick(item)}>
                          <div className="nb-suggestion-img">
                            {item.image
                              ? <img src={item.image} alt="" />
                              : <IoNewspaperOutline />}
                          </div>
                          <div className="nb-suggestion-text">
                            <span className="nb-suggestion-title">{item.title}</span>
                            {item.category?.name && (
                              <span className="nb-suggestion-cat">{item.category.name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      <button className="nb-search-all-btn" onClick={handleSearch}>
                        ดูผลลัพธ์ทั้งหมดสำหรับ "{searchTerm}"
                      </button>
                    </>
                  ) : (
                    <div className="nb-search-empty">
                      <IoSearchOutline />
                      <p>ไม่พบข่าวที่เกี่ยวกับ "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              )}

              {showRecent && (
                <div className="nb-search-results">
                  <p className="nb-search-section-label">
                    <IoTimeOutline /> ค้นหาล่าสุด
                  </p>
                  {recentSearches.map(term => (
                    <div key={term} className="nb-recent-item" onClick={() => handleRecentClick(term)}>
                      <IoTimeOutline className="nb-recent-icon" />
                      <span>{term}</span>
                      <button className="nb-recent-remove" onClick={(e) => removeRecent(e, term)}>
                        <IoClose />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!showSuggestions && !showRecent && (
                <div className="nb-search-hint">
                  <IoTrendingUpOutline />
                  <p>{lang === 'en' ? 'Search by title, content or category' : 'ค้นหาด้วยชื่อข่าว เนื้อหา หรือหมวดหมู่'}</p>
                </div>
              )}
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
                      {user.profileImage || user.image
                        ? <img src={user.profileImage || user.image} alt="" />
                        : <IoPerson />}
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
              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Language / ภาษา</span>
                <div className="nb-drawer-langs">
                  <button onClick={() => handleSwitchLang('th')} className={lang === 'th' ? 'active' : ''}>ไทย (TH)</button>
                  <button onClick={() => handleSwitchLang('en')} className={lang === 'en' ? 'active' : ''}>English (EN)</button>
                </div>
              </div>

              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Menu / เมนู</span>
                <Link to="/news" className={`nb-drawer-item ${isAllActive ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                  {t('nav_allNews') || 'ข่าวทั้งหมด'}
                </Link>
                <Link to="/videos" className={`nb-drawer-item video-highlight ${isVideoActive ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                  <IoVideocamOutline /> {lang === 'en' ? 'All Videos' : 'วิดีโอทั้งหมด'}
                </Link>
              </div>

              <div className="nb-drawer-section">
                <span className="nb-drawer-label">Categories / หมวดหมู่</span>
                <div className="nb-drawer-grid">
                  {categories.map((cat, i) => (
                    <Link key={cat._id} to={`/news/category/${encodeURIComponent(cat.name)}`}
                      className={`nb-drawer-grid-item ${activeCat === cat.name ? 'active' : ''}`}
                      onClick={() => setShowMobileMenu(false)}>
                      {displayCats[i] || cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="nb-drawer-section admin-tint">
                  <span className="nb-drawer-label">Admin Settings</span>
                  {/* ✅ ภาพรวมระบบ */}
                  <Link to="/admin/overview" className="nb-drawer-item" onClick={() => setShowMobileMenu(false)}>
                    <IoGridOutline /> ภาพรวมระบบ
                  </Link>
                  <Link to="/admin" className="nb-drawer-item" onClick={() => setShowMobileMenu(false)}>
                    <IoSettingsOutline /> จัดการข่าวสาร
                  </Link>
                  <Link to="/admin/videos" className="nb-drawer-item" onClick={() => setShowMobileMenu(false)}>
                    <IoVideocamOutline /> จัดการวิดีโอ
                  </Link>
                </div>
              )}

              {user && (
                <div className="nb-drawer-section">
                  <span className="nb-drawer-label">บัญชีของฉัน</span>
                  <Link to="/profile" className={`nb-drawer-item ${path === '/profile' ? 'active' : ''}`}
                    onClick={() => setShowMobileMenu(false)}>
                    <IoPerson /> {t('nav_profile') || 'แก้ไขโปรไฟล์'}
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