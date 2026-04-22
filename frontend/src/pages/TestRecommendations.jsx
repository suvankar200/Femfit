import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { ArrowLeft, FlaskConical, CheckCircle, Phone, MapPin, Mail, AlertTriangle, XCircle, Copy, ClipboardCheck } from 'lucide-react';
import { BAND_CONFIG } from '../data/assessmentData';

// Map assessment types to urgency and specific test info
const TEST_MAP = {
  bmi: {
    high:     { test: 'Fasting Blood Sugar + Lipid Profile', reason: 'High BMI increases risk of diabetes and heart disease', urgency: 'urgent' },
    moderate: { test: 'Blood Pressure Check + Thyroid (TSH)', reason: 'Moderate BMI risk — thyroid issues can affect weight', urgency: 'recommended' },
    low:      { test: 'Vitamin D + B12 Level Check', reason: 'Underweight can cause nutritional deficiencies', urgency: 'optional' },
  },
  pcos: {
    high:     { test: 'Hormone Panel (LH, FSH, Testosterone, AMH) + Pelvic Ultrasound', reason: 'High PCOS risk needs hormonal and imaging evaluation', urgency: 'urgent' },
    moderate: { test: 'Hormone Panel (LH, FSH) + Fasting Insulin', reason: 'Moderate PCOS risk — check hormones and insulin resistance', urgency: 'recommended' },
    low:      null,
  },
  anemia: {
    high:     { test: 'CBC (Complete Blood Count) + Serum Ferritin + Vitamin B12', reason: 'High anemia risk — check hemoglobin and iron stores urgently', urgency: 'urgent' },
    moderate: { test: 'CBC (Complete Blood Count)', reason: 'Moderate anemia risk — hemoglobin check recommended', urgency: 'recommended' },
    low:      null,
  },
  idi: {
    high:     { test: 'Serum Ferritin + Serum Iron + TIBC', reason: 'Iron deficiency detected — detailed iron panel needed', urgency: 'urgent' },
    moderate: { test: 'Serum Ferritin', reason: 'Possible iron deficiency — ferritin check recommended', urgency: 'recommended' },
    low:      null,
  },
  mental: {
    high:     { test: 'Mental Health Consultation + Cortisol Level', reason: 'High mental health risk — professional assessment needed', urgency: 'urgent' },
    moderate: { test: 'Thyroid (TSH) + Vitamin D', reason: 'Mental health issues can be linked to thyroid and Vitamin D', urgency: 'recommended' },
    low:      null,
  },
  infection: {
    high:     { test: 'Vaginal Swab / Pap Smear + CRP (Inflammation test)', reason: 'Infection risk detected — microbiological testing needed', urgency: 'urgent' },
    moderate: { test: 'Urine Culture + CRP', reason: 'Possible infection — basic tests to rule out UTI/infection', urgency: 'recommended' },
    low:      null,
  },
  lifestyle: {
    high:     { test: 'Fasting Blood Sugar + Lipid Profile + Vitamin D + B12', reason: 'Poor lifestyle patterns detected — metabolic panel recommended', urgency: 'recommended' },
    moderate: { test: 'Vitamin D + B12', reason: 'Lifestyle gaps — nutritional deficiencies are common', urgency: 'optional' },
    low:      null,
  },
};

const URGENCY_CONFIG = {
  urgent:      { label: 'URGENT', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={16} /> },
  recommended: { label: 'RECOMMENDED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <AlertTriangle size={16} /> },
  optional:    { label: 'OPTIONAL', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: <CheckCircle size={16} /> },
};

const TestRecommendations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [latestBands, setLatestBands] = useState({});
  const [latestScores, setLatestScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data: latest } = await axios.get('/api/assess/latest', config);
        const bands = {};
        const scores = {};
        for (const [type, assessment] of Object.entries(latest)) {
          if (assessment?.result?.band) {
            bands[type] = assessment.result.band;
            scores[type] = assessment.result;
          }
        }
        setLatestBands(bands);
        setLatestScores(scores);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <h2>{t('test.loadingRec')}</h2>
        </div>
      </div>
    );
  }

  // Build the test recommendations from assessment bands
  const recommendedTests = [];
  for (const [type, band] of Object.entries(latestBands)) {
    const testInfo = TEST_MAP[type]?.[band];
    if (testInfo) {
      recommendedTests.push({ ...testInfo, assessmentType: type, band, score: latestScores[type] });
    }
  }

  // Sort: urgent first, then recommended, then optional
  const urgencyOrder = { urgent: 0, recommended: 1, optional: 2 };
  recommendedTests.sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9));

  // Build "Tell the Doctor" copyable message
  const buildDoctorMessage = () => {
    if (recommendedTests.length === 0) return '';
    const lines = recommendedTests.map(t => `• ${t.test} (${t.urgency.toUpperCase()}) — Reason: ${t.reason}`);
    return `Hello Doctor,\n\nI would like to book the following tests based on my health assessment results:\n\n${lines.join('\n')}\n\nPlease advise. Thank you.`;
  };

  const doctorMessage = buildDoctorMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(doctorMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Band label helper
  const getBandLabel = (moduleId, band) => {
    const config = BAND_CONFIG[band];
    return config?.label || band;
  };

  const availableTests = [
    { name: 'CBC (Complete Blood Count)', desc: 'Checks hemoglobin, RBC, WBC, and platelets', price: '₹300–500' },
    { name: 'Hormone Panel', desc: 'LH, FSH, Testosterone, DHEA-S, AMH, Thyroid (TSH)', price: '₹2,000–4,000' },
    { name: 'Vitamin D & B12', desc: 'Nutritional deficiency screening — very common in India', price: '₹500–900' },
    { name: 'Serum Ferritin + Iron', desc: 'Measures iron stores and detects deficiency', price: '₹400–700' },
    { name: 'Fasting Blood Sugar + HbA1c', desc: 'Diabetes risk and blood sugar control', price: '₹300–600' },
    { name: 'Lipid Profile', desc: 'Cholesterol — heart disease risk marker', price: '₹400–700' },
    { name: 'Pap Smear', desc: 'Cervical cancer and infection screening', price: '₹600–1,200' },
    { name: 'Thyroid Panel (TSH, T3, T4)', desc: 'Thyroid function — affects periods, weight, and mood', price: '₹500–900' },
  ];

  return (
    <div className="wizard-container">
      <div className="wizard-card" style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div className="wizard-header">
          <button className="wizard-back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="wizard-intro" style={{ paddingBottom: '1rem' }}>
          <div className="wizard-intro-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
            <FlaskConical size={48} color="white" />
          </div>
          <h1>{t('test.title')}</h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
            {t('test.subtitle')}
          </p>
        </div>

        {/* ====== DOYEN DIAGNOSTIC CARD ====== */}
        <div className="doyen-card">
          <div className="doyen-image-wrapper">
            <img src="/doyen.jpg" alt="Doyen Diagnostic & Research Foundation" className="doyen-image" />
          </div>
          <div className="doyen-info">
            <div className="doyen-badge">{t('test.trustedPartner')}</div>
            <h2 className="doyen-name">Doyen Diagnostic & Research Foundation</h2>
            <div className="doyen-details">
              <div className="doyen-detail-row">
                <Phone size={18} color="#3b82f6" />
                <a href="tel:+919831065226" className="doyen-phone">+91 98310 65226</a>
              </div>
              <div className="doyen-detail-row">
                <MapPin size={18} color="#ef4444" />
                <span>Shyambazar, Kolkata</span>
              </div>
              <div className="doyen-detail-row">
                <Mail size={18} color="#10b981" />
                <a href="mailto:doyendiagnostickol@gmail.com" className="doyen-phone">doyendiagnostickol@gmail.com</a>
              </div>
            </div>
            <a href="tel:+919831065226" className="btn" style={{ marginTop: '1.25rem', maxWidth: '320px' }}>
              <Phone size={16} style={{ marginRight: '8px' }} />
              {t('test.callToBook')}
            </a>
          </div>
        </div>

        {/* ── Assessment Status Pills ── */}
        {Object.keys(latestBands).length > 0 && (
          <div className="test-status-grid" style={{ marginTop: '2rem' }}>
            {Object.entries(latestBands).map(([type, band]) => (
              <div key={type} className="test-status-pill" style={{ 
                color: BAND_CONFIG[band]?.color, 
                background: BAND_CONFIG[band]?.bg 
              }}>
                <span style={{ textTransform: 'capitalize' }}>{t(`mod.${type}.title`)}</span>
                <span style={{ fontWeight: 600 }}>{getBandLabel(type, band)}</span>
              </div>
            ))}
          </div>
        )}

        {Object.keys(latestBands).length === 0 && (
          <div className="test-empty-state" style={{ marginTop: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '1rem', textAlign: 'center', padding: '1.5rem' }}>
              {t('test.noAssessments')}
            </p>
            <button className="btn" onClick={() => navigate('/dashboard')} style={{ maxWidth: '320px', margin: '0 auto' }}>
              {t('test.goAssess')}
            </button>
          </div>
        )}

        {/* ── Tests YOU Should Book (based on scores) ── */}
        {recommendedTests.length > 0 && (
          <div className="test-rec-section" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
              🧾 Tests You Should Request
            </h3>
            <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Based on your assessment results, here are the specific tests you need:
            </p>

            {recommendedTests.map((item, i) => {
              const urgency = URGENCY_CONFIG[item.urgency];
              const score = item.score;
              const scoreStr = score?.bmi
                ? `BMI: ${score.bmi}`
                : score?.points !== undefined
                  ? `Score: ${score.points}/${score.maxPoints}`
                  : '';
              return (
                <div key={i} className="test-rec-card-v2" style={{ '--u-color': urgency.color, '--u-bg': urgency.bg }}>
                  <div className="test-rec-card-v2-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className="urgency-badge" style={{ color: urgency.color, background: urgency.bg }}>
                          {urgency.icon} {urgency.label}
                        </span>
                        <span className="test-assessment-type" style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {t(`mod.${item.assessmentType}.title`)}
                          {scoreStr && <> — <strong style={{ color: urgency.color }}>{scoreStr}</strong></>}
                        </span>
                      </div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                        <FlaskConical size={16} style={{ marginRight: '6px', color: urgency.color, verticalAlign: 'middle' }} />
                        {item.test}
                      </strong>
                    </div>
                  </div>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    ↳ {item.reason}
                  </p>
                </div>
              );
            })}

            {/* ── "Tell the Doctor" Copyable Message ── */}
            <div className="doctor-message-box">
              <div className="doctor-message-header">
                <strong>📋 What to Tell the Doctor / Hospital</strong>
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? <><ClipboardCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy Message</>}
                </button>
              </div>
              <pre className="doctor-message-text">{doctorMessage}</pre>
            </div>
          </div>
        )}

        {/* ── All Available Tests ── */}
        <div className="test-rec-section" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{t('test.allTests')}</h3>
          <div className="test-all-grid">
            {availableTests.map((test, i) => (
              <div key={i} className="test-rec-card">
                <div className="test-rec-header">
                  <FlaskConical size={18} color="#6366f1" />
                  <strong>{test.name}</strong>
                  <span className="test-price">{test.price}</span>
                </div>
                <p className="text-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                  {test.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="result-actions" style={{ marginTop: '2rem' }}>
          <button className="btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            {t('result.backToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRecommendations;
