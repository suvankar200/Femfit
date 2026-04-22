import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { t, setLanguage, LANGUAGES } = useLanguage();
  const navigate = useNavigate();

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(name, email, password, selectedLang);
    if (res.success) {
      navigate('/onboarding');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-center">{t('auth.createAccount')}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.name')}</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {/* Language Selector */}
          <div className="form-group">
            <label><Globe size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{t('auth.chooseLanguage')}</label>
            <div className="register-lang-selector">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`register-lang-btn ${selectedLang === lang.code ? 'register-lang-active' : ''}`}
                  onClick={() => handleLangChange(lang.code)}
                >
                  <span className="register-lang-flag">{lang.flag}</span>
                  <span className="register-lang-label">{lang.nativeLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn">{t('auth.signup')}</button>
        </form>
        <div className="auth-link">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
