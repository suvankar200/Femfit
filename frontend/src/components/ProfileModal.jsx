import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ user, onClose }) => {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', dateOfBirth: '' });
  const [avatar, setAvatar] = useState(() => localStorage.getItem('profileAvatar') || null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();

  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => {
    axios.get('/api/user/profile', config)
      .then(({ data }) => {
        setForm({ name: data.name || '', dateOfBirth: data.dateOfBirth || '' });
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { setError('Image too large — max 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setAvatar(base64);
      localStorage.setItem('profileAvatar', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.'); return;
    }
    setLoading(true);
    try {
      const { data } = await axios.patch('/api/user/profile', form, config);
      // ✅ Update AuthContext + localStorage so header reflects new name instantly
      updateUser({ name: data.name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally { setLoading(false); }
  };

  const initials = (form.name || user?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const age = form.dateOfBirth
    ? Math.floor((new Date() - new Date(form.dateOfBirth)) / (365.25 * 86400000))
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card profile-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>👤 My Profile</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {fetching ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Loading…</p>
        ) : (
          <>
            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
                {avatar
                  ? <img src={avatar} alt="Profile" className="profile-avatar-img" />
                  : <div className="profile-avatar-initials">{initials}</div>
                }
                <div className="profile-avatar-overlay"><Camera size={18} color="white" /></div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{form.name || user?.name}</p>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>{user?.email}</p>
                {age !== null && <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Age: {age} years</p>}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '0.6rem 1rem', color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>
                ✅ Profile saved!
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={user?.email || ''} disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" className="form-control" value={form.dateOfBirth}
                  onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]} />
              </div>
              <button type="submit" className="btn" disabled={loading} style={{ marginTop: '0.25rem' }}>
                <Save size={15} style={{ marginRight: '8px' }} />
                {loading ? 'Saving…' : 'Save Profile'}
              </button>
            </form>

            {/* Remove avatar */}
            {avatar && (
              <button className="btn btn-outline" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                onClick={() => { setAvatar(null); localStorage.removeItem('profileAvatar'); }}>
                Remove Photo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
