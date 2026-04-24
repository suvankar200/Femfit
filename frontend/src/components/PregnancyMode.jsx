import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Apple, Heart, FlaskConical, Phone, ChevronDown, ChevronUp } from 'lucide-react';

// ── Baby size by week ─────────────────────────────────────────────────────────
const BABY_SIZE = {
  4: ['Poppy seed', '0.1 cm'],   5: ['Apple seed', '0.13 cm'],  6: ['Sweet pea', '0.6 cm'],
  7: ['Blueberry', '1.3 cm'],    8: ['Raspberry', '1.6 cm'],    9: ['Cherry', '2.3 cm'],
  10: ['Strawberry', '3.1 cm'],  11: ['Lime', '4.1 cm'],        12: ['Plum', '5.4 cm'],
  13: ['Peach', '7.4 cm'],       14: ['Lemon', '8.7 cm'],       15: ['Apple', '10.1 cm'],
  16: ['Avocado', '11.6 cm'],    17: ['Pear', '13 cm'],         18: ['Bell pepper', '14.2 cm'],
  19: ['Mango', '15.3 cm'],      20: ['Banana', '25 cm'],       21: ['Carrot', '26.7 cm'],
  22: ['Papaya', '27.8 cm'],     23: ['Grapefruit', '28.9 cm'], 24: ['Corn', '30 cm'],
  25: ['Cauliflower', '34.6 cm'],26: ['Scallion', '35.6 cm'],  27: ['Broccoli', '36.6 cm'],
  28: ['Eggplant', '37.6 cm'],   29: ['Butternut squash', '38.6 cm'], 30: ['Cabbage', '39.9 cm'],
  31: ['Coconut', '41.1 cm'],    32: ['Jicama', '42.4 cm'],    33: ['Pineapple', '43.7 cm'],
  34: ['Cantaloupe', '45 cm'],   35: ['Honeydew', '46.2 cm'],  36: ['Romaine lettuce', '47.4 cm'],
  37: ['Swiss chard', '48.6 cm'],38: ['Leek', '49.8 cm'],      39: ['Watermelon', '51 cm'],
  40: ['Pumpkin', '51.2 cm'],
};

// ── Tests by trimester ────────────────────────────────────────────────────────
const TESTS = {
  1: [
    { week: '8–10', name: 'Blood Group & Rh Factor', why: 'Identifies your blood type and checks for Rh incompatibility.' },
    { week: '9–10', name: 'Complete Blood Count (CBC)', why: 'Screens for anemia and infections.' },
    { week: '10–13', name: 'Nuchal Translucency (NT) Scan', why: 'Checks for Down syndrome and other chromosomal issues.' },
    { week: '11–14', name: 'First Trimester Screening', why: 'Measures PAPP-A and hCG hormones for risk assessment.' },
    { week: '12', name: 'Urine Routine Test', why: 'Checks for urinary infections and protein in urine.' },
    { week: 'Any', name: 'Thyroid Function (TSH)', why: 'Untreated thyroid issues can affect fetal brain development.' },
  ],
  2: [
    { week: '15–20', name: 'Quad Screen / MSAFP', why: 'Blood test for neural tube defects and chromosomal conditions.' },
    { week: '18–20', name: 'Anomaly Scan (Level 2 Ultrasound)', why: 'Detailed scan to check all fetal organs and anatomy.' },
    { week: '24–28', name: 'Glucose Challenge Test (GCT)', why: 'Screens for gestational diabetes.' },
    { week: '24–28', name: 'Oral Glucose Tolerance Test (OGTT)', why: 'Done if GCT result is abnormal.' },
    { week: '24', name: 'Iron Studies', why: 'Checks for iron-deficiency anemia, common in 2nd trimester.' },
  ],
  3: [
    { week: '28', name: 'Repeat CBC & Iron', why: 'Ensures no developing anemia before delivery.' },
    { week: '32', name: 'Growth Scan Ultrasound', why: 'Checks baby\'s growth, position, and amniotic fluid.' },
    { week: '35–37', name: 'Group B Streptococcus (GBS) Test', why: 'Vaginal/rectal swab — if positive, antibiotics given during labor.' },
    { week: '36+', name: 'Non-Stress Test (NST)', why: 'Monitors baby\'s heart rate and movement if high-risk.' },
    { week: '36+', name: 'Biophysical Profile (BPP)', why: 'Ultrasound + NST to assess baby\'s well-being.' },
    { week: '40', name: 'Cervical Check (GYN visit)', why: 'Assesses readiness for labor — dilation and effacement.' },
  ],
};

// ── Nutrition by trimester ────────────────────────────────────────────────────
const NUTRITION = {
  1: {
    eat: ['Folic acid-rich foods (leafy greens, lentils, fortified cereals)', 'Vitamin B6 foods (bananas, potatoes) for nausea', 'Small, frequent meals — 5–6 small meals instead of 3 large', 'Ginger tea for morning sickness', 'Iron: spinach, beetroot, pomegranate', 'Hydrate well — 8–10 glasses of water'],
    avoid: ['Raw or undercooked meat, fish, eggs', 'Unpasteurised milk and soft cheeses', 'High-mercury fish (shark, swordfish, king mackerel)', 'Alcohol — no safe limit', 'Excess caffeine (max 200mg/day = 1 small coffee)', 'Papaya and pineapple (in large amounts)'],
    supplements: ['Folic acid 400–800 mcg/day', 'Vitamin D 600 IU/day', 'Iron 27 mg/day (as prescribed)', 'DHA/Omega-3'],
  },
  2: {
    eat: ['Calcium-rich foods (dairy, tofu, almonds, sesame)', 'Protein: eggs, lentils, chicken, paneer, fish', 'Fibre: whole grains, fruits, vegetables for constipation', 'Vitamin C: amla, oranges, tomatoes (helps iron absorption)', 'Healthy fats: avocado, nuts, olive oil', 'Magnesium: pumpkin seeds, dark chocolate'],
    avoid: ['Raw sprouts (bacteria risk)', 'Processed/packaged junk food', 'Excess sugar (raises gestational diabetes risk)', 'Deli meats without heating', 'Herbal teas not approved by doctor'],
    supplements: ['Continue folic acid + iron', 'Calcium 1000 mg/day', 'Vitamin B12 (if vegetarian)', 'Omega-3 DHA'],
  },
  3: {
    eat: ['Extra protein 25g more/day for baby\'s rapid growth', 'Vitamin K: leafy greens (broccoli, cabbage) for blood clotting', 'Fibre: prevents constipation (very common in 3rd trimester)', 'Dates (from week 36): may help ease labor', 'Colostrum-boosting foods: oats, fennel seeds, fenugreek', 'Complex carbs: brown rice, oats for sustained energy'],
    avoid: ['Foods that cause bloating (cabbage, beans — in excess)', 'Very spicy food if it causes heartburn', 'Raw shellfish', 'Too much sodium (raises blood pressure/swelling)'],
    supplements: ['Continue all vitamins', 'Extra iron if anaemia detected', 'Vitamin D and Calcium', 'Discuss Magnesium with doctor for leg cramps'],
  },
};

// ── Tips by trimester ─────────────────────────────────────────────────────────
const WELLNESS = {
  1: [
    { icon: '😴', title: 'Sleep & Fatigue', tip: 'Extreme tiredness is normal. Take naps when you can. Aim for 8–9 hours of sleep.' },
    { icon: '🤢', title: 'Morning Sickness', tip: 'Eat crackers before getting up. Avoid strong smells. Ginger tea helps. Severe vomiting — see your doctor.' },
    { icon: '💊', title: 'Start Supplements', tip: 'Start folic acid NOW if not already. Discuss all supplements with your gynecologist.' },
    { icon: '🚶', title: 'Gentle Exercise', tip: '20–30 min walking daily is perfect. Avoid intense workouts in the first 12 weeks.' },
  ],
  2: [
    { icon: '💪', title: 'Energy Returns', tip: 'The 2nd trimester is often the most comfortable. Use this energy for prenatal yoga, swimming, and walks.' },
    { icon: '👶', title: 'Baby Kicks', tip: 'You\'ll feel baby move around 18–22 weeks! Track kick counts daily from week 20.' },
    { icon: '🧘', title: 'Prenatal Yoga', tip: 'Safe yoga poses improve flexibility, reduce back pain, and prepare your body for labor.' },
    { icon: '💆', title: 'Back & Hip Pain', tip: 'Use a maternity pillow. Wear supportive shoes. Prenatal massage can help.' },
  ],
  3: [
    { icon: '🛏️', title: 'Sleep Position', tip: 'Sleep on your LEFT side — improves blood flow to baby. Use a pillow between your knees.' },
    { icon: '🤱', title: 'Prepare for Labor', tip: 'Take antenatal classes, practice breathing exercises. Discuss your birth plan with your doctor.' },
    { icon: '🏥', title: 'Hospital Bag', tip: 'Pack your bag by week 35: documents, baby clothes, toiletries, snacks, phone charger.' },
    { icon: '📋', title: 'Kick Counts', tip: 'Do kick counts daily — 10 movements in 2 hours is healthy. Contact doctor if reduced.' },
  ],
};

// ── Helper ────────────────────────────────────────────────────────────────────
const getWeek = (dueDateStr) => {
  if (!dueDateStr) return null;
  const dueDate = new Date(dueDateStr);
  const lmp = new Date(dueDate.getTime() - 280 * 86400000); // 40 weeks before due date
  const msSinceLmp = new Date() - lmp;
  return Math.min(40, Math.max(1, Math.floor(msSinceLmp / (7 * 86400000))));
};

const getTrimester = (week) => {
  if (!week) return null;
  if (week <= 12) return 1;
  if (week <= 28) return 2;
  return 3;
};

// ── Component ─────────────────────────────────────────────────────────────────
const PregnancyMode = ({ onExit }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [dueDate, setDueDate] = useState(() => localStorage.getItem('pregnancyDueDate') || '');
  const [showDueDateForm, setShowDueDateForm] = useState(!localStorage.getItem('pregnancyDueDate'));
  const [openSection, setOpenSection] = useState('wellness');

  const week = getWeek(dueDate);
  const trimester = getTrimester(week);
  const babyInfo = BABY_SIZE[week] || BABY_SIZE[Math.max(4, Math.min(40, week || 20))];

  const saveDueDate = (e) => {
    e.preventDefault();
    if (dueDate) {
      localStorage.setItem('pregnancyDueDate', dueDate);
      setShowDueDateForm(false);
    }
  };

  const trimesterLabel = trimester === 1 ? t('preg.trimester1') : trimester === 2 ? t('preg.trimester2') : t('preg.trimester3');
  const trimesterColor = trimester === 1 ? '#ec4899' : trimester === 2 ? '#8b5cf6' : '#f59e0b';

  const toggle = (s) => setOpenSection(p => p === s ? '' : s);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Banner */}
      <div className="pregnancy-mode-banner" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🤰</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#be185d' }}>{t('preg.title')}</h2>
            <p style={{ margin: 0, color: '#9d174d', fontSize: '0.9rem' }}>{t('preg.subtitle')}</p>
          </div>
        </div>
        <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem' }} onClick={onExit}>
          {t('preg.exit')}
        </button>
      </div>

      {/* Due Date Setup */}
      {showDueDateForm ? (
        <div className="dashboard-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>📅 {t('preg.enterDueDate')}</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{t('preg.dueDateDesc')}</p>
          <form onSubmit={saveDueDate} style={{ maxWidth: '300px', margin: '0 auto' }}>
            <input type="date" className="form-control" value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 280 * 86400000).toISOString().split('T')[0]}
              required style={{ marginBottom: '1rem' }} />
            <button type="submit" className="btn">{t('preg.setDueDate')}</button>
          </form>
        </div>
      ) : (
        <>
          {/* Week & Baby Size Card */}
          <div className="grid-cols-2">
            <div className="dashboard-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('preg.youAre')}</p>
              <div style={{ fontSize: '3.5rem', fontWeight: 700, color: trimesterColor, lineHeight: 1 }}>{t('preg.week')} {week}</div>
              <div style={{ marginTop: '0.5rem', display: 'inline-block', background: `${trimesterColor}20`, color: trimesterColor, padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                {trimesterLabel}
              </div>
              <p className="text-muted" style={{ margin: '1rem 0 0', fontSize: '0.85rem' }}>
                {dueDate && `${t('preg.due')} ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
              <button onClick={() => setShowDueDateForm(true)} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', cursor: 'pointer' }}>
                {t('preg.changeDueDate')}
              </button>
            </div>

            <div className="dashboard-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('preg.babySize')}</p>
              <div style={{ fontSize: '2.8rem', margin: '0.25rem 0' }}>🌱</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{babyInfo?.[0]}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>~{babyInfo?.[1]} {t('preg.long')}</div>
            </div>
          </div>

          {/* Accordion Sections */}
          {[
            {
              id: 'wellness', label: t('preg.wellness'), icon: <Heart size={18} />,
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', padding: '1rem 0 0' }}>
                  {(WELLNESS[trimester] || WELLNESS[2]).map(item => (
                    <div key={item.title} style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                      <div style={{ fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.95rem' }}>{item.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{item.tip}</div>
                    </div>
                  ))}
                </div>
              )
            },
            {
              id: 'tests', label: t('preg.tests'), icon: <FlaskConical size={18} />,
              content: (
                <div style={{ padding: '1rem 0 0' }}>
                  <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                    {trimesterLabel} — {t('preg.testsNote')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(TESTS[trimester] || TESTS[2]).map(test => (
                      <div key={test.name} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>🔬 {test.name}</span>
                          <span style={{ fontSize: '0.78rem', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', flexShrink: 0 }}>Week {test.week}</span>
                        </div>
                        <p className="text-muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>{test.why}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn"
                    style={{ marginTop: '1.25rem', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
                    onClick={() => navigate('/tests')}
                  >
                    {t('preg.bookTests')}
                  </button>
                </div>
              )
            },
            {
              id: 'nutrition', label: t('preg.nutrition'), icon: <Apple size={18} />,
              content: (
                <div style={{ padding: '1rem 0 0' }}>
                  {trimester && <>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#16a34a' }}>{t('preg.eatMore')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {NUTRITION[trimester].eat.map(item => (
                          <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                            <span style={{ color: '#16a34a', marginTop: '2px' }}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#dc2626' }}>{t('preg.avoid')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {NUTRITION[trimester].avoid.map(item => (
                          <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                            <span style={{ color: '#dc2626', marginTop: '2px' }}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#7c3aed' }}>{t('preg.supplements')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {NUTRITION[trimester].supplements.map(item => (
                          <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                            <span style={{ color: '#7c3aed', marginTop: '2px' }}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>}
                </div>
              )
            },
            {
              id: 'emergency', label: t('preg.emergency'), icon: <Phone size={18} />,
              content: (
                <div style={{ padding: '1rem 0 0' }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem' }}>
                    <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: '0.75rem' }}>{t('preg.callIf')}</p>
                    {['Heavy vaginal bleeding', 'Severe abdominal pain or cramping', 'Baby not moving (after week 20)', 'Sudden severe headache or blurred vision', 'Facial/hand swelling (signs of preeclampsia)', 'Fever above 38°C', 'Painful or burning urination', 'Signs of preterm labor before week 37 (contractions, pelvic pressure)'].map(s => (
                      <div key={s} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#dc2626' }}>⚠️</span> <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '1rem', textAlign: 'center' }}>
                    {t('preg.emergency.contact')}
                  </p>
                </div>
              )
            }
          ].map(section => (
            <div key={section.id} className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => toggle(section.id)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'left' }}
              >
                <span>{section.label}</span>
                {openSection === section.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openSection === section.id && (
                <div style={{ padding: '0 1.75rem 1.75rem' }}>{section.content}</div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PregnancyMode;
