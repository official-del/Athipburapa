import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commentAPI } from '../services/api';
import api from '../services/api';
import { Link } from 'react-router-dom';
import './CommentSection.css';

const getInitials = (fullName, username) => {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return fullName[0].toUpperCase();
  }
  if (username) return username[0].toUpperCase();
  return '?';
};

// ✅ รองรับทั้ง newsId และ videoId
function CommentSection({ newsId, videoId }) {
  const { user } = useAuth();
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const targetId = newsId || videoId;
  const isVideo  = !!videoId;

  useEffect(() => {
    if (targetId && /^[a-fA-F0-9]{24}$/.test(targetId)) {
      fetchComments();
    }
  }, [targetId]);

  const fetchComments = async () => {
    try {
      let response;
      if (isVideo) {
        response = await api.get(`/comments/video/${videoId}`);
        setComments(response.data || []);
      } else {
        response = await commentAPI.getByNewsId(newsId);
        setComments(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setError('กรุณาใส่ข้อความคอมเมนต์');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // ✅ ส่ง newsId หรือ videoId ตามที่ได้รับมา
      const payload = isVideo
        ? { videoId, content: newComment }
        : { newsId,  content: newComment };

      const response = await commentAPI.create(payload);
      if (response.data.comment) {
        setComments([response.data.comment, ...comments]);
      } else {
        fetchComments();
      }
      setNewComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('คุณต้องการลบคอมเมนต์นี้หรือไม่?')) return;
    try {
      await commentAPI.delete(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบคอมเมนต์');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (!targetId || !/^[a-fA-F0-9]{24}$/.test(targetId)) return null;

  return (
    <div className="comment-section">
      <h3 className="comment-title">ความคิดเห็น ({comments.length})</h3>

      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          {error && <div className="comment-error">{error}</div>}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="แสดงความคิดเห็น..."
            rows="4"
            className="comment-textarea"
          />
          <button type="submit" className="comment-submit-btn" disabled={loading}>
            {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
          </button>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p><Link to="/login">เข้าสู่ระบบ</Link> เพื่อแสดงความคิดเห็น</p>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <div className="comment-author-avatar">
                    {getInitials(comment.userId?.fullName, comment.userId?.username)}
                  </div>
                  <strong>{comment.userId?.fullName || 'ผู้ใช้'}</strong>
                  <span className="comment-username">@{comment.userId?.username || 'unknown'}</span>
                </div>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="comment-content">{comment.content}</p>
              {user && (user.id === comment.userId?._id || user._id === comment.userId?._id) && (
                <button onClick={() => handleDelete(comment._id)} className="comment-delete-btn">
                  ลบ
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentSection;