import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoLogoFacebook, IoLogoTiktok, IoLogoInstagram, IoLogoYoutube, IoGlobeOutline } from "react-icons/io5";
import { categoryAPI } from '../services/api';
import { useLanguage } from '../context/Languagecontext';
import './Footer.css';

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    categoryAPI.getAll()
      .then(res => setCategories(res.data))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  return (
    <footer className="ft-root">
      <div className="ft-main">
        <div className="ft-inner">

          {/* หมวดหมู่ */}
          <div className="ft-col">
            <h4 className="ft-col-title">{t('footer_categories')}</h4>
            <div className="ft-links">
              {categories.length > 0 ? (
                categories.map(cat => (
                  <Link key={cat._id} to={`/news/category/${encodeURIComponent(cat.name)}`}>
                    {cat.name}
                  </Link>
                ))
              ) : (
                <span className="ft-loading-text">{t('cn_loading')}</span>
              )}
            </div>
          </div>

          {/* เกี่ยวกับเรา */}
          <div className="ft-col">
            <h4 className="ft-col-title">{t('footer_aboutUs')}</h4>
            <div className="ft-links">
              <Link to="/about">{t('footer_aboutLink')}</Link>
              <Link to="/contact">{t('footer_contactLink')}</Link>
              <Link to="/privacy">{t('footer_privacyLink')}</Link>
              <Link to="/terms">{t('footer_termsLink')}</Link>
            </div>
          </div>

          {/* ติดตามเราได้ที่ */}
          <div className="ft-col ft-col-social">
            <h4 className="ft-col-title">{t('footer_followUs')}</h4>
            <div className="ft-social">
              <a href="https://web.facebook.com/Athipburapa.news?locale=th_TH" target="_blank" rel="noreferrer" aria-label="Facebook">
                <IoLogoFacebook />
              </a>
              <a href="#" aria-label="TikTok"><IoLogoTiktok /></a>
              <a href="#" aria-label="Instagram"><IoLogoInstagram /></a>
              <a href="#" aria-label="YouTube"><IoLogoYoutube /></a>
              <a href="#" aria-label="Website"><IoGlobeOutline /></a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="ft-bottom">
        <div className="ft-bottom-inner">
          <div className="ft-bottom-links">
            <span className="ft-bottom-label">{t('footer_aboutLabel')}</span>
            <Link to="/about">{t('footer_aboutLink')}</Link>
            <Link to="/contact">{t('footer_contactLink')}</Link>
            <Link to="/privacy">{t('footer_privacyLink')}</Link>
            <Link to="/terms">{t('footer_termsLink')}</Link>
          </div>
          <p className="ft-copyright">{t('footer_copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;