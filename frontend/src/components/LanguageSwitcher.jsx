import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage, LANGUAGES } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === language);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="lang-switcher" ref={dropdownRef}>
      <button
        className="lang-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        id="language-switcher-btn"
      >
        <Globe size={16} />
        <span>{currentLang?.nativeLabel || 'English'}</span>
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-dropdown-item ${language === lang.code ? 'lang-active' : ''}`}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              id={`lang-option-${lang.code}`}
            >
              <span className="lang-flag">{lang.flag}</span>
              <div className="lang-labels">
                <span className="lang-native">{lang.nativeLabel}</span>
                <span className="lang-english">{lang.label}</span>
              </div>
              {language === lang.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
