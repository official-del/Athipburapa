import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommentSection from '../components/CommentSection';
import ShareButtons from '../components/ShareButtons';
import {
  IoSearchOutline, IoPlayCircle, IoEyeOutline,
  IoTimeOutline, IoGridOutline, IoListOutline,
  IoChevronBack, IoChevronForward, IoClose,
  IoChatbubbleOutline, IoShareSocialOutline,
} from 'react-icons/io5';
import '../css/VideoPage.css';

const CATEGORIES = ['ทั้งหมด', 'ข่าว', 'กิจกรรม', 'ท่องเที่ยว', 'กีฬา', 'บันเทิง', 'ทั่วไป'];

function fmtDuration(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtViews(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n?.toString() ?? '0';
}

/* ── Lightbox player ── */
function VideoPlayer({ video, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const overlayRef = useRef(null);
  const [tab, setTab] = useState('info'); // 'info' | 'comments' | 'share'

  useEffect(() => {
    setTab('info');
  }, [video._id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape')                onClose();
      if (e.key === 'ArrowLeft'  && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [hasPrev, hasNext]);

  const videoUrl = `${window.location.origin}/videos`;

  return (
    <div className="vp-overlay" ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="vp-box">
        <button className="vp-close" onClick={onClose}><IoClose /></button>

        {hasPrev && (
          <button className="vp-nav vp-nav-prev" onClick={onPrev}><IoChevronBack /></button>
        )}
        {hasNext && (
          <button className="vp-nav vp-nav-next" onClick={onNext}><IoChevronForward /></button>
        )}

        <div className="vp-video-wrap">
          <video key={video._id} controls autoPlay className="vp-video" poster={video.thumbnailUrl}>
            <source src={video.videoUrl} type="video/mp4" />
          </video>
        </div>

        <div className="vp-info">
          <h2 className="vp-title">{video.title}</h2>
          <div className="vp-meta">
            <span className="vp-cat-pill">{video.category}</span>
            <span className="vp-meta-item"><IoEyeOutline /> {fmtViews(video.views)} ครั้ง</span>
            {video.duration > 0 && (
              <span className="vp-meta-item"><IoTimeOutline /> {fmtDuration(video.duration)}</span>
            )}
          </div>

          {/* ── Tab Buttons ── */}
          <div className="vp-action-bar">
            <button
              className={`vp-action-btn ${tab === 'comments' ? 'active' : ''}`}
              onClick={() => setTab(tab === 'comments' ? 'info' : 'comments')}
            >
              <IoChatbubbleOutline /> ความคิดเห็น
            </button>
            <button
              className={`vp-action-btn ${tab === 'share' ? 'active' : ''}`}
              onClick={() => setTab(tab === 'share' ? 'info' : 'share')}
            >
              <IoShareSocialOutline /> แชร์
            </button>
          </div>

          {/* ── Tab: Info ── */}
          {tab === 'info' && (
            <>
              {video.description && <p className="vp-desc">{video.description}</p>}
              {video.tags?.length > 0 && (
                <div className="vp-tags">
                  {video.tags.map(t => <span key={t} className="vp-tag">#{t}</span>)}
                </div>
              )}
            </>
          )}

          {/* ── Tab: Comments — ✅ ใช้ CommentSection เดิม ส่ง videoId ── */}
          {tab === 'comments' && (
            <CommentSection videoId={video._id} />
          )}

          {/* ── Tab: Share — ✅ ใช้ ShareButtons เดิม ── */}
          {tab === 'share' && (
            <ShareButtons title={video.title} url={videoUrl} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Video Card ── */
function VideoCard({ video, onClick, layout }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`vc-card ${layout === 'list' ? 'vc-card-list' : ''}`}
      onClick={() => onClick(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="vc-thumb-wrap">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="vc-thumb"
            onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="vc-thumb-placeholder" />
        )}
        <div className={`vc-play-overlay ${hovered ? 'vc-play-visible' : ''}`}>
          <IoPlayCircle className="vc-play-icon" />
        </div>
        {video.duration > 0 && (
          <span className="vc-duration">{fmtDuration(video.duration)}</span>
        )}
      </div>
      <div className="vc-body">
        <span className="vc-category">{video.category}</span>
        <h3 className="vc-title">{video.title}</h3>
        {video.description && layout === 'list' && (
          <p className="vc-desc-preview">{video.description}</p>
        )}
        <div className="vc-footer">
          <span className="vc-views"><IoEyeOutline /> {fmtViews(video.views)}</span>
          <span className="vc-author">{video.author}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
function VideoPage() {
  const [videos, setVideos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory]       = useState('ทั้งหมด');
  const [layout, setLayout]           = useState('grid');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const params = { page, limit: 12 };
      if (search)                  params.search   = search;
      if (category !== 'ทั้งหมด') params.category = category;

      const res = await api.get('/videos', { params });
      setVideos(res.data.videos || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { fetchVideos(); window.scrollTo(0, 0); }, [fetchVideos]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openPlayer = async (video) => {
    const idx = videos.findIndex(v => v._id === video._id);
    setActiveVideo(video);
    setActiveIndex(idx);
    try {
      const res = await api.get(`/videos/${video._id}`);
      setVideos(prev =>
        prev.map(v => v._id === video._id ? { ...v, views: res.data.views } : v)
      );
      setActiveVideo(res.data);
    } catch { /* silent */ }
  };

  const closePlayer = () => setActiveVideo(null);

  const goPrev = () => {
    const idx = activeIndex - 1;
    if (idx >= 0) { openPlayer(videos[idx]); setActiveIndex(idx); }
  };

  const goNext = () => {
    const idx = activeIndex + 1;
    if (idx < videos.length) { openPlayer(videos[idx]); setActiveIndex(idx); }
  };

  return (
    <div className="vpage-root">
      <Navbar />

      <div className="vpage-hero">
        <div className="vpage-hero-bg" />
        <div className="vpage-hero-content">
          <h1 className="vpage-hero-title">
            <span className="vpage-hero-accent">วิดีโอ</span> ทั้งหมด
          </h1>
          <p className="vpage-hero-sub">ชมคลิปข่าว กิจกรรม และเนื้อหาพิเศษจากเรา</p>
          <form className="vpage-search-form" onSubmit={handleSearch}>
            <div className="vpage-search-wrap">
              <IoSearchOutline className="vpage-search-icon" />
              <input
                type="text"
                className="vpage-search-input"
                placeholder="ค้นหาวิดีโอ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button type="button" className="vpage-search-clear"
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>
                  <IoClose />
                </button>
              )}
              <button type="submit" className="vpage-search-btn">ค้นหา</button>
            </div>
          </form>
        </div>
      </div>

      <main className="vpage-main">
        <div className="vpage-filter-bar">
          <div className="vpage-cats">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`vpage-cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => { setCategory(cat); setPage(1); }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="vpage-layout-btns">
            <button className={`vpage-layout-btn ${layout === 'grid' ? 'active' : ''}`}
              onClick={() => setLayout('grid')} title="Grid">
              <IoGridOutline />
            </button>
            <button className={`vpage-layout-btn ${layout === 'list' ? 'active' : ''}`}
              onClick={() => setLayout('list')} title="List">
              <IoListOutline />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="vpage-loading">
            <div className="vpage-spinner" />
            <p>กำลังโหลดวิดีโอ...</p>
          </div>
        ) : error ? (
          <div className="vpage-error">
            <p>ไม่สามารถโหลดวิดีโอได้ กรุณาลองใหม่อีกครั้ง</p>
            <button onClick={fetchVideos} className="vpage-retry-btn">ลองใหม่</button>
          </div>
        ) : videos.length === 0 ? (
          <div className="vpage-empty">
            <IoPlayCircle className="vpage-empty-icon" />
            <p>ไม่พบวิดีโอ{search ? `สำหรับ "${search}"` : ''}</p>
          </div>
        ) : (
          <div className={`vpage-grid ${layout === 'list' ? 'vpage-grid-list' : ''}`}>
            {videos.map(v => (
              <VideoCard key={v._id} video={v} layout={layout} onClick={openPlayer} />
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="vpage-pagination">
            <button className="vpage-pg-btn" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}>
              <IoChevronBack /> ก่อนหน้า
            </button>
            <div className="vpage-pg-dots">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === '...' ? (
                  <span key={`d${i}`} className="vpage-pg-ellipsis">…</span>
                ) : (
                  <button key={p} className={`vpage-pg-num ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}>{p}</button>
                ))
              }
            </div>
            <button className="vpage-pg-btn" disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}>
              ถัดไป <IoChevronForward />
            </button>
          </div>
        )}
      </main>

      <Footer />

      {activeVideo && (
        <VideoPlayer
          video={activeVideo}
          onClose={closePlayer}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < videos.length - 1}
        />
      )}
    </div>
  );
}

export default VideoPage;