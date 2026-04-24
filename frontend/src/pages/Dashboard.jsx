import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import CycleCalendar from '../components/Calendar';
import HealthCheckGrid from '../components/HealthCheckGrid';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AIChatbot from '../components/AIChatbot';
import ProfileModal from '../components/ProfileModal';
import PregnancyMode from '../components/PregnancyMode';
import { LogOut, Droplets, Sparkles, Activity, Heart, Pencil, X, Save, Baby, FileDown } from 'lucide-react';
import { startOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { generateHealthReport } from '../utils/pdfReport';

// ── Avatar bubble — initials only ────────────────────────────────────────────
const AvatarBubble = ({ name, onClick }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <button onClick={onClick} title="My Profile" className="avatar-bubble">
      <span className="avatar-initials">{initials}</span>
    </button>
  );
};

// ── Icon-only button ──────────────────────────────────────────────────────────
const IconBtn = ({ onClick, title, children }) => (
  <button onClick={onClick} title={title} className="header-icon-btn">
    {children}
  </button>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [cycleData, setCycleData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);

  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ cycleLength: 28, periodDuration: 5, lastPeriodDate: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const [pregnancyMode, setPregnancyMode] = useState(
    () => localStorage.getItem('pregnancyMode') === 'true'
  );

  // PCOS period window confirmation
  const [pcosBannerDate, setPcosBannerDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [pcosBannerLoading, setPcosBannerLoading] = useState(false);
  const [pcosBannerDone, setPcosBannerDone] = useState(false);
  const [showPcosDatePicker, setShowPcosDatePicker] = useState(false);

  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  const fetchAll = useCallback(async () => {
    try {
      const [cycleRes, assessRes] = await Promise.all([
        axios.get('/api/cycle', config),
        axios.get('/api/assess/latest', config).catch(() => ({ data: {} })),
      ]);
      setCycleData(cycleRes.data.cycle);
      setPredictions(cycleRes.data.predictions);
      setAssessments(assessRes.data || {});
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) { logout(); navigate('/login'); }
      else if (error.response?.status === 404) { navigate('/onboarding'); }
      else setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openEditModal = () => {
    setEditForm({
      cycleLength: cycleData?.cycleLength || 28,
      periodDuration: cycleData?.periodDuration || 5,
      lastPeriodDate: cycleData?.lastPeriodDate
        ? new Date(cycleData.lastPeriodDate).toISOString().split('T')[0] : ''
    });
    setEditError(''); setEditSuccess(false); setShowEditModal(true);
  };

  const handleUpdateCycle = async (e) => {
    e.preventDefault();
    setEditError(''); setEditSuccess(false);
    if (new Date(editForm.lastPeriodDate) > new Date()) {
      setEditError('Last period date cannot be in the future.'); return;
    }
    if (editForm.cycleLength < 20 || editForm.cycleLength > 45) {
      setEditError('Cycle length must be between 20 and 45 days.'); return;
    }
    setEditLoading(true);
    try {
      await axios.post('/api/cycle', {
        cycleLength: Number(editForm.cycleLength),
        periodDuration: Number(editForm.periodDuration),
        lastPeriodDate: editForm.lastPeriodDate
      }, config);
      setEditSuccess(true);
      setTimeout(() => { setShowEditModal(false); setLoading(true); fetchAll(); }, 1200);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally { setEditLoading(false); }
  };

  const togglePregnancyMode = () => {
    const next = !pregnancyMode;
    setPregnancyMode(next);
    localStorage.setItem('pregnancyMode', String(next));
    if (!next) localStorage.removeItem('pregnancyDueDate');
  };

  // PCOS: user confirms their actual period start date
  const handlePcosDateConfirm = async () => {
    if (!pcosBannerDate) return;
    setPcosBannerLoading(true);
    try {
      await axios.post('/api/cycle', {
        cycleLength: cycleData.cycleLength,
        periodDuration: cycleData.periodDuration,
        lastPeriodDate: pcosBannerDate,
      }, config);
      // Mark as done for this prediction window
      const key = `pcosLogged_${predictions.nextPeriod?.split('T')[0]}`;
      localStorage.setItem(key, 'true');
      setPcosBannerDone(true);
      setLoading(true);
      fetchAll();
    } catch {
      // silently fail — user can still use Update Date button
    } finally {
      setPcosBannerLoading(false);
    }
  };

  const dismissPcosBanner = () => {
    const key = `pcosLogged_${predictions?.nextPeriod?.split('T')[0]}`;
    localStorage.setItem(key, 'true');
    setPcosBannerDone(true);
  };

  if (loading) return <div className="auth-container"><h2>{t('dash.loading')}</h2></div>;
  if (!cycleData || !predictions) return null;

  const pcosResult = assessments?.pcos?.result;
  const pcosHigh = pcosResult?.band === 'high' || pcosResult?.band === 'moderate';

  const today = startOfDay(new Date());
  let currentPhase = t('phase.luteal');
  let phaseIcon = <Activity color="#a78bfa" size={32} />;
  let phaseDesc = t('phase.lutealDesc');
  let phaseExtra = null;

  if (predictions.isOnPeriod) {
    const dayNum = predictions.periodDay;
    currentPhase = `${t('phase.periodDay')} ${dayNum}`;
    phaseIcon = <Droplets color="#e74c6f" size={32} />;
    phaseDesc = t('phase.periodDesc', { day: dayNum });
    const remaining = cycleData.periodDuration - dayNum;
    if (remaining > 0) phaseExtra = `${remaining} ${t('dash.remaining')}`;
  } else {
    try {
      const fS = startOfDay(new Date(predictions.follicularStart));
      const fE = startOfDay(new Date(predictions.follicularEnd));
      const ov = startOfDay(new Date(predictions.ovulation));
      const lS = startOfDay(new Date(predictions.lutealStart));
      const lE = startOfDay(new Date(predictions.lutealEnd));
      if (isWithinInterval(today, { start: fS, end: fE })) {
        currentPhase = t('phase.follicular'); phaseIcon = <Sparkles color="#f472b6" size={32} />; phaseDesc = t('phase.follicularDesc');
      } else if (isSameDay(today, ov)) {
        currentPhase = t('phase.ovulation'); phaseIcon = <Heart color="#5b8def" size={32} />; phaseDesc = t('phase.ovulationDesc');
      } else if (isWithinInterval(today, { start: lS, end: lE })) {
        currentPhase = t('phase.luteal'); phaseIcon = <Activity color="#a78bfa" size={32} />; phaseDesc = t('phase.lutealDesc');
      }
    } catch { /* fallback */ }
  }

  const nextPeriodDate = new Date(predictions.nextPeriod);
  const daysUntilPeriod = Math.ceil((nextPeriodDate - today) / (1000 * 60 * 60 * 24));
  const fmt = (d, opts) => new Date(d).toLocaleDateString(undefined, opts || { month: 'short', day: 'numeric' });
  const nextPeriodDisplay = pcosHigh
    ? `${fmt(new Date(nextPeriodDate.getTime() - 7 * 86400000))} – ${fmt(new Date(nextPeriodDate.getTime() + 7 * 86400000))}`
    : fmt(nextPeriodDate);
  const ovulationFormatted = fmt(predictions.ovulation);

  // PCOS window: is today within nextPeriod ±7 days?
  const pcosWindowStartISO = new Date(nextPeriodDate.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const pcosWindowEndISO   = new Date(nextPeriodDate.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const pcosWindowStart    = startOfDay(new Date(nextPeriodDate.getTime() - 7 * 86400000));
  const pcosWindowEnd      = startOfDay(new Date(nextPeriodDate.getTime() + 7 * 86400000));
  const inPcosWindow = pcosHigh && today >= pcosWindowStart && today <= pcosWindowEnd && !predictions.isOnPeriod;
  const pcosWindowKey = `pcosLogged_${predictions.nextPeriod?.split('T')[0]}`;
  const pcosAlreadyLogged = localStorage.getItem(pcosWindowKey) === 'true';
  const showPcosButton = inPcosWindow && !pcosAlreadyLogged && !pcosBannerDone;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {/* Left: Avatar + Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AvatarBubble name={user?.name} onClick={() => setShowProfile(true)} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
              {t('dash.hi')}, {user?.name?.split(' ')?.[0] ?? 'there'} 👋
            </h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>
              {t('dash.welcome')}
            </p>
          </div>
        </div>

        {/* Right: Compact Actions */}
        <div className="dashboard-header-actions">
          <LanguageSwitcher />
          <button
            onClick={togglePregnancyMode}
            title={pregnancyMode ? 'Exit Pregnancy Mode' : 'Enable Pregnancy Mode'}
            className={`header-pill-btn ${pregnancyMode ? 'header-pill-active' : ''}`}
          >
            <Baby size={14} />
            <span>{pregnancyMode ? 'Pregnancy ✓' : 'Pregnancy'}</span>
          </button>
          <IconBtn onClick={openEditModal} title="Update period date">
            <Pencil size={16} />
          </IconBtn>
          <IconBtn onClick={logout} title="Logout">
            <LogOut size={16} />
          </IconBtn>
        </div>
      </header>

      {/* ── PREGNANCY MODE ───────────────────────────────────────────────── */}
      {pregnancyMode ? (
        <PregnancyMode onExit={togglePregnancyMode} />
      ) : (
        <>
          <div className="dashboard-card phase-hero">
            <div className="phase-hero-icon">{phaseIcon}</div>
            <div className="phase-hero-content">
              <h3 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>{t('dash.todayStatus')}</h3>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{currentPhase}</h2>
              <p className="text-muted" style={{ fontSize: '1rem', maxWidth: '550px', margin: 0 }}>{phaseDesc}</p>
              {phaseExtra && <span className="phase-extra-badge">{phaseExtra}</span>}
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="dashboard-card prediction-card">
              <div className="prediction-icon-wrap" style={{ background: 'rgba(231, 76, 111, 0.1)' }}>
                <Droplets size={20} color="#e74c6f" />
              </div>
              <h3 className="text-muted" style={{ marginBottom: '0.25rem' }}>{t('dash.nextPeriod')}</h3>
              <p className="prediction-date" style={{ color: '#e74c6f', fontSize: pcosHigh ? '1.05rem' : undefined }}>{nextPeriodDisplay}</p>
              {pcosHigh
                ? <span className="prediction-countdown" style={{ color: '#f59e0b' }}>⚠️ PCOS range estimate</span>
                : <span className="prediction-countdown">{daysUntilPeriod} {daysUntilPeriod !== 1 ? t('dash.daysAway') : t('dash.dayAway')}</span>
              }

              {/* ─ PCOS Start Date Button ─ only active inside the ±7-day window ─ */}
              {showPcosButton && !showPcosDatePicker && (
                <button
                  className="pcos-start-btn"
                  onClick={() => setShowPcosDatePicker(true)}
                >
                  🩸 Period started? Set date
                </button>
              )}

              {showPcosButton && showPcosDatePicker && (
                <div className="pcos-inline-picker">
                  <input
                    type="date"
                    className="pcos-date-input"
                    value={pcosBannerDate}
                    min={pcosWindowStartISO}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setPcosBannerDate(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      className="pcos-confirm-btn"
                      onClick={handlePcosDateConfirm}
                      disabled={pcosBannerLoading}
                    >
                      {pcosBannerLoading ? 'Saving…' : '✓ Confirm'}
                    </button>
                    <button
                      className="pcos-dismiss-btn"
                      onClick={() => setShowPcosDatePicker(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="dashboard-card prediction-card">
              <div className="prediction-icon-wrap" style={{ background: 'rgba(91, 141, 239, 0.1)' }}>
                <Heart size={20} color="#5b8def" />
              </div>
              <h3 className="text-muted" style={{ marginBottom: '0.25rem' }}>{t('dash.ovulationDay')}</h3>
              <p className="prediction-date" style={{ color: '#5b8def' }}>{ovulationFormatted}</p>
            </div>
          </div>

          <div className="dashboard-card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>{t('dash.cycleCalendar')}</h2>
            <CycleCalendar cycleData={cycleData} predictions={predictions} />
          </div>

          <HealthCheckGrid cycleData={cycleData} />

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn btn-outline" style={{ width: 'auto', gap: '8px' }}
              onClick={() => generateHealthReport({ user, cycleData, predictions, assessments, language })}>
              <FileDown size={16} /> Download Health Report
            </button>
          </div>
        </>
      )}

      <AIChatbot cycleData={{ cycle: cycleData, predictions }} />

      {/* Profile Modal */}
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}

      {/* Edit Cycle Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>✏️ Update Cycle Date</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Changed your period date or made a mistake? Predictions recalculate instantly.
            </p>
            {editError && <div className="error-message">{editError}</div>}
            {editSuccess && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '0.75rem 1rem', color: '#10b981', marginBottom: '1rem' }}>
                ✅ Updated! Refreshing...
              </div>
            )}
            <form onSubmit={handleUpdateCycle}>
              <div className="form-group">
                <label>Last Period Start Date</label>
                <input type="date" className="form-control" value={editForm.lastPeriodDate}
                  onChange={e => setEditForm(p => ({ ...p, lastPeriodDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-group">
                <label>Cycle Length (days)</label>
                <input type="number" className="form-control" value={editForm.cycleLength}
                  onChange={e => setEditForm(p => ({ ...p, cycleLength: e.target.value }))}
                  min="20" max="45" required />
              </div>
              <div className="form-group">
                <label>Period Duration (days)</label>
                <input type="number" className="form-control" value={editForm.periodDuration}
                  onChange={e => setEditForm(p => ({ ...p, periodDuration: e.target.value }))}
                  min="1" max="10" required />
              </div>
              <button type="submit" className="btn" disabled={editLoading} style={{ marginTop: '0.5rem' }}>
                <Save size={16} style={{ marginRight: '8px' }} />
                {editLoading ? 'Saving...' : 'Save & Recalculate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
