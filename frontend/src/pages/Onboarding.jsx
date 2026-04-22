import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const Onboarding = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Prevent future dates
    if (new Date(lastPeriodDate) > new Date()) {
      setError('Last period date cannot be in the future');
      return;
    }
    // Sanity check ranges
    if (cycleLength < 20 || cycleLength > 45) {
      setError('Cycle length must be between 20 and 45 days');
      return;
    }
    if (periodDuration < 1 || periodDuration > 10) {
      setError('Period duration must be between 1 and 10 days');
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post('/api/cycle', {
        cycleLength: Number(cycleLength),
        periodDuration: Number(periodDuration),
        lastPeriodDate
      }, config);
      
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save cycle data');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h2 className="text-center">{t('onboard.title')}</h2>
        <p className="text-center text-muted" style={{ marginBottom: '2rem' }}>
          {t('onboard.subtitle')}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('onboard.cycleLength')}</label>
            <input 
              type="number" 
              className="form-control" 
              value={cycleLength} 
              onChange={(e) => setCycleLength(e.target.value)} 
              min="20" max="45"
              required 
            />
          </div>
          <div className="form-group">
            <label>{t('onboard.periodDuration')}</label>
            <input 
              type="number" 
              className="form-control" 
              value={periodDuration} 
              onChange={(e) => setPeriodDuration(e.target.value)} 
              min="1" max="10"
              required 
            />
          </div>
          <div className="form-group">
            <label>{t('onboard.lastPeriod')}</label>
            <input 
              type="date" 
              className="form-control" 
              value={lastPeriodDate} 
              onChange={(e) => setLastPeriodDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required 
            />
          </div>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
            {t('onboard.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
