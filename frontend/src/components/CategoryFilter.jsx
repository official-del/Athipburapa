import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/Languagecontext';
import './CategoryFilter.css';

function CategoryFilter({ categories, selectedCategory, onSelectCategory, news = [] }) {
  const { t, lang } = useLanguage();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (lang === 'en') {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
  };

  const getCatName = (cat) => {
    const name = cat && typeof cat === 'object' ? cat.name || '' : cat || '';
    return t(name);
  };

  const fmtViews = (n) => {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <div className="cf-root">

      {/* ── Page Title ── */}
      <div className="cf-page-title">
        <p className="cf-title-eyebrow">
          <span>{lang === 'en' ? 'Latest News' : 'ข่าวสาร'}</span>
        </p>
        <h1 className="cf-page-title-text">{t('cf_title')}</h1>
        <div className="cf-page-title-line" />
      </div>

      {/* ── Filter Pills ── */}
      <div className="cf-pills">
        <button
          className={`cf-pill ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelectCategory('')}
        >
          <span>{t('cf_all')}</span>
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`cf-pill ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            <span>{t(category)}</span>
          </button>
        ))}
      </div>

      {/* ── News Grid ── */}
      {news.length > 0 ? (
        <div className="cf-grid">
          {news.map((item, index) => (
            <Link
              to={`/news/${item._id}`}
              key={item._id}
              className="cf-card"
              style={{ animationDelay: `${(index % 6) * 0.07}s` }}
            >
              {/* Image */}
              <div className="cf-card-img-wrap">
                <img
                  src={item.image || item.thumbnail}
                  alt={item.title}
                  className="cf-card-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.png';
                  }}
                />
                <div className="cf-card-img-overlay">
                  {item.category && (
                    <span className="cf-card-cat">
                      {getCatName(item.category)}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="cf-card-body">
                <p className="cf-card-title">{item.title}</p>
                <div className="cf-card-footer">
                  <span className="cf-card-date">{formatDate(item.createdAt)}</span>
                  <span className="cf-card-views">
                    👁 {fmtViews(item.views)} {t('popular_views')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="cf-empty">
          <span className="cf-empty-icon">📰</span>
          <p className="cf-empty-text">{t('cf_noNews')}</p>
        </div>
      )}

    </div>
  );
}

export default CategoryFilter;