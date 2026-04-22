import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BAND_CONFIG } from '../data/assessmentData';
import { ArrowLeft, FlaskConical, CheckCircle, AlertTriangle, XCircle, Sparkles, Utensils, Activity, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

// ─────────────────────────────────────────────
//  AI Health Suggestions Panel
// ─────────────────────────────────────────────
const AISuggestions = ({ result, language }) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        // Build a context-rich prompt for suggestions
        let scoreInfo = '';
        if (result.bmi) {
          scoreInfo = `BMI: ${result.bmi} (Category: ${result.category}, Risk: ${result.band})`;
        } else if (result.points !== undefined) {
          scoreInfo = `Score: ${result.points}/${result.maxPoints} points (Risk Level: ${result.band?.toUpperCase()})`;
        }

        const contributorsList = result.contributors?.join(', ') || 'None identified';

        const prompt = `I just completed the "${result.title}" health assessment.
${scoreInfo}
Key risk factors identified: ${contributorsList}

Based on this result, please give me specific, practical suggestions in exactly this format:

🥗 FOOD & NUTRITION (3-4 specific foods or dietary tips relevant to my result)
🏃 LIFESTYLE & EXERCISE (3-4 specific daily habits, exercises, or routines)
💊 MEDICAL ACTIONS (2-3 things I should tell my doctor or tests I should consider)
⚠️ WARNING SIGNS (2 symptoms that mean I should see a doctor immediately)

Keep each point brief (1 sentence). Be practical and specific to Indian lifestyle. Do not repeat the diagnosis.`;

        const { data } = await axios.post('/api/chat', {
          message: prompt,
          language
        }, config);

        setSuggestions(data.reply || '');
        setLoading(false);
      } catch (e) {
        setError(true);
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [result.engine, result.band]);

  const parseSections = (text) => {
    if (!text) return null;

    const icons = {
      'FOOD': { icon: <Utensils size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
      'LIFESTYLE': { icon: <Activity size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
      'MEDICAL': { icon: <Stethoscope size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
      'WARNING': { icon: <AlertTriangle size={18} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    };

    const sectionPatterns = [
      { key: 'FOOD', pattern: /🥗[^🏃💊⚠️]*/s },
      { key: 'LIFESTYLE', pattern: /🏃[^🥗💊⚠️]*/s },
      { key: 'MEDICAL', pattern: /💊[^🥗🏃⚠️]*/s },
      { key: 'WARNING', pattern: /⚠️[^🥗🏃💊]*/s },
    ];

    const sections = [];
    for (const { key, pattern } of sectionPatterns) {
      const match = text.match(pattern);
      if (match) {
        const raw = match[0];
        const lines = raw.split('\n')
          .map(l => l.replace(/^[🥗🏃💊⚠️*•\-]+\s*/, '').trim())
          .filter(l => l.length > 5 && !l.toUpperCase().includes('FOOD') && !l.toUpperCase().includes('LIFESTYLE') && !l.toUpperCase().includes('MEDICAL') && !l.toUpperCase().includes('WARNING'));
        if (lines.length > 0) {
          sections.push({ key, lines, ...icons[key] });
        }
      }
    }

    return sections.length > 0 ? sections : null;
  };

  const sectionTitles = {
    FOOD: 'Food & Nutrition',
    LIFESTYLE: 'Lifestyle & Exercise',
    MEDICAL: 'Medical Actions',
    WARNING: 'Warning Signs',
  };

  const sections = parseSections(suggestions);

  return (
    <div className="ai-suggestions-card">
      <div className="ai-suggestions-header" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="ai-suggestions-icon-wrap">
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              AI Health Suggestions
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Personalised recommendations based on your result
            </p>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="ai-suggestions-body">
          {loading && (
            <div className="ai-suggestions-loading">
              <div className="ai-suggestion-skeleton"></div>
              <div className="ai-suggestion-skeleton" style={{ width: '80%' }}></div>
              <div className="ai-suggestion-skeleton" style={{ width: '90%' }}></div>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              Could not load suggestions. Please try again later.
            </p>
          )}

          {!loading && !error && sections && (
            <div className="ai-suggestions-sections">
              {sections.map(({ key, lines, icon, color, bg }) => (
                <div key={key} className="ai-suggestion-section" style={{ '--section-color': color, '--section-bg': bg }}>
                  <div className="ai-suggestion-section-title">
                    <span style={{ color }}>{icon}</span>
                    <strong style={{ color }}>{sectionTitles[key]}</strong>
                  </div>
                  <ul className="ai-suggestion-list">
                    {lines.slice(0, 4).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && !sections && suggestions && (
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-main)', padding: '0.5rem 0' }}>
              {suggestions}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  Main AssessmentResult Component
// ─────────────────────────────────────────────
const AssessmentResult = ({ result, moduleConfig }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (!result) return null;

  // Translate band label
  const getBandLabel = () => {
    const customKey = `band.${result.engine}.${result.band}`;
    const customLabel = t(customKey);
    if (customLabel !== customKey) return customLabel;
    
    const defaultKey = `band.${result.band}Risk`;
    const defaultLabel = t(defaultKey);
    if (defaultLabel !== defaultKey) return defaultLabel;

    return BAND_CONFIG[result.band]?.label || 'Unknown';
  };

  const bandLabel = getBandLabel();
  const bandColor = BAND_CONFIG[result.band]?.color || '#6b7280';
  const bandBg = BAND_CONFIG[result.band]?.bg || 'rgba(107, 114, 128, 0.1)';

  // For BMI, show the value prominently
  const isBmi = result.engine === 'bmi';

  // Score as percentage for the gauge
  const scorePercent = isBmi
    ? Math.min((result.bmi / 40) * 100, 100)
    : result.maxPoints > 0
      ? Math.min((result.points / result.maxPoints) * 100, 100)
      : 0;

  const BandIcon = result.band === 'low' ? CheckCircle : result.band === 'moderate' ? AlertTriangle : XCircle;

  return (
    <div className="result-container">
      <div className="result-card">
        {/* Header */}
        <div className="result-header">
          <h2>{result.title}</h2>
          <p className="text-muted">{t('result.title')}</p>
        </div>

        {/* Score Gauge */}
        <div className="result-gauge-container">
          <div className="result-gauge">
            <svg viewBox="0 0 120 120" className="result-gauge-svg">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={bandColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${scorePercent * 3.27} 327`}
                transform="rotate(-90 60 60)"
                className="result-gauge-fill"
              />
            </svg>
            <div className="result-gauge-value">
              {isBmi ? (
                <>
                  <span className="result-gauge-number">{result.bmi}</span>
                  <span className="result-gauge-label">{result.category}</span>
                </>
              ) : (
                <>
                  <span className="result-gauge-number">{result.points}</span>
                  <span className="result-gauge-label">/ {result.maxPoints} pts</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Band Badge */}
        <div className="result-band" style={{ color: bandColor, background: bandBg }}>
          <BandIcon size={20} />
          <span>{bandLabel}</span>
        </div>

        {/* Recommendation */}
        <div className="result-recommendation">
          <h3>{t('result.recommendation')}</h3>
          <p>{result.recommendation}</p>
        </div>

        {/* Contributors */}
        {result.contributors && result.contributors.length > 0 && (
          <div className="result-contributors">
            <h3>{t('result.contributors')}</h3>
            <ul>
              {result.contributors.map((c, i) => (
                <li key={i}>
                  <span className="contributor-dot" style={{ background: bandColor }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Test */}
        {result.recommendedTest && (
          <div className="result-test-cta">
            <FlaskConical size={20} />
            <div>
              <strong>{t('result.recommendedTest')}</strong> {result.recommendedTest}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="result-actions">
          <button className="btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            {t('result.backToDashboard')}
          </button>
          {result.recommendedTest && (
            <button 
              className="btn btn-outline" 
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate('/assess/test-recommendations')}
            >
              <FlaskConical size={16} style={{ marginRight: '8px' }} />
              {t('result.bookTest')}
            </button>
          )}
        </div>
      </div>

      {/* ── AI Health Suggestions ── */}
      <AISuggestions result={result} language={language} />
    </div>
  );
};

export default AssessmentResult;
