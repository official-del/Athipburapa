import React, { useState, useEffect, useRef } from 'react';
import { IoPerson, IoSettingsOutline, IoMenu, IoClose, IoLogOut } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/Languagecontext';
import { categoryAPI } from '../services/api';
import { translateBatch } from '../services/translationService';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, switchLang, t } = useLanguage(); // นำ switchLang มาใช้แก้ปัญหาปุ่มกด
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [displayCats, setDisplayCats] = useState([]); 
  
  const searchRef = useRef(null);
  const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';

  // 1. Fetch Categories จาก DB ครั้งเดียว
  useEffect(() => {
    categoryAPI.getAll()
      .then(res => {
        setCategories(res.data);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // 2. Logic การแปลภาษาที่รองรับการสลับกลับเป็น TH แบบ Real-time
  useEffect(() => {
    const updateNames = async () => {
      if (categories.length === 0) return;
      
      const rawNames = categories.map(c => c.name);

      if (lang === 'en') {
        // ถ้าเป็น EN ให้ไปเรียก Google Translate API
        const translated = await translateBatch(rawNames, { from: 'th', to: 'en' });
        setDisplayCats(translated);
      } else {
        // ถ้าเป็น TH ให้คืนค่าดั้งเดิมจาก DB ทันที (แก้ปัญหาค้างเป็นภาษาอังกฤษ)
        setDisplayCats(rawNames);
      }
    };

    updateNames();
  }, [lang, categories]);

  // ฟังก์ชันสลับภาษาที่ถูกต้อง
  const handleSwitchLang = (newLang) => {
    switchLang(newLang); // อัปเดต State ใน Context
    setShowMobileMenu(false); // ปิดเมนูมือถือถ้ามีการกดเปลี่ยน
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
  const isAllActive = path === '/news';
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
            {/* แก้ไขปุ่มสลับภาษา: ใช้ handleSwitchLang แทน navigate */}
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
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}><IoPerson /> {t('nav_profile')}</Link>
                    <button onClick={handleLogout}><IoLogOut /> {t('nav_logout')}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nb-login-btn"><IoPerson /> <span>{t('nav_login')}</span></Link>
            )}
          </div>
        </div>

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
        </div>
      </nav>

      {/* Mobile Drawer */}
      {showMobileMenu && (
        <>
          <div className="nb-drawer-backdrop" onClick={() => setShowMobileMenu(false)} />
          <div className="nb-drawer">
             {/* ส่วน Lang Switcher ใน Drawer */}
             <div className="nb-drawer-lang">
                <div className="nb-lang-switcher">
                  <button onClick={() => handleSwitchLang('th')} className={lang === 'th' ? 'active' : ''}>TH</button>
                  <button onClick={() => handleSwitchLang('en')} className={lang === 'en' ? 'active' : ''}>EN</button>
                </div>
             </div>
             <div className="nb-drawer-links">
               {categories.map((cat, i) => (
                 <Link key={cat._id} to={`/news/category/${encodeURIComponent(cat.name)}`} className="nb-drawer-cat">
                   {displayCats[i] || cat.name}
                 </Link>
               ))}
             </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;