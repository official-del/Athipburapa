import React, { useState } from 'react';
import './ShareButtons.css';

// SVG Icons
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.587 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.312-.883-2.371-.887h-.018c-.845 0-1.576.245-2.171.729-.576.470-.908 1.119-1.006 1.974l-2.06-.217c.147-1.36.732-2.505 1.742-3.374.982-.84 2.233-1.29 3.638-1.29h.021c1.626.004 2.965.52 3.879 1.492 1.026 1.09 1.441 2.623 1.396 4.399a7.92 7.92 0 0 1 1.53 1.29c.87 1.122 1.237 2.616.985 4.228-.312 1.998-1.348 3.735-2.91 4.976-1.467 1.17-3.351 1.778-5.593 1.813h-.013z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);
  const [igCopied, setIgCopied] = useState(false);

  // ใช้ URL ปัจจุบันถ้าไม่ได้ส่ง url มา
  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;

  const encodedUrl   = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const platforms = [
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon />,
      className: 'sb-btn--facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: 'x',
      label: 'X',
      icon: <XIcon />,
      className: 'sb-btn--x',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      key: 'line',
      label: 'LINE',
      icon: <LineIcon />,
      className: 'sb-btn--line',
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
    },
    {
      key: 'threads',
      label: 'Threads',
      icon: <ThreadsIcon />,
      className: 'sb-btn--threads',
      href: `https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const openPopup = (href) => {
    window.open(href, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback สำหรับ browser เก่า
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Instagram ไม่รองรับ Web Share API → คัดลอก URL แทน
  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIgCopied(true);
      setTimeout(() => setIgCopied(false), 3000);
    } catch {
      alert('กรุณาคัดลอก URL นี้แล้วเปิดแอป Instagram:\n' + shareUrl);
    }
  };

  return (
    <div className="share-buttons">
      <p className="sb-label">แชร์ข่าวนี้</p>

      <div className="sb-row">
        {/* Platform buttons */}
        {platforms.map(({ key, label, icon, className, href }) => (
          <button
            key={key}
            className={`sb-btn ${className}`}
            onClick={() => openPopup(href)}
            aria-label={`แชร์ผ่าน ${label}`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}

        {/* Instagram — copy only */}
        <button
          className="sb-btn sb-btn--instagram"
          onClick={handleInstagram}
          aria-label="แชร์ผ่าน Instagram"
        >
          <InstagramIcon />
          <span>{igCopied ? 'คัดลอกแล้ว!' : 'Instagram'}</span>
        </button>

        {/* Copy link */}
        <button
          className={`sb-btn sb-btn--copy ${copied ? 'sb-btn--copied' : ''}`}
          onClick={handleCopy}
          aria-label="คัดลอกลิงก์"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
        </button>
      </div>

      {/* URL display */}
      <div className="sb-url-row">
        <input
          className="sb-url-input"
          type="text"
          value={shareUrl}
          readOnly
          onClick={(e) => e.target.select()}
          aria-label="URL ของข่าวนี้"
        />
      </div>

      {/* Instagram notice */}
      {igCopied && (
        <p className="sb-ig-notice">
          คัดลอก URL แล้ว — เปิดแอป Instagram แล้ววางลงใน Story หรือ Bio ได้เลย
        </p>
      )}
    </div>
  );
}

export default ShareButtons;