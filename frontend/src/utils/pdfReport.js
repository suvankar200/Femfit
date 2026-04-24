import jsPDF from 'jspdf';
import { translations } from '../i18n/index.js';

/**
 * generateHealthReport
 * Directly downloads a PDF in the user's selected language.
 */
export function generateHealthReport({ user, cycleData, assessments, predictions, language = 'en' }) {
  const dict = translations[language] || translations.en;
  const tl = (key) => dict[key] || translations.en[key] || key;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const name = user?.name || 'User';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fmtShort = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  const W = 210; // A4 width mm
  let y = 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const pink   = [244, 63, 94];
  const dark   = [31, 41, 55];
  const muted  = [107, 114, 128];
  const lightBg = [253, 242, 244];

  const text = (str, x, yy, opts = {}) => {
    doc.setFontSize(opts.size || 11);
    doc.setTextColor(...(opts.color || dark));
    if (opts.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(String(str), x, yy, { maxWidth: opts.maxWidth });
  };

  const line = (yy, color = [229, 231, 235]) => {
    doc.setDrawColor(...color);
    doc.line(14, yy, W - 14, yy);
  };

  const box = (x, yy, w, h, color = lightBg) => {
    doc.setFillColor(...color);
    doc.roundedRect(x, yy, w, h, 3, 3, 'F');
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...pink);
  doc.rect(0, 0, W, 26, 'F');

  // Left side — App name + patient name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 200, 210);
  doc.text('Swasthasaheli', 14, 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  // Use splitTextToSize to prevent name from being cut off
  const nameLines = doc.splitTextToSize(`${tl('pdf.patient')} ${name}`, 110);
  doc.text(nameLines, 14, 17);

  // Right side — Femfit brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Femfit', W - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 200, 210);
  doc.text(`${tl('pdf.generated')} ${today}`, W - 14, 20, { align: 'right' });

  y = 36;

  // ── Cycle Summary ─────────────────────────────────────────────────────────
  text(tl('pdf.cycleSummary'), 14, y, { size: 13, bold: true, color: pink });
  y += 2;
  line(y, pink);
  y += 5;

  const half = (W - 28 - 4) / 2;
  box(14, y, half, 18);
  text(tl('pdf.lastPeriod'), 18, y + 6, { size: 8, color: muted });
  text(fmtShort(cycleData?.lastPeriodDate), 18, y + 13, { size: 11, bold: true });
  box(14 + half + 4, y, half, 18);
  text(tl('pdf.cycleLength'), 18 + half + 4, y + 6, { size: 8, color: muted });
  text(`${cycleData?.cycleLength || '—'} days`, 18 + half + 4, y + 13, { size: 11, bold: true });
  y += 22;

  box(14, y, half, 18);
  text(tl('pdf.periodDuration'), 18, y + 6, { size: 8, color: muted });
  text(`${cycleData?.periodDuration || '—'} days`, 18, y + 13, { size: 11, bold: true });
  box(14 + half + 4, y, half, 18);
  text(tl('pdf.nextOvulation'), 18 + half + 4, y + 6, { size: 8, color: muted });
  text(fmtShort(predictions?.ovulation), 18 + half + 4, y + 13, { size: 11, bold: true });
  y += 22;

  box(14, y, W - 28, 20, [254, 226, 226]);
  text(tl('pdf.nextPeriod'), 18, y + 6, { size: 8, color: muted });
  text(fmt(predictions?.nextPeriod), 18, y + 14, { size: 14, bold: true, color: [225, 29, 72] });
  y += 26;

  // ── Period History ────────────────────────────────────────────────────────
  text('Period History', 14, y, { size: 13, bold: true, color: pink });
  y += 2;
  line(y, pink);
  y += 5;

  // Table header
  box(14, y, W - 28, 8, [253, 242, 244]);
  text(tl('pdf.periodStart'), 18, y + 5.5, { size: 9, bold: true, color: [190, 24, 93] });
  text(tl('pdf.periodEnd'), 80, y + 5.5, { size: 9, bold: true, color: [190, 24, 93] });
  text(tl('pdf.duration'), 150, y + 5.5, { size: 9, bold: true, color: [190, 24, 93] });
  y += 10;

  if (cycleData?.lastPeriodDate && cycleData?.cycleLength) {
    let start = new Date(cycleData.lastPeriodDate);
    const rows = [];
    for (let i = 0; i < 4; i++) {
      rows.unshift({
        start: new Date(start),
        end: new Date(new Date(start).setDate(start.getDate() + (cycleData.periodDuration || 5) - 1)),
      });
      start = new Date(start.setDate(start.getDate() - cycleData.cycleLength));
    }
    rows.forEach((r, idx) => {
      if (idx % 2 === 0) box(14, y - 2, W - 28, 9, [249, 250, 251]);
      text(fmt(r.start), 18, y + 4.5, { size: 9 });
      text(fmt(r.end), 80, y + 4.5, { size: 9 });
      text(`${cycleData.periodDuration} days`, 150, y + 4.5, { size: 9 });
      y += 9;
    });
  }
  y += 4;

  // ── PCOS ─────────────────────────────────────────────────────────────────
  const pcosResult = assessments?.pcos?.result;
  if (pcosResult) {
    if (y > 230) { doc.addPage(); y = 20; }
    text(tl('pdf.pcosRisk'), 14, y, { size: 13, bold: true, color: pink });
    y += 2; line(y, pink); y += 5;
    box(14, y, half, 18);
    text(tl('pdf.riskLevel'), 18, y + 6, { size: 8, color: muted });
    const bandCol = pcosResult.band === 'low' ? [16, 185, 129] : pcosResult.band === 'moderate' ? [245, 158, 11] : [239, 68, 68];
    text((pcosResult.band || '—').toUpperCase(), 18, y + 13, { size: 11, bold: true, color: bandCol });
    box(14 + half + 4, y, half, 18);
    text(tl('pdf.score'), 18 + half + 4, y + 6, { size: 8, color: muted });
    text(`${pcosResult.points ?? '—'} / ${pcosResult.maxPoints ?? '—'}`, 18 + half + 4, y + 13, { size: 11, bold: true });
    y += 22;
    if (pcosResult.recommendation) {
      const lines = doc.splitTextToSize(pcosResult.recommendation, W - 28);
      text(lines.join('\n'), 14, y, { size: 9, color: muted });
      y += lines.length * 5 + 4;
    }
  }

  // ── BMI ───────────────────────────────────────────────────────────────────
  const bmiResult = assessments?.bmi?.result;
  if (bmiResult) {
    if (y > 230) { doc.addPage(); y = 20; }
    text(tl('pdf.bmiReport'), 14, y, { size: 13, bold: true, color: pink });
    y += 2; line(y, pink); y += 5;
    box(14, y, half, 18);
    text(tl('pdf.bmiValue'), 18, y + 6, { size: 8, color: muted });
    text(String(bmiResult.bmi), 18, y + 13, { size: 11, bold: true });
    box(14 + half + 4, y, half, 18);
    text(tl('pdf.category'), 18 + half + 4, y + 6, { size: 8, color: muted });
    text(bmiResult.category || '—', 18 + half + 4, y + 13, { size: 11, bold: true });
    y += 26;
  }

  // ── Mental Wellbeing ──────────────────────────────────────────────────────
  const mentalResult = assessments?.mental?.result;
  if (mentalResult) {
    if (y > 230) { doc.addPage(); y = 20; }
    text(tl('pdf.mentalWellbeing'), 14, y, { size: 13, bold: true, color: pink });
    y += 2; line(y, pink); y += 5;
    box(14, y, half, 18);
    text(tl('pdf.riskLevel'), 18, y + 6, { size: 8, color: muted });
    const mCol = mentalResult.band === 'low' ? [16, 185, 129] : mentalResult.band === 'moderate' ? [245, 158, 11] : [239, 68, 68];
    text((mentalResult.band || '—').toUpperCase(), 18, y + 13, { size: 11, bold: true, color: mCol });
    box(14 + half + 4, y, half, 18);
    text(tl('pdf.score'), 18 + half + 4, y + 6, { size: 8, color: muted });
    text(`${mentalResult.points ?? '—'} / ${mentalResult.maxPoints ?? '—'}`, 18 + half + 4, y + 13, { size: 11, bold: true });
    y += 26;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(
      tl('pdf.disclaimer'),
      W / 2, 290, { align: 'center', maxWidth: W - 28 }
    );
  }

  // ── Download directly — no popup, no print dialog ─────────────────────────
  const filename = `swasthasaheli-report-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}
