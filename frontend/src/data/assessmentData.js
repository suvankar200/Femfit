import {
  Heart, Droplets, Zap, Brain, ShieldAlert, Moon, Calculator, FlaskConical
} from 'lucide-react';

/**
 * All assessment module definitions.
 * Each module has metadata + an array of questions.
 * 
 * Question types:
 *   - "yesno"   → Yes / No toggle
 *   - "number"  → Numeric input
 *   - "select"  → Dropdown select
 */

export const ASSESSMENT_MODULES = {
  bmi: {
    id: 'bmi',
    title: 'BMI Calculator',
    subtitle: 'Know your Body Mass Index',
    description: 'Calculate your BMI to understand your weight category and its health implications.',
    icon: Calculator,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#764ba2',
    questions: [
      {
        key: 'weightKg',
        text: 'What is your weight?',
        subtext: 'Switch between kg and lbs using the toggle',
        type: 'number',
        placeholder: 'e.g. 55',
        unit: 'kg',
        min: 20,
        max: 200
      },
      {
        key: 'heightCm',
        text: 'What is your height?',
        subtext: 'Switch between cm and feet/inches using the toggle',
        type: 'number',
        placeholder: 'e.g. 160',
        unit: 'cm',
        min: 100,
        max: 250
      }
    ]
  },

  pcos: {
    id: 'pcos',
    title: 'PCOS Risk Score',
    subtitle: 'Polycystic Ovary Syndrome Check',
    description: 'Evaluate your risk for PCOS based on menstrual, hormonal, metabolic and lifestyle factors.',
    icon: Heart,
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    accentColor: '#f43f5e',
    questions: [
      {
        key: 'cycleOver35',
        text: 'Is your menstrual cycle longer than 35 days?',
        subtext: 'A normal cycle is 21–35 days',
        type: 'yesno'
      },
      {
        key: 'lessThan8Cycles',
        text: 'Do you have fewer than 8 menstrual cycles per year?',
        subtext: 'Fewer cycles may indicate irregular ovulation',
        type: 'yesno'
      },
      {
        key: 'amenorrhea3Months',
        text: 'Have you missed your period for more than 3 months?',
        subtext: 'Absence of periods (amenorrhea) is a key indicator',
        type: 'yesno'
      },
      {
        key: 'acneModSevere',
        text: 'Do you experience moderate or severe acne?',
        subtext: 'Persistent acne, especially on chin/jawline',
        type: 'yesno'
      },
      {
        key: 'facialHair',
        text: 'Do you notice unusual facial hair growth?',
        subtext: 'Excess hair growth on face, chin, or upper lip',
        type: 'yesno'
      },
      {
        key: 'hairThinning',
        text: 'Are you experiencing hair thinning or hair loss?',
        subtext: 'Thinning at the crown or temple areas',
        type: 'yesno'
      },
      {
        key: 'bmiOver25',
        text: 'Is your BMI greater than 25?',
        subtext: 'If unsure, use our BMI calculator first',
        type: 'yesno'
      },
      {
        key: 'waistOver80',
        text: 'Is your waist circumference more than 80 cm?',
        subtext: 'Measure around the narrowest part of your waist',
        type: 'yesno'
      },
      {
        key: 'familyDiabetes',
        text: 'Is there a family history of diabetes?',
        subtext: 'Parents, siblings, or grandparents with diabetes',
        type: 'yesno'
      },
      {
        key: 'acanthosis',
        text: 'Do you have dark, velvety patches on your skin?',
        subtext: 'Acanthosis nigricans — often on neck, armpits, or groin',
        type: 'yesno'
      },
      {
        key: 'sleepUnder6',
        text: 'Do you sleep less than 6 hours per night?',
        subtext: 'Poor sleep affects hormonal balance',
        type: 'yesno'
      },
      {
        key: 'highScreenBeforeBed',
        text: 'Do you use screens (phone/laptop) right before sleeping?',
        subtext: 'Blue light exposure affects sleep quality',
        type: 'yesno'
      }
    ]
  },

  anemia: {
    id: 'anemia',
    title: 'Anemia Risk Score',
    subtitle: 'Check your anemia indicators',
    description: 'Assess your risk for anemia based on biological, nutritional, and symptom-based factors.',
    icon: Droplets,
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    accentColor: '#ef4444',
    questions: [
      {
        key: 'heavyBleeding',
        text: 'Do you experience heavy menstrual bleeding?',
        subtext: 'Needing to change pad/tampon every 1-2 hours',
        type: 'yesno'
      },
      {
        key: 'periodOver5Days',
        text: 'Does your period last more than 5 days?',
        subtext: 'Prolonged bleeding increases iron loss',
        type: 'yesno'
      },
      {
        key: 'fatigue',
        text: 'Do you feel persistently tired or fatigued?',
        subtext: 'Even after adequate rest',
        type: 'yesno'
      },
      {
        key: 'dizziness',
        text: 'Do you experience dizziness or lightheadedness?',
        subtext: 'Especially when standing up quickly',
        type: 'yesno'
      },
      {
        key: 'paleConjunctiva',
        text: 'Do your inner eyelids look pale?',
        subtext: 'Pull down your lower eyelid — it should be pink/red',
        type: 'yesno'
      },
      {
        key: 'bmiUnder18',
        text: 'Is your BMI below 18.5?',
        subtext: 'Being underweight increases anemia risk',
        type: 'yesno'
      },
      {
        key: 'wormHistory',
        text: 'Have you had worm infestation in the past?',
        subtext: 'Intestinal worms can cause chronic blood loss',
        type: 'yesno'
      },
      {
        key: 'vegNoIron',
        text: 'Are you vegetarian without iron supplements?',
        subtext: 'Plant-based iron is harder to absorb',
        type: 'yesno'
      },
      {
        key: 'lowLeafyVeg',
        text: 'Do you eat very few leafy green vegetables?',
        subtext: 'Spinach, kale, methi are rich in iron',
        type: 'yesno'
      },
      {
        key: 'teaCoffeeWithMeals',
        text: 'Do you drink tea or coffee with meals?',
        subtext: 'Tannins in tea/coffee block iron absorption',
        type: 'yesno'
      },
      {
        key: 'hbLow',
        text: 'Has your hemoglobin been reported as low?',
        subtext: '(Optional) If you have recent lab results',
        type: 'yesno',
        optional: true
      },
      {
        key: 'mcvLow',
        text: 'Has your MCV been reported as low?',
        subtext: '(Optional) Mean Corpuscular Volume from CBC',
        type: 'yesno',
        optional: true
      },
      {
        key: 'ferritinLow',
        text: 'Has your ferritin been reported as low?',
        subtext: '(Optional) Ferritin measures stored iron',
        type: 'yesno',
        optional: true
      }
    ]
  },

  idi: {
    id: 'idi',
    title: 'Iron Deficiency Index',
    subtitle: 'Detect hidden iron deficiency',
    description: 'Even with normal hemoglobin, you can have low iron stores. This checks for subtle signs.',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    accentColor: '#f59e0b',
    questions: [
      {
        key: 'hairFall',
        text: 'Are you experiencing increased hair fall?',
        subtext: 'More than usual hair in brush or shower',
        type: 'yesno'
      },
      {
        key: 'brittleNails',
        text: 'Are your nails brittle or spoon-shaped?',
        subtext: 'Nails that break easily or curve upward',
        type: 'yesno'
      },
      {
        key: 'restlessLegs',
        text: 'Do you experience restless legs, especially at night?',
        subtext: 'Uncomfortable urge to move your legs when resting',
        type: 'yesno'
      },
      {
        key: 'coldIntolerance',
        text: 'Do you feel cold easily compared to others?',
        subtext: 'Always needing extra layers or blankets',
        type: 'yesno'
      },
      {
        key: 'poorConcentration',
        text: 'Do you have difficulty concentrating?',
        subtext: 'Brain fog, forgetfulness, or inability to focus',
        type: 'yesno'
      },
      {
        key: 'fatigue',
        text: 'Do you feel unusually fatigued?',
        subtext: 'Tiredness that does not improve with rest',
        type: 'yesno'
      },
      {
        key: 'ferritinLow',
        text: 'Has your ferritin been reported as low?',
        subtext: '(Optional) If you have recent lab results',
        type: 'yesno',
        optional: true
      }
    ]
  },

  mental: {
    id: 'mental',
    title: 'Mental Health Score',
    subtitle: 'Check your emotional well-being',
    description: 'Assess your mental well-being based on sleep, mood, and lifestyle indicators.',
    icon: Brain,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    accentColor: '#8b5cf6',
    questions: [
      {
        key: 'sleepUnder6',
        text: 'Do you sleep less than 6 hours per night?',
        subtext: 'Chronic sleep deprivation affects mood and cognition',
        type: 'yesno'
      },
      {
        key: 'nightAwakenings',
        text: 'Do you wake up frequently during the night?',
        subtext: 'Interrupted sleep reduces rest quality',
        type: 'yesno'
      },
      {
        key: 'highScreenTime',
        text: 'Do you spend more than 4 hours/day on screens (non-work)?',
        subtext: 'Excessive screen time is linked to anxiety and depression',
        type: 'yesno'
      },
      {
        key: 'fatigue',
        text: 'Do you feel persistently fatigued?',
        subtext: 'Mental exhaustion, lack of energy',
        type: 'yesno'
      },
      {
        key: 'moodSwings',
        text: 'Do you experience frequent mood swings?',
        subtext: 'Rapid emotional changes without clear triggers',
        type: 'yesno'
      },
      {
        key: 'poorConcentration',
        text: 'Do you have difficulty focusing or concentrating?',
        subtext: 'Trouble completing tasks or staying attentive',
        type: 'yesno'
      }
    ]
  },

  infection: {
    id: 'infection',
    title: 'Discharge / Infection Risk',
    subtitle: 'Vaginal health check',
    description: 'Check for signs of vaginal infection that may need medical attention.',
    icon: ShieldAlert,
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentColor: '#10b981',
    questions: [
      {
        key: 'abnormalDischarge',
        text: 'Have you noticed abnormal vaginal discharge?',
        subtext: 'Unusual color (yellow, green, grey) or consistency',
        type: 'yesno'
      },
      {
        key: 'foulSmell',
        text: 'Does the discharge have a foul or fishy smell?',
        subtext: 'A strong unpleasant odor is a common infection sign',
        type: 'yesno'
      },
      {
        key: 'itching',
        text: 'Do you experience vaginal itching or irritation?',
        subtext: 'Persistent itching around the vaginal area',
        type: 'yesno'
      },
      {
        key: 'pelvicPain',
        text: 'Do you experience pelvic pain or discomfort?',
        subtext: 'Pain in the lower abdomen or pelvis',
        type: 'yesno'
      }
    ]
  },

  lifestyle: {
    id: 'lifestyle',
    title: 'Lifestyle & Sleep Score',
    subtitle: 'How healthy are your habits?',
    description: 'Your lifestyle affects PCOS, mental health, and hormonal balance. Let\'s check.',
    icon: Moon,
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    accentColor: '#06b6d4',
    questions: [
      {
        key: 'sleepUnder6',
        text: 'Do you sleep less than 6 hours per night?',
        subtext: 'Quality sleep is essential for hormone regulation',
        type: 'yesno'
      },
      {
        key: 'screenBeforeBed',
        text: 'Do you use screens for >2 hours before bedtime?',
        subtext: 'Blue light disrupts melatonin production',
        type: 'yesno'
      },
      {
        key: 'nightAwakenings',
        text: 'Do you wake up frequently during the night?',
        subtext: 'Interrupted sleep reduces hormonal recovery',
        type: 'yesno'
      },
      {
        key: 'noExercise',
        text: 'Do you go without exercise most days of the week?',
        subtext: 'Less than 30 minutes of activity per day',
        type: 'yesno'
      },
      {
        key: 'highStress',
        text: 'Do you feel highly stressed most of the time?',
        subtext: 'Work, study, or relationship stress',
        type: 'yesno'
      }
    ]
  }
};

export const MODULE_ORDER = ['bmi', 'pcos', 'anemia', 'idi', 'mental', 'infection', 'lifestyle'];

/**
 * Band display config — colors + labels per band
 */
export const BAND_CONFIG = {
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Low Risk', emoji: '✅' },
  moderate: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Moderate Risk', emoji: '⚠️' },
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'High Risk', emoji: '🚨' }
};

/**
 * Custom band labels per engine (where they differ from default)
 */
export const CUSTOM_BAND_LABELS = {
  mental: { low: 'Stable', moderate: 'At Risk', high: 'Needs Intervention' },
  infection: { low: 'Normal', moderate: 'Monitor', high: 'Referral Needed' },
  lifestyle: { low: 'Good', moderate: 'Needs Improvement', high: 'Poor Lifestyle' },
  bmi: { low: 'Healthy', moderate: 'Overweight', high: 'Attention Needed' }
};
