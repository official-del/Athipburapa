import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IoArrowBack, IoHomeOutline } from 'react-icons/io5';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { useLanguage } from '../context/Languagecontext';
import { useTranslatedNews } from '../hooks/useTranslatedNews';
import '../css/CategoryNews.css';

function CategoryNews() {
  const { categoryName }  = useParams();
  const [rawNews, setRawNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, lang }           = useLanguage();

  /* แปล news array อัตโนมัติ */
  const { data: news, translating } = useTranslatedNews(rawNews);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const [newsRes, catRes] = await Promise.all([
          api.get('/news'),
          api.get('/categories'),
        ]);
        const target = catRes.data.find(c => c.name.trim() === categoryName.trim());
        if (Array.isArray(newsRes.data)) {
          const filtered = target
            ? newsRes.data.filter(n => (n.category?._id || n.category) === target._id)
            : newsRes.data.filter(n => (n.category?.name || n.category) === categoryName);
          setRawNews(filtered);
        }
      } catch (err) {
        console.error('CategoryNews error:', err);
        setRawNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    window.scrollTo(0, 0);
  }, [categoryName]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (lang === 'en') {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  return (
    <div className="cn-root">
      <Navbar />

      {/* ── HERO BAR ── */}
      <div className="cn-hero-bar">
        <div className="cn-hero-inner">
          <div className="cn-breadcrumb">
            <Link to="/" className="cn-bc-link"><IoHomeOutline /> {t('nd_home')}</Link>
            <span className="cn-bc-sep">›</span>
            <Link to="/news" className="cn-bc-link">{t('nd_news')}</Link>
            <span className="cn-bc-sep">›</span>
            <span className="cn-bc-current">{categoryName}</span>
          </div>
          <div className="cn-hero-title-row">
            <div>
              <p className="cn-hero-label">{t('cn_category')}</p>
              <h1 className="cn-hero-title">{categoryName}</h1>
            </div>
          </div>
          <Link to="/news" className="cn-back-btn">
            <IoArrowBack /> {t('cn_backAll')}
          </Link>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="cn-container">

        {!loading && (
          <div className="cn-stats-bar">
            <span className="cn-stats-text">
              {t('cn_found')} <strong>{news.length}</strong> {t('cn_foundSuffix')} "{categoryName}"
            </span>
            {translating && (
              <span className="cn-translating">
                <span className="cn-translating-spinner" /> Translating...
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="cn-loading">
            <div className="cn-loading-bars"><span /><span /><span /><span /></div>
            <p>{t('cn_loading')}</p>
          </div>
        ) : news.length > 0 ? (
          <div className={`cn-grid ${translating ? 'cn-fading' : ''}`}>
            {news.map((item, index) => (
              <Link
                to={`/news/${item._id}`}
                key={item._id}
                className="cn-card"
                style={{ animationDelay: `${(index % 9) * 0.06}s` }}
              >
                <div className="cn-card-img-wrap">
                  <img
                    src={item.image || item.thumbnail}
                    alt={item.title}
                    className="cn-card-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
                  />
                  <div className="cn-card-overlay">
                    <span className="cn-card-cat">{categoryName}</span>
                  </div>
                </div>
                <div className="cn-card-body">
                  <p className="cn-card-title">{item.title}</p>
                  <div className="cn-card-footer">
                    <span className="cn-card-date">{formatDate(item.createdAt)}</span>
                    <span className="cn-card-views">👁 {item.views || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="cn-empty">
            <div className="cn-empty-icon">📭</div>
            <h3>{t('cn_empty')} "{categoryName}"</h3>
            <p>{t('cn_emptyDesc')}</p>
            <Link to="/news" className="cn-empty-btn">
              <IoArrowBack /> {t('cn_emptyBtn')}
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default CategoryNews;