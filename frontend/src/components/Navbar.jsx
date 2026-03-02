import React, { useState, useEffect, useRef } from 'react';
import { IoPerson, IoSettingsOutline, IoMenu, IoClose, IoLogOut } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import { categoryAPI } from '../services/api';
import { translateBatch } from '../services/translationService'; // นำเข้า Service แปลภาษา
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State สำหรับเก็บหมวดหมู่ต้นฉบับ และหมวดหมู่ที่แปลแล้ว
  const [categories, setCategories] = useState([]);
  const [displayCats, setDisplayCats] = useState([]); 
  
  const searchRef = useRef(null);
  const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';

  // 1. ดึงข้อมูลหมวดหมู่จาก Database ครั้งเดียวตอนโหลดหน้า
  useEffect(() => {
    categoryAPI.getAll()
      .then(res => {
        setCategories(res.data);
        setDisplayCats(res.data.map(c => c.name)); // ตั้งค่าเริ่มต้นเป็นชื่อไทย
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // 2. แปลภาษา Real-time เมื่อมีการเปลี่ยนภาษา (lang)
  useEffect(() => {
    const translateCategories = async () => {
      if (categories.length === 0) return;
      
      const rawNames = categories.map(c => c.name);
      
      if (lang === 'en') {
        const translated = await translateBatch(rawNames, { from: 'th', to: 'en' });
        setDisplayCats(translated);
      } else {
        // ถ้าเป็นภาษาไทย ให้ใช้ชื่อเดิมจาก DB (ไม่ต้องเรียก API แปล)
        setDisplayCats(rawNames);
      }
    };

    translateCategories();
  }, [lang, categories]); // ทำงานเมื่อเปลี่ยนภาษา หรือเมื่อข้อมูลจาก DB เพิ่งมาถึง

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
  const isAllActive = path === '/news';
  const activeCat = path.startsWith('/news/category/')
    ? decodeURIComponent(path.split('/news/category/')[1])
    : null;

  return (
    <>
      <nav className="nb-root">
        <div className="nb-top">
          <div className="nb-left">
            <button className="nb-icon-btn" onClick={() => setShowMobileMenu(true)} aria-label="Menu">
              <IoMenu />
            </button>
          </div>

          <div className="nb-center">
            <Link to="/" className="nb-logo">Athip<span>burapa</span></Link>
          </div>

          <div className="nb-right">
            {/* Language Switcher เหมือนเดิม */}
            <div className="nb-lang-switcher">
              <button className={`nb-lang-btn${lang === 'th' ? ' active' : ''}`} onClick={() => navigate(location.pathname, { replace: true })}>TH</button>
              {/* หมายเหตุ: ปุ่มเปลี่ยนภาษาปกติจะเรียก switchLang() จาก Context ของคุณ */}
              <button className={`nb-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => navigate(location.pathname, { replace: true })}>EN</button>
            </div>
            
            <button className="nb-icon-btn" onClick={() => setShowSearch(true)}><CiSearch /></button>

            {user ? (
              <div className="nb-profile-wrap">
                <div className="nb-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                  <IoPerson />
                </div>
                {showUserMenu && (
                  <div className="nb-dropdown">
                    <button onClick={handleLogout}><IoLogOut /> {t('nav_logout')}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nb-login-btn"><IoPerson /> <span>{t('nav_login')}</span></Link>
            )}
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
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
              {displayCats[i] || cat.name} {/* แสดงชื่อที่แปลแล้ว */}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer (ทำลักษณะเดียวกัน) */}
      {showMobileMenu && (
        <div className="nb-drawer">
          {/* ... ส่วนหัว drawer ... */}
          <div className="nb-drawer-links">
             {categories.map((cat, i) => (
               <Link key={cat._id} to={`/news/category/${encodeURIComponent(cat.name)}`} className="nb-drawer-cat">
                 {displayCats[i] || cat.name}
               </Link>
             ))}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;