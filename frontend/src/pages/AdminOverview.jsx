import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api.js';
import Navbar from '../components/Navbar';
import {
  IoNewspaperOutline, IoPeopleOutline, IoChatbubbleOutline,
  IoVideocamOutline, IoEyeOutline, IoTrendingUpOutline,
  IoTrendingDownOutline, IoRemoveOutline, IoRefreshOutline,
  IoPersonOutline, IoTimeOutline, IoStarOutline, IoGridOutline,
  IoSettingsOutline, IoArrowForward,
} from 'react-icons/io5';
import '../css/AdminOverview.css';

/* ── Helpers ── */
function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return (n || 0).toLocaleString();
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'เมื่อกี้';
  if (diff < 3600)  return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

function trendIcon(cur, prev) {
  if (cur > prev) return <IoTrendingUpOutline className="ov-up" />;
  if (cur < prev) return <IoTrendingDownOutline className="ov-down" />;
  return <IoRemoveOutline className="ov-flat" />;
}

function trendPct(cur, prev) {
  if (!prev) return cur > 0 ? '+100%' : '—';
  const p = ((cur - prev) / prev) * 100;
  return (p >= 0 ? '+' : '') + p.toFixed(0) + '%';
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, trend, trendLabel, accent }) {
  return (
    <div className="ov-card ov-stat" style={{ '--ac': accent }}>
      <div className="ov-stat-row">
        <div className="ov-stat-ico">{icon}</div>
        {trend && (
          <div className="ov-stat-trend">
            {trend}
            {trendLabel && <span className="ov-trend-txt">{trendLabel}</span>}
          </div>
        )}
      </div>
      <p className="ov-stat-val">{fmtNum(value)}</p>
      <p className="ov-stat-lbl">{label}</p>
      {sub && <p className="ov-stat-sub">{sub}</p>}
    </div>
  );
}

/* ── Bar Chart ── */
function BarChart({ data, color, label }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const map  = Object.fromEntries((data || []).map(d => [d._id, d.count]));
  const bars = days.map(day => ({ day, count: map[day] || 0 }));
  const max  = Math.max(...bars.map(b => b.count), 1);

  return (
    <div>
      <p className="ov-sect-title">{label}</p>
      <div className="ov-bars">
        {bars.map(({ day, count }) => (
          <div key={day} className="ov-bar-col" title={`${day}: ${count}`}>
            {count > 0 && <span className="ov-bar-cnt">{count}</span>}
            <div className="ov-bar-bg">
              <div className="ov-bar-fill"
                style={{ height: `${(count / max) * 100}%`, background: color }} />
            </div>
            <span className="ov-bar-lbl">
              {new Date(day + 'T12:00:00').toLocaleDateString('th-TH', { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Donut Chart ── */
function Donut({ data }) {
  if (!data?.length) return <p className="ov-empty">ไม่มีข้อมูล</p>;
  const total = data.reduce((s, d) => s + d.count, 0);
  const clr   = { admin: '#16a34a', user: '#4ade80' };
  const r = 34, cx = 46, cy = 46, circ = 2 * Math.PI * r;
  let off = 0;
  const slices = data.map(d => {
    const pct = (d.count / total) * 100;
    const s   = { ...d, pct, off };
    off += pct;
    return s;
  });

  return (
    <div className="ov-donut">
      <svg width="92" height="92" viewBox="0 0 92 92" style={{ flexShrink: 0 }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0fdf4" strokeWidth="16" />
        {slices.map(s => (
          <circle key={s._id} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={clr[s._id] || '#86efac'}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
            strokeDashoffset={`${-((s.off / 100) * circ - 1)}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cx - 5} textAnchor="middle"
          style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 800, fill: '#0a1628' }}>
          {total}
        </text>
        <text x={cx} y={cx + 10} textAnchor="middle"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '8px', fill: '#94a3b8' }}>
          ผู้ใช้
        </text>
      </svg>
      <div className="ov-donut-leg">
        {slices.map(s => (
          <div key={s._id} className="ov-donut-row">
            <span className="ov-donut-dot" style={{ background: clr[s._id] || '#86efac' }} />
            <div>
              <span style={{ fontWeight: 600 }}>{s._id}</span>
              {' '}
              <span style={{ fontWeight: 700, color: '#0a1628' }}>{s.count}</span>
              {' '}
              <span className="ov-donut-pct">({s.pct.toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card Header ── */
function CardHead({ icon, title, linkTo, linkLabel }) {
  return (
    <div className="ov-card-hd">
      <div className="ov-hd-ico">{icon}</div>
      <span className="ov-hd-title">{title}</span>
      {linkTo && (
        <Link to={linkTo} className="ov-hd-lnk">
          {linkLabel || 'ดูทั้งหมด'} <IoArrowForward />
        </Link>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
function AdminOverview() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [ts, setTs]           = useState(new Date());

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(false);
      const res = await api.get('/dashboard');
      setData(res.data);
      setTs(new Date());
    } catch { setError(true); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') load();
  }, [authLoading, user, load]);

  if (authLoading) return (
    <div className="ov-page"><Navbar />
      <div className="ov-center"><div className="ov-spin-lg" /></div>
    </div>
  );
  if (!user || user.role !== 'admin') return (
    <div className="ov-page"><Navbar />
      <div className="ov-center ov-denied">ไม่มีสิทธิ์เข้าถึง</div>
    </div>
  );

  const s = data?.stats || {};

  return (
    <div className="ov-page">
      <Navbar />

      {/* ══ HERO ══ */}
      <div className="ov-hero">
        <div className="ov-hero-inner">
          <div className="ov-hero-left">
            <div className="ov-hero-ico"><IoGridOutline /></div>
            <div>
              <p className="ov-hero-tag">Admin Console</p>
              <h1 className="ov-hero-h1">ภาพรวมระบบ</h1>
              <p className="ov-hero-sub">
                <span className="ov-hero-sub-dot" />
                อัพเดตล่าสุด {ts.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="ov-hero-btns">
            <Link to="/admin" className="ov-btn ov-btn-ghost">
              <IoSettingsOutline /> จัดการข่าว
            </Link>
            <Link to="/admin/videos" className="ov-btn ov-btn-ghost">
              <IoVideocamOutline /> จัดการวิดีโอ
            </Link>
            <button className="ov-btn ov-btn-white" onClick={load} disabled={loading}>
              <IoRefreshOutline className={loading ? 'ov-spin' : ''} />
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="ov-body">
        {error && (
          <div className="ov-alert">
            ไม่สามารถโหลดข้อมูลได้
            <button onClick={load}>ลองใหม่</button>
          </div>
        )}

        {loading && !data ? (
          <div className="ov-center"><div className="ov-spin-lg" /></div>
        ) : (
          <>
            {/* ══ STATS ══ */}
            <p className="ov-section-label">สถิติภาพรวม</p>
            <div className="ov-stats">
              <StatCard icon={<IoPeopleOutline />}     accent="#16a34a"
                label="ผู้ใช้ทั้งหมด"  value={s.totalUsers}
                sub={`+${s.newUsersToday || 0} วันนี้`}
                trend={trendIcon(s.newUsersMonth, s.lastMonthUsers)}
                trendLabel={trendPct(s.newUsersMonth, s.lastMonthUsers)} />

              <StatCard icon={<IoNewspaperOutline />}  accent="#15803d"
                label="ข่าวทั้งหมด"    value={s.totalNews}
                sub={`+${s.newNewsToday || 0} วันนี้`}
                trend={trendIcon(s.newNewsMonth, s.lastMonthNews)}
                trendLabel={trendPct(s.newNewsMonth, s.lastMonthNews)} />

              <StatCard icon={<IoChatbubbleOutline />} accent="#22c55e"
                label="ความคิดเห็น"    value={s.totalComments}
                sub={`+${s.newCommentsToday || 0} วันนี้`} />

              <StatCard icon={<IoVideocamOutline />}   accent="#166534"
                label="วิดีโอทั้งหมด" value={s.totalVideos} />

              <StatCard icon={<IoEyeOutline />}        accent="#4ade80"
                label="วิวข่าวรวม"    value={s.totalNewsViews} />

              <StatCard icon={<IoEyeOutline />}        accent="#86efac"
                label="วิววิดีโอรวม"  value={s.totalVideoViews} />
            </div>

            {/* ══ CHARTS ══ */}
            <p className="ov-section-label">กิจกรรม 7 วันล่าสุด</p>
            <div className="ov-charts">
              <div className="ov-card">
                <BarChart data={data?.charts?.userChart} color="#16a34a" label="ผู้ใช้ใหม่" />
              </div>
              <div className="ov-card">
                <BarChart data={data?.charts?.newsChart} color="#4ade80" label="ข่าวใหม่" />
              </div>
              <div className="ov-card">
                <p className="ov-sect-title">สัดส่วนผู้ใช้</p>
                <Donut data={data?.userRoles} />
              </div>
            </div>

            {/* ══ TOP CONTENT ══ */}
            <p className="ov-section-label">เนื้อหายอดนิยม</p>
            <div className="ov-two">
              <div className="ov-card">
                <CardHead icon={<IoStarOutline />} title="ข่าวยอดนิยม" linkTo="/admin" />
                {(data?.topNews || []).map((n, i) => (
                  <div key={n._id} className="ov-row">
                    <span className="ov-rank">{i + 1}</span>
                    <div className="ov-row-body">
                      <p className="ov-row-ttl">
                        <span className="ov-row-ttl-text">{n.title}</span>
                      </p>
                      <p className="ov-row-sub">
                        <span>{n.category?.name || '—'}</span>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <span className="ov-views-pill">
                          <IoEyeOutline /> {fmtNum(n.views)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
                {!data?.topNews?.length && <p className="ov-empty">ยังไม่มีข้อมูล</p>}
              </div>

              <div className="ov-card">
                <CardHead icon={<IoStarOutline />} title="วิดีโอยอดนิยม" linkTo="/admin/videos" />
                {(data?.topVideos || []).map((v, i) => (
                  <div key={v._id} className="ov-row">
                    <span className="ov-rank">{i + 1}</span>
                    {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="ov-vthumb" />}
                    <div className="ov-row-body">
                      <p className="ov-row-ttl">
                        <span className="ov-row-ttl-text">{v.title}</span>
                      </p>
                      <p className="ov-row-sub">
                        <span>{v.category || '—'}</span>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <span className="ov-views-pill">
                          <IoEyeOutline /> {fmtNum(v.views)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
                {!data?.topVideos?.length && <p className="ov-empty">ยังไม่มีข้อมูล</p>}
              </div>
            </div>

            {/* ══ RECENT ACTIVITY ══ */}
            <p className="ov-section-label">กิจกรรมล่าสุด</p>
            <div className="ov-two">
              <div className="ov-card">
                <CardHead icon={<IoChatbubbleOutline />} title="ความคิดเห็นล่าสุด" />
                {(data?.recentComments || []).map(c => (
                  <div key={c._id} className="ov-row">
                    <div className="ov-ava">
                      {c.userId?.profileImage
                        ? <img src={c.userId.profileImage} alt="" />
                        : <IoPersonOutline />}
                    </div>
                    <div className="ov-row-body">
                      <p className="ov-row-ttl">
                        <strong style={{ fontWeight: 600 }}>{c.userId?.username || 'ผู้ใช้'}</strong>
                        <span className="ov-on">
                          {c.newsId?.title || c.videoId?.title || '—'}
                        </span>
                      </p>
                      <p className="ov-clamp" style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                        {c.content}
                      </p>
                      <p className="ov-row-time"><IoTimeOutline /> {timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {!data?.recentComments?.length && <p className="ov-empty">ยังไม่มีความคิดเห็น</p>}
              </div>

              <div className="ov-card">
                <CardHead icon={<IoPeopleOutline />} title="สมาชิกใหม่ล่าสุด" />
                {(data?.recentUsers || []).map(u => (
                  <div key={u._id} className="ov-row">
                    <div className="ov-ava">
                      {u.profileImage
                        ? <img src={u.profileImage} alt="" />
                        : <IoPersonOutline />}
                    </div>
                    <div className="ov-row-body">
                      <p className="ov-row-ttl">
                        <span className="ov-row-ttl-text">{u.fullName}</span>
                        <span className={`ov-badge ov-badge-${u.role}`}>{u.role}</span>
                      </p>
                      <p className="ov-row-sub">@{u.username} · {u.email}</p>
                      <p className="ov-row-time"><IoTimeOutline /> {timeAgo(u.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {!data?.recentUsers?.length && <p className="ov-empty">ยังไม่มีสมาชิก</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminOverview;