import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../services/api.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhotoAlbum from '../components/PhotoAlbum';
import CommentSection from '../components/CommentSection';
import ShareButtons from '../components/ShareButtons';
import ShareButtons from '../components/ShareButtons';     // ✅ เพิ่ม import
import { HiOutlineCalendar, HiOutlineEye } from "react-icons/hi";
import { IoArrowBack, IoChevronForward,
         IoPlayCircle, IoPauseCircle, IoStopCircle,
         IoVolumeHigh } from "react-icons/io5";
import { useLanguage } from '../context/Languagecontext';
import '../css/NewsDetail.css';

const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

function NewsDetail() {
  const { id }   = useParams();
  const { t, lang, translateDetail } = useLanguage();

  const [news, setNews]                     = useState(null);
  const [displayNews, setDisplayNews]       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [translating, setTranslating]       = useState(false);
  const [error, setError]                   = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  /* TTS */
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPaused, setTtsPaused]   = useState(false);
  const [ttsSupport, setTtsSupport] = useState(false);
  const [ttsRate, setTtsRate]       = useState(1);
  const uttRef = useRef(null);

  useEffect(() => {
    setTtsSupport('speechSynthesis' in window);
    return () => window.speechSynthesis.cancel();
  }, []);

  /* ── Fetch news ── */
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get(`/news/${id}`);
        if (response.data) setNews(response.data);
        else throw new Error('No data returned');
      } catch (err) {
        console.error('NewsDetail fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    window.scrollTo(0, 0);
    return () => {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      setTtsPaused(false);
    };
  }, [id]);

  /* ── แปลเมื่อ news โหลดเสร็จ หรือ lang เปลี่ยน ── */
  useEffect(() => {
    if (!news) return;
    if (lang === 'th') {
      setDisplayNews(news);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    translateDetail(news).then(translated => {
      if (!cancelled) {
        setDisplayNews(translated);
        setTranslating(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setDisplayNews(news);
        setTranslating(false);
      }
    });
    return () => { cancelled = true; };
  }, [news, lang]);

  /* ── Scroll progress ── */
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop    = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── TTS ── */
  const ttsPlay = useCallback(() => {
    if (!displayNews) return;
    window.speechSynthesis.cancel();
    const text  = `${displayNews.title}. ${stripHtml(displayNews.content || '')}`;
    const utt   = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (lang === 'en') {
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utt.voice = enVoice;
      utt.lang = 'en-US';
    } else {
      const thVoice = voices.find(v => v.lang === 'th-TH') || voices.find(v => v.lang.startsWith('th'));
      if (thVoice) utt.voice = thVoice;
      utt.lang = 'th-TH';
    }
    utt.rate  = ttsRate;
    utt.pitch = 1;
    utt.onstart  = () => { setTtsPlaying(true);  setTtsPaused(false); };
    utt.onpause  = () => { setTtsPaused(true); };
    utt.onresume = () => { setTtsPaused(false); };
    utt.onend    = () => { setTtsPlaying(false); setTtsPaused(false); };
    utt.onerror  = () => { setTtsPlaying(false); setTtsPaused(false); };
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [displayNews, ttsRate, lang]);

  const ttsPause  = () => { if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) { window.speechSynthesis.pause(); setTtsPaused(true); } };
  const ttsResume = () => { if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setTtsPaused(false); } };
  const ttsStop   = () => { window.speechSynthesis.cancel(); setTtsPlaying(false); setTtsPaused(false); };
  const handleRateChange = (newRate) => {
    setTtsRate(newRate);
    if (ttsPlaying) { ttsStop(); setTimeout(() => ttsPlay(), 100); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="nd-root">
      <Navbar />
      <div className="nd-loading">
        <div className="nd-loading-bars"><span /><span /><span /><span /></div>
        <p>{t('nd_loading')}</p>
      </div>
      <Footer />
    </div>
  );

  if (error || !news) return (
    <div className="nd-root">
      <Navbar />
      <div className="nd-notfound">
        <div className="nd-notfound-code">404</div>
        <h2>{t('nd_notFound')}</h2>
        <Link to="/news" className="nd-back-home">
          <IoArrowBack /> {t('nd_notFoundBack')}
        </Link>
      </div>
      <Footer />
    </div>
  );

  const d            = displayNews || news;
  const categoryLabel = d.category?.name || d.category || t('nd_news');
  const safeContent   = DOMPurify.sanitize(d.content || '');
  const formattedDate = news.createdAt
    ? new Date(news.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : (news.date || (lang === 'en' ? 'Unknown date' : 'ไม่ระบุวันที่'));

  const albumImages = Array.isArray(news.albumImages) ? news.albumImages : [];

  return (
    <div className="nd-root">
      <div className="nd-progress-bar" style={{ width: `${scrollProgress}%` }} />
      <Navbar />

      {translating && (
        <div className="nd-translating-bar">
          <span className="nd-translating-spinner" />
          Translating article...
        </div>
      )}

      <main className={`nd-main ${translating ? 'nd-fading' : ''}`}>

        {/* ── HERO ── */}
        <div className="nd-hero">
          <div className="nd-hero-img-wrap">
            <img
              src={news.image || news.thumbnail}
              alt={d.title}
              className="nd-hero-img"
              onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
            />
            <div className="nd-hero-vignette" />
          </div>
          <Link to="/news" className="nd-hero-back">
            <IoArrowBack /> {t('nd_back')}
          </Link>
          <div className="nd-hero-body">
            <span className="nd-cat-pill">{categoryLabel}</span>
            <h1 className="nd-title">{d.title}</h1>
            <div className="nd-meta">
              <span className="nd-meta-item"><HiOutlineCalendar /> {formattedDate}</span>
              <span className="nd-meta-dot" />
              <span className="nd-meta-item">
                <HiOutlineEye /> {(news.views || 0).toLocaleString()} {t('nd_views')}
              </span>
            </div>
          </div>
        </div>

        {/* ── ARTICLE CARD ── */}
        <div className="nd-card-wrap">
          <div className="nd-card">

            {/* Breadcrumb */}
            <div className="nd-breadcrumb">
              <Link to="/">{t('nd_home')}</Link>
              <IoChevronForward className="nd-bc-arrow" />
              <Link to="/news">{t('nd_news')}</Link>
              <IoChevronForward className="nd-bc-arrow" />
              <span className="nd-bc-current">{categoryLabel}</span>
            </div>
            <div className="nd-card-divider" />

            {/* TTS */}
            {ttsSupport && (
              <div className={`nd-tts-bar ${ttsPlaying ? 'nd-tts-active' : ''}`}>
                <div className="nd-tts-left">
                  <IoVolumeHigh className="nd-tts-icon" />
                  <div>
                    <p className="nd-tts-label">{t('nd_tts_listen')}</p>
                    <p className="nd-tts-sublabel">
                      {ttsPlaying
                        ? ttsPaused ? t('nd_tts_paused') : t('nd_tts_reading')
                        : t('nd_tts_idle')}
                    </p>
                  </div>
                </div>
                <div className="nd-tts-center">
                  {!ttsPlaying ? (
                    <button className="nd-tts-btn play" onClick={ttsPlay} title="เล่น"><IoPlayCircle /></button>
                  ) : ttsPaused ? (
                    <button className="nd-tts-btn play" onClick={ttsResume}><IoPlayCircle /></button>
                  ) : (
                    <button className="nd-tts-btn pause" onClick={ttsPause}><IoPauseCircle /></button>
                  )}
                  {ttsPlaying && (
                    <button className="nd-tts-btn stop" onClick={ttsStop}><IoStopCircle /></button>
                  )}
                  {ttsPlaying && !ttsPaused && (
                    <div className="nd-tts-wave">
                      <span /><span /><span /><span /><span />
                    </div>
                  )}
                </div>
                <div className="nd-tts-right">
                  <span className="nd-tts-speed-label">{t('nd_tts_speed')}</span>
                  <div className="nd-tts-speeds">
                    {[0.75, 1, 1.25, 1.5].map(r => (
                      <button
                        key={r}
                        className={`nd-tts-speed ${ttsRate === r ? 'active' : ''}`}
                        onClick={() => handleRateChange(r)}
                      >{r}×</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Article body */}
            <article className="nd-body" dangerouslySetInnerHTML={{ __html: safeContent }} />

            {/* ── PHOTO ALBUM ── */}
            {albumImages.length > 0 && (
              <PhotoAlbum images={albumImages} title={d.title} />
            )}

            {/* Footer */}
            <div className="nd-card-footer">
              <Link to="/news" className="nd-footer-btn">
                <IoArrowBack /><span>{t('nd_backAll')}</span>
              </Link>
              <div className="nd-footer-views">
                <HiOutlineEye />
                <span>{(news.views || 0).toLocaleString()} {t('nd_viewCount')}</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── SHARE + COMMENT ── */}
        {news._id && (
          <div className="nd-card-wrap">
            <div className="nd-card">
              <ShareButtons title={d.title} url={window.location.href} />
              <CommentSection newsId={news._id} />
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default NewsDetail;