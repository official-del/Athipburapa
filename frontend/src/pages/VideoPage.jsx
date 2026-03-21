import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  IoSearchOutline, IoPlayCircle, IoEyeOutline,
  IoTimeOutline, IoGridOutline, IoListOutline,
  IoChevronBack, IoChevronForward, IoClose,
  IoChatbubbleOutline, IoShareSocialOutline,
  IoSendOutline, IoTrashOutline, IoPerson,
  IoCheckmarkCircle, IoCopyOutline, IoLogoFacebook,
  IoLogoTwitter, IoLogoLine,
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

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)   return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

/* ── Share Panel ── */
function SharePanel({ video, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/videos?v=${video._id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLinks = [
    {
      label: 'Facebook',
      icon: <IoLogoFacebook />,
      color: '#1877f2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'Twitter / X',
      icon: <IoLogoTwitter />,
      color: '#000',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(video.title)}`,
    },
    {
      label: 'LINE',
      icon: <IoLogoLine />,
      color: '#06c755',
      href: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="vp-share-panel">
      <div className="vp-share-header">
        <span>แชร์วิดีโอ</span>
        <button onClick={onClose}><IoClose /></button>
      </div>
      <div className="vp-share-btns">
        {shareLinks.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
            className="vp-share-social" style={{ '--sc': s.color }}>
            {s.icon} {s.label}
          </a>
        ))}
      </div>
      <div className="vp-share-copy">
        <input readOnly value={url} className="vp-share-url" />
        <button className="vp-share-copy-btn" onClick={copy}>
          {copied ? <IoCheckmarkCircle /> : <IoCopyOutline />}
          {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>
    </div>
  );
}

/* ── Comment Section ── */
function CommentSection({ video }) {
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [content, setContent]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/comments/video/${video._id}`);
      setComments(res.data || []);
    } catch {
      // ไม่แสดง error ถ้าโหลด comment ไม่ได้
    } finally {
      setLoading(false);
    }
  }, [video._id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/comments', { videoId: video._id, content });
      setComments(prev => [res.data.comment, ...prev]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
    } catch {
      // silent
    }
  };

  return (
    <div className="vp-comments">
      <h3 className="vp-comments-title">
        <IoChatbubbleOutline /> ความคิดเห็น ({comments.length})
      </h3>

      {/* ── Input ── */}
      {user ? (
        <form className="vp-comment-form" onSubmit={handleSubmit}>
          <div className="vp-comment-avatar">
            {user.profileImage || user.image
              ? <img src={user.profileImage || user.image} alt="" />
              : <IoPerson />}
          </div>
          <div className="vp-comment-input-wrap">
            <textarea
              className="vp-comment-input"
              placeholder="แสดงความคิดเห็น..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
              disabled={submitting}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
              }}
            />
            {error && <p className="vp-comment-error">{error}</p>}
            <div className="vp-comment-actions">
              <button
                type="button"
                className="vp-comment-cancel"
                onClick={() => { setContent(''); setError(''); }}
                disabled={!content || submitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="vp-comment-submit"
                disabled={!content.trim() || submitting}
              >
                <IoSendOutline />
                {submitting ? 'กำลังส่ง...' : 'ส่ง'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="vp-comment-login">
          <a href="/login">เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น
        </p>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="vp-comment-loading">กำลังโหลด...</div>
      ) : comments.length === 0 ? (
        <p className="vp-comment-empty">ยังไม่มีความคิดเห็น เป็นคนแรกได้เลย!</p>
      ) : (
        <div className="vp-comment-list">
          {comments.map(c => (
            <div key={c._id} className="vp-comment-item">
              <div className="vp-comment-item-avatar">
                {c.userId?.profileImage
                  ? <img src={c.userId.profileImage} alt="" />
                  : <IoPerson />}
              </div>
              <div className="vp-comment-item-body">
                <div className="vp-comment-item-header">
                  <span className="vp-comment-username">
                    {c.userId?.username || c.userId?.fullName || 'ผู้ใช้'}
                  </span>
                  <span className="vp-comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="vp-comment-content">{c.content}</p>
              </div>
              {user && (user._id === c.userId?._id || user.role === 'admin') && (
                <button
                  className="vp-comment-delete"
                  onClick={() => handleDelete(c._id)}
                  title="ลบ"
                >
                  <IoTrashOutline />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Lightbox player ── */
function VideoPlayer({ video, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const overlayRef = useRef(null);
  const [tab, setTab] = useState('info'); // 'info' | 'comments'
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    // reset tab เมื่อเปลี่ยนวิดีโอ
    setTab('info');
    setShowShare(false);
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

        {/* ── Video ── */}
        <div className="vp-video-wrap">
          <video key={video._id} controls autoPlay className="vp-video" poster={video.thumbnailUrl}>
            <source src={video.videoUrl} type="video/mp4" />
          </video>
        </div>

        {/* ── Info + Tabs ── */}
        <div className="vp-info">
          <h2 className="vp-title">{video.title}</h2>
          <div className="vp-meta">
            <span className="vp-cat-pill">{video.category}</span>
            <span className="vp-meta-item"><IoEyeOutline /> {fmtViews(video.views)} ครั้ง</span>
            {video.duration > 0 && (
              <span className="vp-meta-item"><IoTimeOutline /> {fmtDuration(video.duration)}</span>
            )}
          </div>

          {/* ── Action Buttons ── */}
          <div className="vp-action-bar">
            <button
              className={`vp-action-btn ${tab === 'comments' ? 'active' : ''}`}
              onClick={() => setTab(tab === 'comments' ? 'info' : 'comments')}
            >
              <IoChatbubbleOutline /> ความคิดเห็น
            </button>
            <button
              className={`vp-action-btn ${showShare ? 'active' : ''}`}
              onClick={() => setShowShare(s => !s)}
            >
              <IoShareSocialOutline /> แชร์
            </button>
          </div>

          {/* ── Share Panel ── */}
          {showShare && (
            <SharePanel video={video} onClose={() => setShowShare(false)} />
          )}

          {/* ── Tab Content ── */}
          {tab === 'info' ? (
            <>
              {video.description && <p className="vp-desc">{video.description}</p>}
              {video.tags?.length > 0 && (
                <div className="vp-tags">
                  {video.tags.map(t => <span key={t} className="vp-tag">#{t}</span>)}
                </div>
              )}
            </>
          ) : (
            <CommentSection video={video} />
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

  // ✅ call API เพื่อเพิ่ม views
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

      {/* ── Hero Banner ── */}
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
        {/* ── Filter Bar ── */}
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

        {/* ── Content ── */}
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

        {/* ── Pagination ── */}
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

      {/* ── Lightbox Player ── */}
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