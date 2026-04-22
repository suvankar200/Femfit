import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { ASSESSMENT_MODULES, MODULE_ORDER, BAND_CONFIG } from '../data/assessmentData';
import { FlaskConical, ArrowRight, CheckCircle, Clock } from 'lucide-react';

const HealthCheckGrid = ({ cycleData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [latestResults, setLatestResults] = useState({});

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/assess/latest', config);
        setLatestResults(data);
      } catch (e) {
        // silently fail — just means no past assessments
      }
    };
    fetchLatest();
  }, [user.token]);

  // Smart insights based on cycle data
  const getSmartBadge = (moduleId) => {
    if (!cycleData) return null;
    if (moduleId === 'pcos' && cycleData.cycleLength > 35) {
      return t('health.irregularCycle');
    }
    if (moduleId === 'anemia' && cycleData.periodDuration > 5) {
      return t('health.heavyBleeding');
    }
    return null;
  };

  const getLastResult = (moduleId) => {
    const result = latestResults[moduleId];
    if (!result) return null;
    return result.result;
  };

  // Band label translation
  const getBandLabel = (moduleId, band) => {
    // Check for custom band labels per module
    const customKey = `band.${moduleId}.${band}`;
    const customLabel = t(customKey);
    if (customLabel !== customKey) return customLabel;

    // Default band labels
    const defaultKey = `band.${band}Risk`;
    const defaultLabel = t(defaultKey);
    if (defaultLabel !== defaultKey) return defaultLabel;

    return BAND_CONFIG[band]?.label || band;
  };

  return (
    <div className="health-check-section">
      <div className="health-check-header">
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>{t('health.title')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>
            {t('health.subtitle')}
          </p>
        </div>
      </div>

      <div className="health-grid">
        {MODULE_ORDER.map((moduleId) => {
          const mod = ASSESSMENT_MODULES[moduleId];
          const Icon = mod.icon;
          const smartBadge = getSmartBadge(moduleId);
          const lastResult = getLastResult(moduleId);

          return (
            <button
              key={moduleId}
              className="health-card"
              onClick={() => navigate(`/assess/${moduleId}`)}
              id={`health-card-${moduleId}`}
            >
              {smartBadge && (
                <span className="smart-badge">⚡ {smartBadge}</span>
              )}

              <div className="health-card-icon" style={{ background: mod.gradient }}>
                <Icon size={28} color="white" />
              </div>

              <h3 className="health-card-title">{t(`mod.${moduleId}.title`)}</h3>
              <p className="health-card-subtitle">{t(`mod.${moduleId}.subtitle`)}</p>

              {lastResult && lastResult.band && (
                <div 
                  className="health-card-badge"
                  style={{ 
                    color: BAND_CONFIG[lastResult.band]?.color,
                    background: BAND_CONFIG[lastResult.band]?.bg
                  }}
                >
                  <CheckCircle size={14} />
                  {getBandLabel(moduleId, lastResult.band)}
                </div>
              )}

              {lastResult && lastResult.bmi && (
                <div 
                  className="health-card-badge"
                  style={{ 
                    color: BAND_CONFIG[lastResult.band]?.color,
                    background: BAND_CONFIG[lastResult.band]?.bg
                  }}
                >
                  BMI: {lastResult.bmi} — {lastResult.category}
                </div>
              )}

              {!lastResult && (
                <div className="health-card-badge health-card-badge-new">
                  <Clock size={14} /> {t('health.takeAssessment')}
                </div>
              )}

              <ArrowRight size={18} className="health-card-arrow" />
            </button>
          );
        })}

        {/* Book My Test Card */}
        <button
          className="health-card health-card-test"
          onClick={() => navigate('/assess/test-recommendations')}
          id="health-card-tests"
        >
          <div className="health-card-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
            <FlaskConical size={28} color="white" />
          </div>
          <h3 className="health-card-title">{t('health.bookTest')}</h3>
          <p className="health-card-subtitle">{t('health.bookTestSub')}</p>
          <div className="health-card-badge health-card-badge-new">
            <FlaskConical size={14} /> {t('health.viewTests')}
          </div>
          <ArrowRight size={18} className="health-card-arrow" />
        </button>
      </div>
    </div>
  );
};

export default HealthCheckGrid;
