import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiOutlineCamera, HiArrowLeft } from "react-icons/hi";
import '../css/Profile.css';

function Profile() {
  const { user, updateUser } = useAuth();  // ✅ ใช้ updateUser แทน login
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const profileInputRef    = useRef(null);
  const backgroundInputRef = useRef(null);

  const avatars = [
    { id: 1, url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
    { id: 2, url: 'https://cdn-icons-png.flaticon.com/512/616/616430.png' },
    { id: 3, url: 'https://cdn-icons-png.flaticon.com/512/616/616412.png' },
    { id: 4, url: 'https://cdn-icons-png.flaticon.com/512/616/616428.png' },
    { id: 5, url: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
    { id: 6, url: 'https://cdn-icons-png.flaticon.com/512/616/616432.png' },
  ];

  const [formData, setFormData] = useState({
    fullName:        '',
    profileImage:    '',
    backgroundImage: '',
    profileFile:     null,
    backgroundFile:  null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName:        user.fullName        || '',
        profileImage:    user.profileImage    || avatars[0].url,
        backgroundImage: user.backgroundImage || '',
        profileFile:     null,
        backgroundFile:  null,
      });
    }
  }, [user]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ไฟล์มีขนาดใหญ่เกินไป (จำกัด 3MB)' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'profile') {
        setFormData(prev => ({ ...prev, profileImage: reader.result, profileFile: file }));
      } else {
        setFormData(prev => ({ ...prev, backgroundImage: reader.result, backgroundFile: file }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSelect = (url) => {
    setFormData(prev => ({ ...prev, profileImage: url, profileFile: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);

      if (formData.profileFile) {
        data.append('profileImage', formData.profileFile);
      } else {
        data.append('profileImage', formData.profileImage);
      }

      if (formData.backgroundFile) {
        data.append('backgroundImage', formData.backgroundFile);
      } else if (formData.backgroundImage) {
        data.append('backgroundImage', formData.backgroundImage);
      }

      const response = await authAPI.updateProfile(data);

      if (response.data.success || response.status === 200) {
        // ✅ แก้: ใช้ updateUser() แทน login()
        // updateUser() จะ merge เฉพาะ fields ที่เปลี่ยน ไม่ overwrite ทั้งหมด
        updateUser(response.data.user);
        setMessage({ type: 'success', text: 'บันทึกข้อมูลและอัปเดตโปรไฟล์เรียบร้อยแล้ว' });
        // รีเซ็ต file inputs
        setFormData(prev => ({ ...prev, profileFile: null, backgroundFile: null }));
      }
    } catch (err) {
      console.error('Update Error Details:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page-bg">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header-nav">
          <button onClick={() => window.history.back()} className="back-btn"><HiArrowLeft /></button>
          <div className="header-text">
            <h1>แก้ไขโปรไฟล์</h1>
            <p>จัดการข้อมูลส่วนตัวและรูปภาพ</p>
          </div>
        </div>

        <div className="profile-main-card">
          <form onSubmit={handleSubmit}>
            <div className="profile-grid">
              {/* ฝั่งซ้าย: รูปโปรไฟล์ */}
              <div className="profile-left-section">
                <label className="section-label">🧠 รูปโปรไฟล์</label>
                <div className="current-avatar-display">
                  <img src={formData.profileImage} alt="Profile" />
                </div>

                <div className="avatar-selection-grid">
                  {avatars.map((av) => (
                    <div
                      key={av.id}
                      className={`avatar-item ${formData.profileImage === av.url ? 'active' : ''}`}
                      onClick={() => handleAvatarSelect(av.url)}
                    >
                      <img src={av.url} alt="avatar" />
                    </div>
                  ))}
                </div>

                <input
                  type="file" ref={profileInputRef} hidden accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profile')}
                />
                <div className="upload-box-dashed mt-4" onClick={() => profileInputRef.current.click()}>
                  <div className="upload-content">
                    <HiOutlineCamera className="upload-icon" />
                    <p>อัปโหลดรูปภาพของคุณเอง</p>
                  </div>
                </div>
              </div>

              {/* ฝั่งขวา: พื้นหลัง & ชื่อ */}
              <div className="profile-right-section">
                <label className="section-label">🖼️ รูปพื้นหลังโปรไฟล์</label>
                <div className="bg-preview-box">
                  {formData.backgroundImage ? (
                    <img src={formData.backgroundImage} alt="BG" className="bg-preview-img" />
                  ) : (
                    <div className="empty-bg">เลือกรูปพื้นหลัง</div>
                  )}
                </div>

                <input
                  type="file" ref={backgroundInputRef} hidden accept="image/*"
                  onChange={(e) => handleFileChange(e, 'background')}
                />
                <div className="upload-box-dashed mt-3" onClick={() => backgroundInputRef.current.click()}>
                  <div className="upload-content">
                    <HiOutlineCamera className="upload-icon" />
                    <p>เปลี่ยนรูปพื้นหลัง</p>
                  </div>
                </div>

                <div className="info-form-section mt-4">
                  <div className="form-group-custom">
                    <label>📝 ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      placeholder="กรอกชื่อของคุณ"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-footer-actions">
              {message.text && (
                <div className={`status-msg ${message.type}`}>{message.text}</div>
              )}
              <div className="btn-group">
                <button type="button" className="btn-cancel" onClick={() => window.location.reload()}>
                  คืนค่าเดิม
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;