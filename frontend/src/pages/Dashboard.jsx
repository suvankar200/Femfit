import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import CycleCalendar from '../components/Calendar';
import HealthCheckGrid from '../components/HealthCheckGrid';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AIChatbot from '../components/AIChatbot';
import { LogOut, Droplets, Sparkles, Activity, Heart, Pencil, X, Save, Baby, FileDown } from 'lucide-react';
import { startOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { generateHealthReport } from '../utils/pdfReport';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [cycleData, setCycleData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit Cycle Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ cycleLength: 28, periodDuration: 5, lastPeriodDate: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  // Pregnancy Mode
  const [pregnancyMode, setPregnancyMode] = useState(
    () => localStorage.getItem('pregnancyMode') === 'true'
  );

  const togglePregnancyMode = () => {
    const next = !pregnancyMode;
    setPregnancyMode(next);
    localStorage.setItem('pregnancyMode', String(next));
  };

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

  if (loading) return <div className="auth-container"><h2>{t('dash.loading')}</h2></div>;
  if (!cycleData || !predictions) return null;

  // PCOS check — show range if high/moderate band
  const pcosResult = assessments?.pcos?.result;
  const pcosHigh = pcosResult?.band === 'high' || pcosResult?.band === 'moderate';

  // Phase detection
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

  // PCOS: show ±7 day range
  const nextPeriodDisplay = pcosHigh
    ? `${fmt(new Date(nextPeriodDate.getTime() - 7 * 86400000))} – ${fmt(new Date(nextPeriodDate.getTime() + 7 * 86400000))}`
    : fmt(nextPeriodDate);

  const ovulationFormatted = fmt(predictions.ovulation);

  // Pregnancy mode guide cards
  const pregnancyTips = [
    { emoji: '🥗', title: 'Nutrition', desc: 'Eat iron-rich foods, folate, calcium. Small frequent meals help with nausea.' },
    { emoji: '😴', title: 'Sleep', desc: 'Sleep on your left side after 20 weeks. Use a pillow between your knees.' },
    { emoji: '🚶', title: 'Exercise', desc: 'Gentle walking 30 min/day is great. Avoid heavy lifting and high-impact sports.' },
    { emoji: '🧘', title: 'Mental Wellness', desc: 'Pregnancy mood swings are normal. Try prenatal yoga, breathing exercises.' },
    { emoji: '💊', title: 'Supplements', desc: 'Take folic acid 400mcg/day, Vitamin D, and iron as prescribed.' },
    { emoji: '🏥', title: 'Doctor Visits', desc: 'Schedule prenatal checkups monthly (1st & 2nd trimester), then every 2 weeks.' },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>{t('dash.hi')}, {user?.name?.split(' ')?.[0] ?? 'there'} 👋</h1>
          <p className="text-muted" style={{ margin: 0 }}>{t('dash.welcome')}</p>
        </div>
        <div className="dashboard-header-actions">
          <LanguageSwitcher />
          {/* Pregnancy Mode Toggle */}
          <button
            onClick={togglePregnancyMode}
            className={`btn ${pregnancyMode ? 'btn-pregnancy-active' : 'btn-outline'}`}
            style={{ width: 'auto', gap: '6px' }}
            title={pregnancyMode ? 'Exit Pregnancy Mode' : 'Enable Pregnancy Mode'}
          >
            <Baby size={15} />
            {pregnancyMode ? '🤰 Pregnancy Mode' : 'Pregnancy Mode'}
          </button>
          <button onClick={openEditModal} className="btn btn-outline" style={{ width: 'auto' }} title="Update your cycle date">
            <Pencil size={15} style={{ marginRight: '6px' }} /> Update Date
          </button>
          <button onClick={logout} className="btn btn-outline" style={{ width: 'auto' }}>
            <LogOut size={16} style={{ marginRight: '8px' }} /> {t('dash.logout')}
          </button>
        </div>
      </header>

      {/* ── PREGNANCY MODE ─────────────────────────────────────────────────── */}
      {pregnancyMode ? (
        <>
          <div className="pregnancy-mode-banner">
            <span style={{ fontSize: '2.5rem' }}>🤰</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#be185d' }}>Pregnancy Mode Active</h2>
              <p style={{ margin: 0, color: '#9d174d', fontSize: '0.95rem' }}>
                Period tracking is paused. Here's your pregnancy wellness guide.
              </p>
            </div>
          </div>
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            {pregnancyTips.map(tip => (
              <div key={tip.title} className="dashboard-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>{tip.emoji}</span>
                <div>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem' }}>{tip.title}</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Current Phase Card */}
          <div className="dashboard-card phase-hero">
            <div className="phase-hero-icon">{phaseIcon}</div>
            <div className="phase-hero-content">
              <h3 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>{t('dash.todayStatus')}</h3>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{currentPhase}</h2>
              <p className="text-muted" style={{ fontSize: '1rem', maxWidth: '550px', margin: 0 }}>{phaseDesc}</p>
              {phaseExtra && <span className="phase-extra-badge">{phaseExtra}</span>}
            </div>
          </div>

          {/* Prediction Cards */}
          <div className="grid-cols-2">
            <div className="dashboard-card prediction-card">
              <div className="prediction-icon-wrap" style={{ background: 'rgba(231, 76, 111, 0.1)' }}>
                <Droplets size={20} color="#e74c6f" />
              </div>
              <h3 className="text-muted" style={{ marginBottom: '0.25rem' }}>{t('dash.nextPeriod')}</h3>
              <p className="prediction-date" style={{ color: '#e74c6f', fontSize: pcosHigh ? '1.1rem' : undefined }}>{nextPeriodDisplay}</p>
              {pcosHigh
                ? <span className="prediction-countdown" style={{ color: '#f59e0b' }}>⚠️ PCOS range estimate</span>
                : <span className="prediction-countdown">{daysUntilPeriod} {daysUntilPeriod !== 1 ? t('dash.daysAway') : t('dash.dayAway')}</span>
              }
            </div>
            <div className="dashboard-card prediction-card">
              <div className="prediction-icon-wrap" style={{ background: 'rgba(91, 141, 239, 0.1)' }}>
                <Heart size={20} color="#5b8def" />
              </div>
              <h3 className="text-muted" style={{ marginBottom: '0.25rem' }}>{t('dash.ovulationDay')}</h3>
              <p className="prediction-date" style={{ color: '#5b8def' }}>{ovulationFormatted}</p>
            </div>
          </div>

          {/* Calendar */}
          <div className="dashboard-card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>{t('dash.cycleCalendar')}</h2>
            <CycleCalendar cycleData={cycleData} predictions={predictions} />
          </div>

          {/* Health Check-up Cards */}
          <HealthCheckGrid cycleData={cycleData} />

          {/* Download Report */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline"
              style={{ width: 'auto', gap: '8px' }}
              onClick={() => generateHealthReport({ user, cycleData, predictions, assessments })}
            >
              <FileDown size={16} /> Download Health Report (PDF)
            </button>
          </div>
        </>
      )}

      {/* AI Chatbot — always visible */}
      <AIChatbot cycleData={{ cycle: cycleData, predictions }} />

      {/* ── Edit Cycle Modal ──────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>✏️ Update Cycle Date</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Changed your period date or made a mistake? Update here — predictions will recalculate instantly.
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
