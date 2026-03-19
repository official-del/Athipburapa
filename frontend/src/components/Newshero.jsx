import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IoChevronBack, IoChevronForward, IoHomeOutline } from 'react-icons/io5';
import { newsAPI, categoryAPI } from '../services/api';
import { useLanguage } from '../context/Languagecontext';
import { translateNewsArray, translateBatch } from '../services/translationService';
import './NewsHero.css';

const NewsHero = ({ currentCategory = '' }) => {
  const { lang, t } = useLanguage();

  const [slides, setSlides]           = useState([]);
  const [sideNews, setSideNews]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [dispSlides, setDispSlides]   = useState([]);
  const [dispSide, setDispSide]       = useState([]);
  const [dispCats, setDispCats]       = useState([]);
  const [current, setCurrent]         = useState(0);
  const [loading, setLoading]         = useState(true);
  const [translating, setTranslating] = useState(false);
  const timerRef = useRef(null);

  /* ── Fetch ── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [newsRes, catRes] = await Promise.all([
          newsAPI.getAll({ params: { sort: '-createdAt', limit: 20 } }),
          categoryAPI.getAll(),
        ]);
        const all = Array.isArray(newsRes.data) ? newsRes.data : [];
        setSlides(all.slice(0, 5));
        setSideNews(all.length > 5 ? all.slice(5) : all);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('NewsHero fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── แปลภาษาเมื่อ data โหลดหรือ lang เปลี่ยน ── */
  useEffect(() => {
    if (!slides.length && !categories.length) return;

    if (lang === 'th') {
      setDispSlides(slides);
      setDispSide(sideNews);
      setDispCats(categories.map(c => c.name));
      return;
    }

    let cancelled = false;
    setTranslating(true);

    const doTranslate = async () => {
      try {
        const [tSlides, tSide, tCats] = await Promise.all([
          translateNewsArray(slides, lang),
          translateNewsArray(sideNews, lang),
          translateBatch(categories.map(c => c.name), { from: 'th', to: lang }),
        ]);
        if (!cancelled) {
          setDispSlides(tSlides);
          setDispSide(tSide);
          setDispCats(tCats);
        }
      } catch {
        if (!cancelled) {
          setDispSlides(slides);
          setDispSide(sideNews);
          setDispCats(categories.map(c => c.name));
        }
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    doTranslate();
    return () => { cancelled = true; };
  }, [lang, slides, sideNews, categories]);

  /* ── Auto slide ── */
  useEffect(() => {
    if (dispSlides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % dispSlides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [dispSlides]);

  const goTo = useCallback((idx) => {
    clearInterval(timerRef.current);
    setCurrent(prev => (idx + dispSlides.length) % dispSlides.length);
  }, [dispSlides.length]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (lang === 'en') {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                    'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543} `
      + `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} น.`;
  };

  const getCatName = (cat) =>
    cat && typeof cat === 'object' ? cat.name || '' : cat || '';

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="nh-root">
      <div className="nh-skeleton-title" />
      <div className="nh-skeleton-cats" />
      <div className="nh-body">
        <div className="nh-skeleton-slider" />
        <div className="nh-skeleton-side">
          {[...Array(6)].map((_, i) => <div key={i} className="nh-skeleton-side-item" />)}
        </div>
      </div>
    </div>
  );

  const slide    = dispSlides[current];
  const rawSlide = slides[current];

  return (
    <div className="nh-root">

      {/* ── Translating bar ── */}
      {translating && (
        <div className="nh-translating-bar">
          <span className="nh-translating-dot" />
          <span className="nh-translating-dot" />
          <span className="nh-translating-dot" />
          {lang === 'en' ? 'Translating...' : 'กำลังแปล...'}
        </div>
      )}

      {/* ── Page Title ── */}
      <div className="nh-title-wrap">
        <div className="nh-title-line" />
        <h1 className="nh-title">{lang === 'en' ? 'News' : 'ข่าว'}</h1>
        <div className="nh-title-line" />
      </div>

      {/* ── Breadcrumb ── */}
      <div className="nh-breadcrumb">
        <Link to="/" className="nh-bc-home">
          <IoHomeOutline /> {lang === 'en' ? 'Home' : 'หน้าแรก'}
        </Link>
        <span className="nh-bc-sep">›</span>
        <span className="nh-bc-current">{lang === 'en' ? 'News' : 'ข่าว'}</span>
      </div>

      {/* ── Category Pills ── */}
      <div className="nh-cats">
        <Link to="/news" className={`nh-cat-pill ${!currentCategory ? 'active' : ''}`}>
          {lang === 'en' ? 'All' : 'ทั้งหมด'}
        </Link>
        {categories.map((cat, i) => (
          <Link
            key={cat._id}
            to={`/news/category/${encodeURIComponent(cat.name)}`}
            className={`nh-cat-pill ${currentCategory === cat.name ? 'active' : ''}`}
          >
            {dispCats[i] || cat.name}
          </Link>
        ))}
      </div>

      {/* ── Body ── */}
      {dispSlides.length > 0 && (
        <div className={`nh-body ${translating ? 'nh-fading' : ''}`}>

          {/* SLIDER */}
          <div className="nh-slider">
            <Link to={`/news/${rawSlide?._id}`} className="nh-slide">
              <div className="nh-slide-img-wrap">
                <img
                  src={rawSlide?.image || rawSlide?.thumbnail}
                  alt={slide?.title}
                  className="nh-slide-img"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
                />
                <div className="nh-slide-overlay" />
              </div>
              <div className="nh-slide-body">
                <span className="nh-slide-cat">{getCatName(slide?.category)}</span>
                <h2 className="nh-slide-title">{slide?.title}</h2>
                <span className="nh-slide-date">{formatDateTime(rawSlide?.createdAt)}</span>
              </div>
            </Link>

            <button className="nh-arrow left"  onClick={() => goTo(current - 1)} aria-label="prev"><IoChevronBack /></button>
            <button className="nh-arrow right" onClick={() => goTo(current + 1)} aria-label="next"><IoChevronForward /></button>

            <div className="nh-dots">
              {dispSlides.map((_, i) => (
                <button key={i} className={`nh-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} />
              ))}
            </div>

            {/* slide counter */}
            <div className="nh-slide-counter">
              {current + 1} / {dispSlides.length}
            </div>
          </div>

          {/* SIDE NEWS */}
          <div className="nh-side">
            <div className="nh-side-header">
              <span className="nh-side-header-dot" />
              {lang === 'en' ? 'Latest News' : 'ข่าวล่าสุด'}
            </div>
            {dispSide.map((item, i) => (
              <Link to={`/news/${slides[i + 5]?._id || slides[i]?._id}`} key={item._id || i} className="nh-side-item">
                <div className="nh-side-img-wrap">
                  <img
                    src={slides[i + 5]?.image || slides[i + 5]?.thumbnail || slides[i]?.image}
                    alt={item.title}
                    className="nh-side-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
                  />
                </div>
                <div className="nh-side-content">
                  <p className="nh-side-title">{item.title}</p>
                  <div className="nh-side-meta">
                    <span className="nh-side-cat">{getCatName(item.category)}</span>
                    <span className="nh-side-date">{formatDateTime(sideNews[i]?.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default NewsHero;