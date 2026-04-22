import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import CycleCalendar from '../components/Calendar';
import HealthCheckGrid from '../components/HealthCheckGrid';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AIChatbot from '../components/AIChatbot';
import { LogOut, Droplets, Sparkles, Activity, Heart } from 'lucide-react';
import { startOfDay, isWithinInterval, isSameDay } from 'date-fns';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [cycleData, setCycleData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCycleData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/cycle', config);
        setCycleData(data.cycle);
        setPredictions(data.predictions);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 401) {
          // Token is invalid/expired — clear session and redirect to login
          logout();
          navigate('/login');
        } else if (error.response?.status === 404) {
          navigate('/onboarding');
        } else {
          setLoading(false);
        }
      }
    };
    fetchCycleData();
  }, [navigate, user.token]);

  if (loading) return <div className="auth-container"><h2>{t('dash.loading')}</h2></div>;
  if (!cycleData || !predictions) return null;

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
      const follicularStart = startOfDay(new Date(predictions.follicularStart));
      const follicularEnd = startOfDay(new Date(predictions.follicularEnd));
      const ovulationDay = startOfDay(new Date(predictions.ovulation));
      const lutealStart = startOfDay(new Date(predictions.lutealStart));
      const lutealEnd = startOfDay(new Date(predictions.lutealEnd));

      if (isWithinInterval(today, { start: follicularStart, end: follicularEnd })) {
        currentPhase = t('phase.follicular');
        phaseIcon = <Sparkles color="#f472b6" size={32} />;
        phaseDesc = t('phase.follicularDesc');
      } else if (isSameDay(today, ovulationDay)) {
        currentPhase = t('phase.ovulation');
        phaseIcon = <Heart color="#5b8def" size={32} />;
        phaseDesc = t('phase.ovulationDesc');
      } else if (isWithinInterval(today, { start: lutealStart, end: lutealEnd })) {
        currentPhase = t('phase.luteal');
        phaseIcon = <Activity color="#a78bfa" size={32} />;
        phaseDesc = t('phase.lutealDesc');
      }
    } catch { /* fallback to luteal */ }
  }

  const nextPeriodDate = new Date(predictions.nextPeriod);
  const daysUntilPeriod = Math.ceil((nextPeriodDate - today) / (1000 * 60 * 60 * 24));
  const nextPeriodFormatted = nextPeriodDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const ovulationFormatted = new Date(predictions.ovulation).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>{t('dash.hi')}, {user?.name?.split(' ')?.[0] ?? 'there'} 👋</h1>
          <p className="text-muted" style={{ margin: 0 }}>{t('dash.welcome')}</p>
        </div>
        <div className="dashboard-header-actions">
          <LanguageSwitcher />
          <button onClick={logout} className="btn btn-outline" style={{ width: 'auto' }}>
            <LogOut size={16} style={{ marginRight: '8px' }}/> {t('dash.logout')}
          </button>
        </div>
      </header>

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
          <p className="prediction-date" style={{ color: '#e74c6f' }}>{nextPeriodFormatted}</p>
          <span className="prediction-countdown">{daysUntilPeriod} {daysUntilPeriod !== 1 ? t('dash.daysAway') : t('dash.dayAway')}</span>
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

      {/* AI Chatbot */}
      <AIChatbot cycleData={{ cycle: cycleData, predictions }} />
    </div>
  );
};

export default Dashboard;
