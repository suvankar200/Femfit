import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { ASSESSMENT_MODULES } from '../data/assessmentData';
import AssessmentResult from '../components/AssessmentResult';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';

const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
];

const HEIGHT_UNITS = [
  { value: 'cm', label: 'cm' },
  { value: 'ft', label: 'ft / in' },
];

const AssessmentWizard = () => {
  const { type } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const module = ASSESSMENT_MODULES[type];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // BMI unit toggles
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  if (!module) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <h2>{t('wizard.notFound')}</h2>
          <p className="text-muted">{t('wizard.notFoundDesc').replace('{type}', type)}</p>
          <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
            {t('wizard.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  const questions = module.questions;
  const totalSteps = questions.length;
  const currentQ = step > 0 && step <= totalSteps ? questions[step - 1] : null;
  const progress = step === 0 ? 0 : Math.min((step / totalSteps) * 100, 100);
  const Icon = module.icon;

  const isBmiWeight = type === 'bmi' && currentQ?.key === 'weightKg';
  const isBmiHeight = type === 'bmi' && currentQ?.key === 'heightCm';

  // Get translated question text
  const getQuestionText = (q) => {
    // Try module-specific translation key first
    const moduleSpecificKey = `q.${q.key}.${type}`;
    const moduleSpecific = t(moduleSpecificKey);
    if (moduleSpecific !== moduleSpecificKey) return moduleSpecific;
    return t(`q.${q.key}`);
  };

  const getQuestionSubtext = (q) => {
    // Try module-specific subtext key first
    const moduleSpecificKey = `q.${q.key}.${type}.sub`;
    const moduleSpecific = t(moduleSpecificKey);
    if (moduleSpecific !== moduleSpecificKey) return moduleSpecific;
    return t(`q.${q.key}.sub`);
  };

  const setAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  // Convert weight to kg before sending
  const getWeightInKg = (val) => {
    if (weightUnit === 'lbs') return (Number(val) * 0.453592).toFixed(1);
    return val;
  };

  // Convert ft/in to cm
  const getFtInAsCm = () => {
    const ft = Number(heightFt) || 0;
    const inches = Number(heightIn) || 0;
    return Math.round((ft * 30.48) + (inches * 2.54));
  };

  const canGoNext = () => {
    if (step === 0) return true;
    if (!currentQ) return false;
    if (currentQ.optional && answers[currentQ.key] === undefined) return true;

    if (isBmiHeight && heightUnit === 'ft') {
      return heightFt !== '' && heightFt > 0;
    }

    if (currentQ.type === 'yesno') return answers[currentQ.key] !== undefined;
    if (currentQ.type === 'number') return answers[currentQ.key] !== undefined && answers[currentQ.key] !== '';
    return answers[currentQ.key] !== undefined;
  };

  const handleNext = () => {
    // Before moving to next step, convert BMI units to metric
    if (isBmiWeight && weightUnit === 'lbs' && answers.weightKg) {
      setAnswer('weightKg', getWeightInKg(answers.weightKg));
    }
    if (isBmiHeight && heightUnit === 'ft') {
      setAnswer('heightCm', String(getFtInAsCm()));
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  // ── Enter key → Next ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Enter' && canGoNext() && !loading) {
        // Don't hijack Enter inside a <select> dropdown
        if (document.activeElement?.tagName === 'SELECT') return;
        handleNext();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [step, answers, heightFt, heightIn, weightUnit, heightUnit, loading]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Final conversion before submit
    const finalAnswers = { ...answers };
    if (type === 'bmi') {
      if (weightUnit === 'lbs' && finalAnswers.weightKg) {
        finalAnswers.weightKg = getWeightInKg(finalAnswers.weightKg);
      }
      if (heightUnit === 'ft') {
        finalAnswers.heightCm = String(getFtInAsCm());
      }
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`/api/assess/${type}`, finalAnswers, config);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Assessment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <AssessmentResult result={result} moduleConfig={module} />;
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <div className="loading-pulse" style={{ background: module.gradient }}></div>
          <h2>{t('wizard.analyzing')}</h2>
          <p className="text-muted">{t('wizard.calculating')} {t(`mod.${type}.title`)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-container">
      {/* Progress Bar */}
      <div className="wizard-progress-bar">
        <div
          className="wizard-progress-fill"
          style={{ width: `${progress}%`, background: module.gradient }}
        />
      </div>

      <div className="wizard-card">
        {/* Header */}
        <div className="wizard-header">
          <button className="wizard-back-btn" onClick={() => step === 0 ? navigate('/dashboard') : handleBack()}>
            <ArrowLeft size={20} />
          </button>
          {step > 0 && (
            <span className="wizard-step-count">
              {step} / {totalSteps}
            </span>
          )}
        </div>

        {/* Intro Step */}
        {step === 0 && (
          <div className="wizard-intro">
            <div className="wizard-intro-icon" style={{ background: module.gradient }}>
              <Icon size={48} color="white" />
            </div>
            <h1>{t(`mod.${type}.title`)}</h1>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              {t(`mod.${type}.desc`)}
            </p>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              📝 {totalSteps} {t('wizard.questions')} · {t('wizard.takes')}{Math.ceil(totalSteps * 0.3)} {t('wizard.min')}
            </p>
            <button className="btn" onClick={handleNext} style={{ marginTop: '2rem', maxWidth: '320px' }}>
              {t('wizard.startAssessment')} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        )}

        {/* Question Step */}
        {currentQ && (
          <div className="wizard-question" key={currentQ.key}>
            <div className="wizard-question-number" style={{ color: module.accentColor }}>
              {t('wizard.question')} {step}
            </div>
            <h2 className="wizard-question-text">{getQuestionText(currentQ)}</h2>
            {currentQ.subtext && (
              <p className="wizard-question-subtext">{getQuestionSubtext(currentQ)}</p>
            )}

            <div className="wizard-input-area">
              {currentQ.type === 'yesno' && (
                <div className="wizard-yesno">
                  <button
                    className={`wizard-yesno-btn ${answers[currentQ.key] === true ? 'active-yes' : ''}`}
                    onClick={() => setAnswer(currentQ.key, true)}
                  >
                    {t('wizard.yes')}
                  </button>
                  <button
                    className={`wizard-yesno-btn ${answers[currentQ.key] === false ? 'active-no' : ''}`}
                    onClick={() => setAnswer(currentQ.key, false)}
                  >
                    {t('wizard.no')}
                  </button>
                </div>
              )}

              {currentQ.type === 'number' && !isBmiWeight && !isBmiHeight && (
                <div className="wizard-number-input">
                  <input
                    type="number"
                    className="form-control wizard-number"
                    placeholder={currentQ.placeholder || t('wizard.enterValue')}
                    value={answers[currentQ.key] || ''}
                    onChange={(e) => setAnswer(currentQ.key, e.target.value)}
                    min={currentQ.min}
                    max={currentQ.max}
                    autoFocus
                  />
                  {currentQ.unit && (
                    <span className="wizard-number-unit">{currentQ.unit}</span>
                  )}
                </div>
              )}

              {/* BMI Weight — with unit toggle */}
              {isBmiWeight && (
                <div className="bmi-input-block">
                  <div className="unit-toggle">
                    {WEIGHT_UNITS.map(u => (
                      <button
                        key={u.value}
                        className={`unit-toggle-btn ${weightUnit === u.value ? 'unit-active' : ''}`}
                        onClick={() => { setWeightUnit(u.value); setAnswer('weightKg', ''); }}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                  <div className="wizard-number-input">
                    <input
                      type="number"
                      className="form-control wizard-number"
                      placeholder={weightUnit === 'kg' ? 'e.g. 55' : 'e.g. 121'}
                      value={answers.weightKg || ''}
                      onChange={(e) => setAnswer('weightKg', e.target.value)}
                      min={weightUnit === 'kg' ? 20 : 44}
                      max={weightUnit === 'kg' ? 200 : 440}
                      autoFocus
                    />
                    <span className="wizard-number-unit">{weightUnit}</span>
                  </div>
                </div>
              )}

              {/* BMI Height — with unit toggle (cm or ft/in) */}
              {isBmiHeight && (
                <div className="bmi-input-block">
                  <div className="unit-toggle">
                    {HEIGHT_UNITS.map(u => (
                      <button
                        key={u.value}
                        className={`unit-toggle-btn ${heightUnit === u.value ? 'unit-active' : ''}`}
                        onClick={() => { setHeightUnit(u.value); setAnswer('heightCm', ''); setHeightFt(''); setHeightIn(''); }}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>

                  {heightUnit === 'cm' ? (
                    <div className="wizard-number-input">
                      <input
                        type="number"
                        className="form-control wizard-number"
                        placeholder="e.g. 160"
                        value={answers.heightCm || ''}
                        onChange={(e) => setAnswer('heightCm', e.target.value)}
                        min={100}
                        max={250}
                        autoFocus
                      />
                      <span className="wizard-number-unit">cm</span>
                    </div>
                  ) : (
                    <div className="ft-in-inputs">
                      <div className="wizard-number-input">
                        <input
                          type="number"
                          className="form-control wizard-number"
                          placeholder="5"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          min={3}
                          max={8}
                          autoFocus
                        />
                        <span className="wizard-number-unit">ft</span>
                      </div>
                      <div className="wizard-number-input">
                        <input
                          type="number"
                          className="form-control wizard-number"
                          placeholder="4"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          min={0}
                          max={11}
                        />
                        <span className="wizard-number-unit">in</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentQ.type === 'select' && (
                <select
                  className="form-control"
                  value={answers[currentQ.key] || ''}
                  onChange={(e) => setAnswer(currentQ.key, e.target.value)}
                >
                  <option value="">{t('wizard.selectOption')}</option>
                  {currentQ.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Navigation */}
            <div className="wizard-nav">
              {currentQ.optional && answers[currentQ.key] === undefined && (
                <button className="btn btn-outline" onClick={handleSkip} style={{ width: 'auto' }}>
                  <SkipForward size={16} style={{ marginRight: '6px' }} /> {t('wizard.skip')}
                </button>
              )}
              <button
                className="btn"
                onClick={handleNext}
                disabled={!canGoNext()}
                style={{ maxWidth: '280px' }}
              >
                {step === totalSteps ? t('wizard.getResults') : t('wizard.next')}
                <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </button>
            </div>

            {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentWizard;
