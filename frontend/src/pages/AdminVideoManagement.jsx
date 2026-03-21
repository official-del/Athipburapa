import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api.js';
import Navbar from '../components/Navbar';
import {
  HiOutlinePencil, HiOutlineTrash, HiOutlinePlus,
  HiOutlineVideoCamera, HiOutlineX
} from 'react-icons/hi';
import { IoCloudUploadOutline, IoCheckmarkCircle, IoWarningOutline } from 'react-icons/io5';
import '../css/AdminVideo.css';

const CATEGORIES = ['ข่าว', 'กิจกรรม', 'ท่องเที่ยว', 'กีฬา', 'บันเทิง', 'ทั่วไป'];

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'ทั่วไป',
  tags: '',
  author: '',
};

function fmtDuration(sec) {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

/* ── Upload Zone ── */
function UploadZone({ file, onChange, disabled, progress }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) onChange(f);
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onChange(f);
  };

  return (
    <div
      className={`avd-upload-zone ${dragOver ? 'dragover' : ''} ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/mov,video/avi,video/mkv,video/webm"
        onChange={handleFile}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!file ? (
        <div className="avd-upload-idle">
          <IoCloudUploadOutline className="avd-upload-icon" />
          <p className="avd-upload-label">ลากวิดีโอมาวางที่นี่ หรือ <span>คลิกเพื่อเลือกไฟล์</span></p>
          <p className="avd-upload-hint">รองรับ MP4, MOV, AVI, MKV, WebM — สูงสุด 500MB</p>
        </div>
      ) : (
        <div className="avd-upload-file">
          <HiOutlineVideoCamera className="avd-file-icon" />
          <div className="avd-file-info">
            <p className="avd-file-name">{file.name}</p>
            <p className="avd-file-size">{fmtSize(file.size)}</p>
          </div>
          {progress > 0 && progress < 100 ? (
            <div className="avd-progress-wrap">
              <div className="avd-progress-bar" style={{ width: `${progress}%` }} />
              <span className="avd-progress-pct">{progress}%</span>
            </div>
          ) : (
            !disabled && (
              <button type="button" className="avd-file-remove"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}>
                <HiOutlineX />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Thumbnail Cell ── */
function ThumbCell({ video }) {
  const [imgError, setImgError] = useState(false);

  if (!video.thumbnailUrl || imgError) {
    return (
      <div className="avd-thumb-cell">
        <div className="avd-thumb-placeholder">
          <HiOutlineVideoCamera />
        </div>
      </div>
    );
  }

  return (
    <div className="avd-thumb-cell">
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="avd-thumb"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

/* ── Main Component ── */
function AdminVideoManagement() {
  const { user, loading: authLoading } = useAuth();

  const [videos, setVideos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData]       = useState(INITIAL_FORM);
  const [videoFile, setVideoFile]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const notifyTimer = useRef(null);

  const showNotif = useCallback((type, message) => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    setNotification({ type, message });
    notifyTimer.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => () => { if (notifyTimer.current) clearTimeout(notifyTimer.current); }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/videos', { params: { limit: 100 } });
      setVideos(res.data.videos || []);
    } catch (err) {
      showNotif('error', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, [showNotif]);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') fetchVideos();
  }, [authLoading, user, fetchVideos]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const openAdd = () => {
    setEditingVideo(null);
    setFormData(INITIAL_FORM);
    setVideoFile(null);
    setUploadProgress(0);
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingVideo(v);
    setFormData({
      title:       v.title || '',
      description: v.description || '',
      category:    v.category || 'ทั่วไป',
      tags:        Array.isArray(v.tags) ? v.tags.join(', ') : '',
      author:      v.author || '',
    });
    setVideoFile(null);
    setUploadProgress(0);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setEditingVideo(null);
    setVideoFile(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { showNotif('error', 'กรุณากรอกชื่อวิดีโอ'); return; }
    if (!editingVideo && !videoFile) { showNotif('error', 'กรุณาเลือกไฟล์วิดีโอ'); return; }

    setIsSubmitting(true);
    try {
      if (editingVideo) {
        // แก้ข้อมูลอย่างเดียว (ไม่เปลี่ยนไฟล์)
        await api.put(`/videos/${editingVideo._id}`, formData);
        showNotif('success', 'อัพเดตวิดีโอสำเร็จ ✓');
      } else {
        // อัพโหลดไฟล์ใหม่
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
        fd.append('video', videoFile);

        await api.post('/videos', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          },
        });
        showNotif('success', 'อัพโหลดวิดีโอสำเร็จ ✓');
      }
      closeModal();
      await fetchVideos();
    } catch (err) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด';
      showNotif('error', msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/videos/${confirmDelete}`);
      setVideos(p => p.filter(v => v._id !== confirmDelete));
      showNotif('success', 'ลบวิดีโอสำเร็จ ✓');
    } catch (err) {
      showNotif('error', 'ไม่สามารถลบวิดีโอได้');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (authLoading) return <div className="avd-page"><Navbar /><div className="avd-center">กำลังโหลด...</div></div>;
  if (!user || user.role !== 'admin') return <div className="avd-page"><Navbar /><div className="avd-center avd-denied">ไม่มีสิทธิ์เข้าถึง</div></div>;

  return (
    <div className="avd-page">
      <Navbar />

      {notification && (
        <div className={`avd-notif avd-notif--${notification.type}`}>
          {notification.type === 'success'
            ? <IoCheckmarkCircle />
            : <IoWarningOutline />}
          {notification.message}
        </div>
      )}

      <div className="avd-container">
        <div className="avd-header">
          <div>
            <h1 className="avd-heading">จัดการวิดีโอ</h1>
            <p className="avd-subheading">{videos.length} วิดีโอในระบบ</p>
          </div>
          <button className="avd-add-btn" onClick={openAdd}>
            <HiOutlinePlus /> อัพโหลดวิดีโอ
          </button>
        </div>

        {loading ? (
          <div className="avd-center"><div className="avd-spinner" /></div>
        ) : videos.length === 0 ? (
          <div className="avd-empty">
            <HiOutlineVideoCamera className="avd-empty-icon" />
            <p>ยังไม่มีวิดีโอ</p>
            <button className="avd-add-btn" onClick={openAdd}><HiOutlinePlus /> อัพโหลดวิดีโอแรก</button>
          </div>
        ) : (
          <div className="avd-table-wrap">
            <table className="avd-table">
              <thead>
                <tr>
                  <th>ตัวอย่าง</th>
                  <th>ชื่อวิดีโอ</th>
                  <th>หมวดหมู่</th>
                  <th>ความยาว</th>
                  <th>การดู</th>
                  <th>วันที่</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(v => (
                  <tr key={v._id}>
                    {/* ✅ ใช้ ThumbCell component ที่มี error state */}
                    <td><ThumbCell video={v} /></td>
                    <td className="avd-title-cell">{v.title}</td>
                    <td><span className="avd-cat-badge">{v.category}</span></td>
                    <td>{fmtDuration(v.duration)}</td>
                    <td>{(v.views || 0).toLocaleString()}</td>
                    <td>{new Date(v.createdAt).toLocaleDateString('th-TH')}</td>
                    <td className="avd-actions">
                      <button className="avd-edit-btn" onClick={() => openEdit(v)} title="แก้ไข">
                        <HiOutlinePencil />
                      </button>
                      <button className="avd-del-btn" onClick={() => setConfirmDelete(v._id)} title="ลบ">
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Form Modal ── */}
      {showModal && (
        <div className="avd-overlay" onClick={closeModal}>
          <div className="avd-modal" onClick={e => e.stopPropagation()}>
            <div className="avd-modal-header">
              <h2>{editingVideo ? 'แก้ไขวิดีโอ' : 'อัพโหลดวิดีโอใหม่'}</h2>
              <button className="avd-modal-close" onClick={closeModal}><HiOutlineX /></button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Upload Zone (เฉพาะเพิ่มใหม่) */}
              {!editingVideo && (
                <div className="avd-form-group">
                  <label>ไฟล์วิดีโอ <span className="avd-req">*</span></label>
                  <UploadZone
                    file={videoFile}
                    onChange={setVideoFile}
                    disabled={isSubmitting}
                    progress={uploadProgress}
                  />
                </div>
              )}

              <div className="avd-form-row">
                <div className="avd-form-group avd-form-group-full">
                  <label>ชื่อวิดีโอ <span className="avd-req">*</span></label>
                  <input
                    type="text" name="title" value={formData.title}
                    onChange={handleInput} disabled={isSubmitting}
                    placeholder="กรอกชื่อวิดีโอ"
                    className="avd-input"
                  />
                </div>
              </div>

              <div className="avd-form-row">
                <div className="avd-form-group">
                  <label>หมวดหมู่</label>
                  <select name="category" value={formData.category}
                    onChange={handleInput} disabled={isSubmitting}
                    className="avd-select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="avd-form-group">
                  <label>ผู้เผยแพร่</label>
                  <input
                    type="text" name="author" value={formData.author}
                    onChange={handleInput} disabled={isSubmitting}
                    placeholder="ชื่อผู้เผยแพร่ (ไม่บังคับ)"
                    className="avd-input"
                  />
                </div>
              </div>

              <div className="avd-form-group">
                <label>คำอธิบาย</label>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleInput} disabled={isSubmitting}
                  rows={3} placeholder="คำอธิบายวิดีโอ (ไม่บังคับ)"
                  className="avd-textarea"
                />
              </div>

              <div className="avd-form-group">
                <label>แท็ก</label>
                <input
                  type="text" name="tags" value={formData.tags}
                  onChange={handleInput} disabled={isSubmitting}
                  placeholder="คั่นด้วยจุลภาค เช่น ข่าว, กีฬา, กิจกรรม"
                  className="avd-input"
                />
              </div>

              {isSubmitting && !editingVideo && uploadProgress > 0 && (
                <div className="avd-upload-status">
                  <div className="avd-upload-bar-wrap">
                    <div className="avd-upload-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p>กำลังอัพโหลด... {uploadProgress}%</p>
                </div>
              )}

              <div className="avd-modal-actions">
                <button type="button" className="avd-cancel-btn" onClick={closeModal} disabled={isSubmitting}>
                  ยกเลิก
                </button>
                <button type="submit" className="avd-save-btn" disabled={isSubmitting}>
                  {isSubmitting
                    ? (editingVideo ? 'กำลังบันทึก...' : 'กำลังอัพโหลด...')
                    : (editingVideo ? 'บันทึก' : 'อัพโหลด')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="avd-overlay" onClick={() => !isDeleting && setConfirmDelete(null)}>
          <div className="avd-modal avd-modal-sm" onClick={e => e.stopPropagation()}>
            <h2>ยืนยันการลบ</h2>
            <p>คุณแน่ใจหรือไม่? วิดีโอและไฟล์บน Cloudinary จะถูกลบถาวร</p>
            <div className="avd-modal-actions">
              <button className="avd-cancel-btn" onClick={() => setConfirmDelete(null)} disabled={isDeleting}>ยกเลิก</button>
              <button className="avd-del-confirm-btn" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVideoManagement;