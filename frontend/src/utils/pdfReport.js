/**
 * generateHealthReport
 * Opens a print-ready window the user can save as PDF.
 * No external library required.
 */
export function generateHealthReport({ user, cycleData, assessments, predictions }) {
  const name = user?.name || 'User';
  const today = new Date();

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  // Calculate previous 3 periods
  const periods = [];
  if (cycleData?.lastPeriodDate && cycleData?.cycleLength) {
    let start = new Date(cycleData.lastPeriodDate);
    for (let i = 0; i < 4; i++) {
      periods.unshift({
        start: new Date(start),
        end: new Date(new Date(start).setDate(start.getDate() + (cycleData.periodDuration || 5) - 1)),
      });
      start = new Date(start.setDate(start.getDate() - cycleData.cycleLength));
    }
  }

  const pcosResult = assessments?.pcos?.result;
  const bmiResult  = assessments?.bmi?.result;
  const mentalResult = assessments?.mental?.result;

  const bandColor = (band) => {
    if (!band) return '#6b7280';
    if (band === 'low') return '#10b981';
    if (band === 'moderate') return '#f59e0b';
    return '#ef4444';
  };

  const periodRows = periods.map(p =>
    `<tr>
      <td>${fmt(p.start)}</td>
      <td>${fmt(p.end)}</td>
      <td>${cycleData.periodDuration} days</td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Health Report — ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; color: #1f2937; background: #fff; padding: 40px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f43f5e; padding-bottom: 16px; margin-bottom: 24px; }
    .app-name { font-size: 1.6rem; font-weight: 700; color: #f43f5e; }
    .report-meta { text-align: right; font-size: 0.85rem; color: #6b7280; }
    h2 { font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #f3f4f6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
    .info-box { background: #f9fafb; border-radius: 10px; padding: 12px 16px; }
    .info-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-value { font-size: 1rem; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.9rem; }
    th { background: #fdf2f4; color: #be185d; font-weight: 600; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    .score-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: white; }
    .next-period { background: linear-gradient(135deg, #fdf2f4, #fbcfe8); border-radius: 12px; padding: 16px 20px; margin-top: 8px; }
    .next-period-date { font-size: 1.4rem; font-weight: 700; color: #e11d48; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="app-name">🌸 Swasthasaheli</div>
      <div style="font-size:0.85rem;color:#6b7280;margin-top:4px;">Women's Health Companion</div>
    </div>
    <div class="report-meta">
      <div style="font-weight:600;font-size:1rem;color:#1f2937;">Health Report</div>
      <div>${name}</div>
      <div>Generated: ${fmt(today)}</div>
    </div>
  </div>

  <h2>📋 Cycle Summary</h2>
  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Last Period Start</div>
      <div class="info-value">${fmt(cycleData?.lastPeriodDate)}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Cycle Length</div>
      <div class="info-value">${cycleData?.cycleLength || '—'} days</div>
    </div>
    <div class="info-box">
      <div class="info-label">Period Duration</div>
      <div class="info-value">${cycleData?.periodDuration || '—'} days</div>
    </div>
    <div class="info-box">
      <div class="info-label">Next Ovulation</div>
      <div class="info-value">${fmtShort(predictions?.ovulation)}</div>
    </div>
  </div>

  <div class="next-period">
    <div class="info-label">Next Expected Period</div>
    <div class="next-period-date">${fmtShort(predictions?.nextPeriod)}</div>
    ${pcosResult?.band === 'high' || pcosResult?.band === 'moderate'
      ? `<div style="font-size:0.82rem;color:#b45309;margin-top:4px;">⚠️ PCOS detected — actual date may vary ±7 days</div>`
      : ''}
  </div>

  <h2>📅 Period History</h2>
  <table>
    <thead><tr><th>Period Start</th><th>Period End</th><th>Duration</th></tr></thead>
    <tbody>${periodRows}</tbody>
  </table>

  ${pcosResult ? `
  <h2>🩺 PCOS Risk Assessment</h2>
  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Risk Level</div>
      <div class="info-value">
        <span class="score-badge" style="background:${bandColor(pcosResult.band)}">${(pcosResult.band || '—').toUpperCase()}</span>
      </div>
    </div>
    <div class="info-box">
      <div class="info-label">Score</div>
      <div class="info-value">${pcosResult.points ?? '—'} / ${pcosResult.maxPoints ?? '—'}</div>
    </div>
  </div>
  ${pcosResult.recommendation ? `<p style="font-size:0.88rem;color:#374151;margin-top:8px;line-height:1.6;">${pcosResult.recommendation}</p>` : ''}
  ` : ''}

  ${bmiResult ? `
  <h2>⚖️ BMI Report</h2>
  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">BMI</div>
      <div class="info-value">${bmiResult.bmi}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Category</div>
      <div class="info-value">${bmiResult.category}</div>
    </div>
  </div>
  ` : ''}

  ${mentalResult ? `
  <h2>🧠 Mental Wellbeing</h2>
  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Risk Level</div>
      <div class="info-value">
        <span class="score-badge" style="background:${bandColor(mentalResult.band)}">${(mentalResult.band || '—').toUpperCase()}</span>
      </div>
    </div>
    <div class="info-box">
      <div class="info-label">Score</div>
      <div class="info-value">${mentalResult.points ?? '—'} / ${mentalResult.maxPoints ?? '—'}</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    This report is generated by Swasthasaheli and is for personal reference only.<br/>
    Always consult a qualified healthcare professional for medical advice.
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to download your report.'); return; }
  win.document.write(html);
  win.document.close();
}
