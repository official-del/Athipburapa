import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { IoSearchOutline, IoNewspaperOutline, IoClose, IoArrowBack, IoCalendarOutline, IoEyeOutline } from 'react-icons/io5';
import { newsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../css/SearchResults.css';

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  const query = searchParams.get('q') || '';

  const [inputVal, setInputVal]   = useState(query);
  const [results,  setResults]    = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [searched, setSearched]   = useState(false);

  // fetch เมื่อ query เปลี่ยน
  useEffect(() => {
    setInputVal(query);
    if (!query.trim()) { setResults([]); setSearched(false); return; }

    const fetch = async () => {
      setLoading(true);
      setSearched(false);
      try {
        const res = await newsAPI.getAll({ search: query });
        setResults(res.data || []);
      } catch { setResults([]); }
      finally { setLoading(false); setSearched(true); }
    };
    fetch();
  }, [query]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const val = inputVal.trim();
    if (!val) return;
    setSearchParams({ q: val });
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="sr-root">
      <Navbar />

      {/* ── Hero search bar ── */}
      <div className="sr-hero">
        <div className="sr-hero-inner">
          <button className="sr-back-btn" onClick={() => navigate(-1)}>
            <IoArrowBack />
          </button>
          <form className="sr-search-form" onSubmit={handleSubmit}>
            <IoSearchOutline className="sr-form-icon" />
            <input
              ref={inputRef}
              className="sr-form-input"
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="ค้นหาข่าว, หมวดหมู่..."
              autoFocus
            />
            {inputVal && (
              <button type="button" className="sr-form-clear"
                onClick={() => { setInputVal(''); setSearchParams({}); inputRef.current?.focus(); }}>
                <IoClose />
              </button>
            )}
            <button type="submit" className="sr-form-submit">ค้นหา</button>
          </form>
        </div>

        {/* query + count label */}
        {query && !loading && searched && (
          <p className="sr-hero-label">
            {results.length > 0
              ? <>พบ <strong>{results.length}</strong> ผลลัพธ์สำหรับ "<strong>{query}</strong>"</>
              : <>ไม่พบผลลัพธ์สำหรับ "<strong>{query}</strong>"</>}
          </p>
        )}
      </div>

      {/* ── Content ── */}
      <main className="sr-main">

        {/* Loading skeleton */}
        {loading && (
          <div className="sr-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sr-skeleton" />
            ))}
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div className="sr-grid">
            {results.map((item, i) => (
              <Link
                key={item._id}
                to={`/news/${item._id}`}
                className="sr-card"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="sr-card-img">
                  {item.image
                    ? <img src={item.image} alt={item.title} loading="lazy" />
                    : <div className="sr-card-no-img"><IoNewspaperOutline /></div>}
                  {item.category?.name && (
                    <span className="sr-card-cat">{item.category.name}</span>
                  )}
                </div>
                <div className="sr-card-body">
                  <h3 className="sr-card-title">{item.title}</h3>
                  {item.excerpt && (
                    <p className="sr-card-excerpt">{item.excerpt}</p>
                  )}
                  <div className="sr-card-meta">
                    <span><IoCalendarOutline /> {formatDate(item.createdAt)}</span>
                    <span><IoEyeOutline /> {(item.views || 0).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && (
          <div className="sr-empty">
            <div className="sr-empty-icon"><IoSearchOutline /></div>
            <h2>ไม่พบข่าวที่ตรงกัน</h2>
            <p>ลองค้นหาด้วยคำอื่น หรือเลือกดูตามหมวดหมู่</p>
            <Link to="/news" className="sr-empty-btn">ดูข่าวทั้งหมด</Link>
          </div>
        )}

        {/* Initial state — ยังไม่ได้พิมพ์ */}
        {!loading && !searched && !query && (
          <div className="sr-empty">
            <div className="sr-empty-icon"><IoSearchOutline /></div>
            <h2>ค้นหาข่าวที่คุณสนใจ</h2>
            <p>พิมพ์ชื่อข่าว เนื้อหา หรือหมวดหมู่ในช่องด้านบน</p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default SearchResults;