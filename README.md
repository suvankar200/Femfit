# SwasthaSaheli MVP

Rule-based preventive health MVP with multilingual support (`en`, `hi`, `bn`) and separate risk engines.

## Included Modules

- Core Tracker: cycle length, period duration, symptoms, discharge, flow
- Risk Engines:
  - PCOS Risk Score (PRS)
  - Iron Deficiency Index (IDI)
  - Anemia Risk
  - Infection / Discharge Risk
  - Mental Wellbeing Risk (lightweight)
- Explainability: top contributors shown per engine
- Confidence score: based on answered fields
- Trend tracking: score direction over last 3 assessments

## Tech

- Node.js + Express backend
- Vanilla JS frontend (single-page)
- In-memory store for users, entries, and assessments

## Run

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Notes

- This MVP uses rule-based scoring and is **not a diagnosis**.
- In-memory storage resets when server restarts.
- For production: move data to MongoDB/PostgreSQL, add auth, encryption, and clinical validation.
