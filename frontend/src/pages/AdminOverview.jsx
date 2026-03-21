import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api.js';
import Navbar from '../components/Navbar';
import {
  IoNewspaperOutline, IoPeopleOutline, IoChatbubbleOutline,
  IoVideocamOutline, IoEyeOutline, IoTrendingUpOutline,
  IoTrendingDownOutline, IoRemoveOutline, IoRefreshOutline,
  IoPersonOutline, IoTimeOutline, IoStarOutline,
  IoGridOutline, IoSettingsOutline,
} from 'react-icons/io5';
import '../css/AdminOverview.css';

/* ── helpers ── */
function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return (n || 0).toLocaleString();
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'เมื่อกี้';
  if (diff < 3600)  return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

function trendIcon(current, previous) {
  if (current > previous) return <IoTrendingUpOutline className="ov-trend-up" />;
  if (current < previous) return <IoTrendingDownOutline className="ov-trend-down" />;
  return <IoRemoveOutline className="ov-trend-flat" />;
}

function trendPct(current, previous) {
  if (!previous) return current > 0 ? '+100%' : '0%';
  const pct = ((current - previous) / previous) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, trend, trendLabel, accent }) {
  return (
    <div className="ov-stat-card" style={{ '--ac': accent }}>
      <div className="ov-stat-top">
        <div className="ov-stat-icon">{icon}</div>
        {trend !== undefined && (
          <div className="ov-stat-trend">
            {trend}
            {trendLabel && <span className="ov-trend-lbl">{trendLabel}</span>}
          </div>
        )}
      </div>
      <p className="ov-stat-value">{fmtNum(value)}</p>
      <p className="ov-stat-label">{label}</p>
      {sub && <p className="ov-stat-sub">{sub}</p>}
    </div>
  );
}

/* ── Mini Bar Chart ── */
function MiniBarChart({ data, color, label }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dataMap = Object.fromEntries((data || []).map(d => [d._id, d.count]));
  const bars = days.map(day => ({ day, count: dataMap[day] || 0 }));
  const max = Math.max(...bars.map(b => b.count), 1);

  return (
    <div className="ov-chart">
      <p className="ov-chart-label">{label}</p>
      <div className="ov-bars">
        {bars.map(({ day, count }) => (
          <div key={day} className="ov-bar-col" title={`${day}: ${count}`}>
            <span className="ov-bar-count">{count > 0 ? count : ''}</span>
            <div className="ov-bar-track">
              <div className="ov-bar-fill"
                style={{ height: `${(count / max) * 100}%`, background: color }} />
            </div>
            <span className="ov-bar-day">
              {new Date(day + 'T12:00:00').toLocaleDateString('th-TH', { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Role Donut ── */
function RoleDonut({ data }) {
  if (!data?.length) return <p className="ov-empty">ไม่มีข้อมูล</p>;
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = { admin: '#16a34a', user: '#4ade80' };
  const r = 36, cx = 48, cy = 48, circ = 2 * Math.PI * r;
  let off = 0;
  const slices = data.map(d => {
    const pct = (d.count / total) * 100;
    const s = { ...d, pct, off };
    off += pct;
    return s;
  });

  return (
    <div className="ov-donut-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        {slices.map(s => (
          <circle key={s._id} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors[s._id] || '#86efac'}
            strokeWidth="18"
            strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
            strokeDashoffset={`${-((s.off / 100) * circ)}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">
          {total}
        </text>
      </svg>
      <div className="ov-donut-legend">
        {slices.map(s => (
          <div key={s._id} className="ov-donut-item">
            <span className="ov-donut-dot" style={{ background: colors[s._id] || '#86efac' }} />
            <span className="ov-donut-text">
              {s._id} <strong>{s.count}</strong>
              <span className="ov-donut-pct">({s.pct.toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
function AdminOverview() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [refreshed, setRefreshed] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await api.get('/dashboard');
      setData(res.data);
      setRefreshed(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') fetchData();
  }, [authLoading, user, fetchData]);

  if (authLoading) return <div className="ov-page"><Navbar /><div className="ov-center">กำลังโหลด...</div></div>;
  if (!user || user.role !== 'admin') return <div className="ov-page"><Navbar /><div className="ov-center ov-denied">ไม่มีสิทธิ์เข้าถึง</div></div>;

  const s = data?.stats || {};

  return (
    <div className="ov-page">
      <Navbar />

      {/* ── Page Header ── */}
      <div className="ov-hero">
        <div className="ov-hero-inner">
          <div className="ov-hero-text">
            <div className="ov-hero-icon"><IoGridOutline /></div>
            <div>
              <h1 className="ov-hero-title">ภาพรวมระบบ</h1>
              <p className="ov-hero-sub">
                อัพเดตล่าสุด {refreshed.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="ov-hero-actions">
            <Link to="/admin" className="ov-hero-btn ov-hero-btn--outline">
              <IoSettingsOutline /> จัดการข่าว
            </Link>
            <Link to="/admin/videos" className="ov-hero-btn ov-hero-btn--outline">
              <IoVideocamOutline /> จัดการวิดีโอ
            </Link>
            <button className="ov-hero-btn ov-hero-btn--green" onClick={fetchData} disabled={loading}>
              <IoRefreshOutline className={loading ? 'ov-spin' : ''} />
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      <div className="ov-container">
        {error && (
          <div className="ov-error">
            ไม่สามารถโหลดข้อมูลได้
            <button onClick={fetchData}>ลองใหม่</button>
          </div>
        )}

        {loading && !data ? (
          <div className="ov-center"><div className="ov-spinner" /></div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="ov-stats">
              <StatCard icon={<IoPeopleOutline />}      accent="#16a34a"
                label="ผู้ใช้ทั้งหมด"    value={s.totalUsers}
                sub={`+${s.newUsersToday || 0} วันนี้`}
                trend={trendIcon(s.newUsersMonth, s.lastMonthUsers)}
                trendLabel={trendPct(s.newUsersMonth, s.lastMonthUsers) + ' เดือนนี้'}
              />
              <StatCard icon={<IoNewspaperOutline />}   accent="#15803d"
                label="ข่าวทั้งหมด"     value={s.totalNews}
                sub={`+${s.newNewsToday || 0} วันนี้`}
                trend={trendIcon(s.newNewsMonth, s.lastMonthNews)}
                trendLabel={trendPct(s.newNewsMonth, s.lastMonthNews) + ' เดือนนี้'}
              />
              <StatCard icon={<IoChatbubbleOutline />}  accent="#4ade80"
                label="ความคิดเห็น"     value={s.totalComments}
                sub={`+${s.newCommentsToday || 0} วันนี้`}
              />
              <StatCard icon={<IoVideocamOutline />}    accent="#166534"
                label="วิดีโอทั้งหมด"  value={s.totalVideos}
              />
              <StatCard icon={<IoEyeOutline />}         accent="#22c55e"
                label="วิวข่าวรวม"     value={s.totalNewsViews}
              />
              <StatCard icon={<IoEyeOutline />}         accent="#86efac"
                label="วิววิดีโอรวม"   value={s.totalVideoViews}
              />
            </div>

            {/* ── Charts ── */}
            <div className="ov-charts">
              <div className="ov-card">
                <MiniBarChart data={data?.charts?.userChart} color="#16a34a" label="ผู้ใช้ใหม่ 7 วันล่าสุด" />
              </div>
              <div className="ov-card">
                <MiniBarChart data={data?.charts?.newsChart} color="#4ade80" label="ข่าวใหม่ 7 วันล่าสุด" />
              </div>
              <div className="ov-card">
                <p className="ov-chart-label">สัดส่วนผู้ใช้</p>
                <RoleDonut data={data?.userRoles} />
              </div>
            </div>

            {/* ── Top Content ── */}
            <div className="ov-two-col">
              <div className="ov-card">
                <div className="ov-card-head">
                  <IoStarOutline className="ov-head-icon" />
                  <span>ข่าวยอดนิยม</span>
                  <Link to="/admin" className="ov-head-link">ดูทั้งหมด →</Link>
                </div>
                {(data?.topNews || []).map((n, i) => (
                  <div key={n._id} className="ov-row">
                    <span className="ov-rank">{i + 1}</span>
                    <div className="ov-row-body">
                      <p className="ov-row-title">{n.title}</p>
                      <p className="ov-row-sub">
                        {n.category?.name || '-'} &nbsp;·&nbsp;
                        <IoEyeOutline /> {fmtNum(n.views)} วิว
                      </p>
                    </div>
                  </div>
                ))}
                {!data?.topNews?.length && <p className="ov-empty">ยังไม่มีข้อมูล</p>}
              </div>

              <div className="ov-card">
                <div className="ov-card-head">
                  <IoStarOutline className="ov-head-icon" />
                  <span>วิดีโอยอดนิยม</span>
                  <Link to="/admin/videos" className="ov-head-link">ดูทั้งหมด →</Link>
                </div>
                {(data?.topVideos || []).map((v, i) => (
                  <div key={v._id} className="ov-row">
                    <span className="ov-rank">{i + 1}</span>
                    {v.thumbnailUrl && (
                      <img src={v.thumbnailUrl} alt="" className="ov-vthumb" />
                    )}
                    <div className="ov-row-body">
                      <p className="ov-row-title">{v.title}</p>
                      <p className="ov-row-sub">
                        {v.category} &nbsp;·&nbsp;
                        <IoEyeOutline /> {fmtNum(v.views)} วิว
                      </p>
                    </div>
                  </div>
                ))}
                {!data?.topVideos?.length && <p className="ov-empty">ยังไม่มีข้อมูล</p>}
              </div>
            </div>

            {/* ── Recent Activity ── */}
            <div className="ov-two-col">
              <div className="ov-card">
                <div className="ov-card-head">
                  <IoChatbubbleOutline className="ov-head-icon" />
                  <span>ความคิดเห็นล่าสุด</span>
                </div>
                {(data?.recentComments || []).map(c => (
                  <div key={c._id} className="ov-row">
                    <div className="ov-avatar">
                      {c.userId?.profileImage
                        ? <img src={c.userId.profileImage} alt="" />
                        : <IoPersonOutline />}
                    </div>
                    <div className="ov-row-body">
                      <p className="ov-row-title">
                        <strong>{c.userId?.username || 'ผู้ใช้'}</strong>
                        <span className="ov-on"> ใน {c.newsId?.title || c.videoId?.title || '-'}</span>
                      </p>
                      <p className="ov-row-sub ov-truncate">{c.content}</p>
                      <p className="ov-row-time"><IoTimeOutline /> {timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {!data?.recentComments?.length && <p className="ov-empty">ยังไม่มีความคิดเห็น</p>}
              </div>

              <div className="ov-card">
                <div className="ov-card-head">
                  <IoPeopleOutline className="ov-head-icon" />
                  <span>สมาชิกใหม่ล่าสุด</span>
                </div>
                {(data?.recentUsers || []).map(u => (
                  <div key={u._id} className="ov-row">
                    <div className="ov-avatar">
                      {u.profileImage
                        ? <img src={u.profileImage} alt="" />
                        : <IoPersonOutline />}
                    </div>
                    <div className="ov-row-body">
                      <p className="ov-row-title">
                        {u.fullName}
                        <span className={`ov-badge ov-badge--${u.role}`}>{u.role}</span>
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