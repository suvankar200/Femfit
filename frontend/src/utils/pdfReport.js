import jsPDF from 'jspdf';

/**
 * generateHealthReport
 * Directly downloads a PDF — no popups, no print dialog.
 */
export function generateHealthReport({ user, cycleData, assessments, predictions }) {
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
  doc.rect(0, 0, W, 22, 'F');
  text('🌸 Swasthasaheli', 14, 9, { size: 16, bold: true, color: [255, 255, 255] });
  text("Women's Health Report", 14, 16, { size: 9, color: [255, 200, 210] });
  text(name, W - 14, 9, { size: 11, bold: true, color: [255, 255, 255] });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 200, 210);
  doc.text(`Generated: ${today}`, W - 14, 16, { align: 'right' });

  y = 32;

  // ── Cycle Summary ─────────────────────────────────────────────────────────
  text('Cycle Summary', 14, y, { size: 13, bold: true, color: pink });
  y += 2;
  line(y, pink);
  y += 5;

  const half = (W - 28 - 4) / 2;
  // Box 1
  box(14, y, half, 18);
  text('Last Period', 18, y + 6, { size: 8, color: muted });
  text(fmtShort(cycleData?.lastPeriodDate), 18, y + 13, { size: 11, bold: true });
  // Box 2
  box(14 + half + 4, y, half, 18);
  text('Cycle Length', 18 + half + 4, y + 6, { size: 8, color: muted });
  text(`${cycleData?.cycleLength || '—'} days`, 18 + half + 4, y + 13, { size: 11, bold: true });
  y += 22;

  // Box 3
  box(14, y, half, 18);
  text('Period Duration', 18, y + 6, { size: 8, color: muted });
  text(`${cycleData?.periodDuration || '—'} days`, 18, y + 13, { size: 11, bold: true });
  // Box 4
  box(14 + half + 4, y, half, 18);
  text('Next Ovulation', 18 + half + 4, y + 6, { size: 8, color: muted });
  text(fmtShort(predictions?.ovulation), 18 + half + 4, y + 13, { size: 11, bold: true });
  y += 22;

  // Next period highlight
  box(14, y, W - 28, 20, [254, 226, 226]);
  text('Next Expected Period', 18, y + 6, { size: 8, color: muted });
  text(fmt(predictions?.nextPeriod), 18, y + 14, { size: 14, bold: true, color: [225, 29, 72] });
  y += 26;

  // ── Period History ────────────────────────────────────────────────────────
  text('Period History', 14, y, { size: 13, bold: true, color: pink });
  y += 2;
  line(y, pink);
  y += 5;

  // Table header
  box(14, y, W - 28, 8, [253, 242, 244]);
  text('Period Start', 18, y + 5.5, { size: 9, bold: true, color: [190, 24, 93] });
  text('Period End', 80, y + 5.5, { size: 9, bold: true, color: [190, 24, 93] });
  text('Duration', 150, y + 5.5, { size: 9, bold: true, color: [190, 24, 93] });
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
    text('PCOS Risk Assessment', 14, y, { size: 13, bold: true, color: pink });
    y += 2; line(y, pink); y += 5;
    box(14, y, half, 18);
    text('Risk Level', 18, y + 6, { size: 8, color: muted });
    const bandCol = pcosResult.band === 'low' ? [16, 185, 129] : pcosResult.band === 'moderate' ? [245, 158, 11] : [239, 68, 68];
    text((pcosResult.band || '—').toUpperCase(), 18, y + 13, { size: 11, bold: true, color: bandCol });
    box(14 + half + 4, y, half, 18);
    text('Score', 18 + half + 4, y + 6, { size: 8, color: muted });
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
    text('BMI Report', 14, y, { size: 13, bold: true, color: pink });
    y += 2; line(y, pink); y += 5;
    box(14, y, half, 18);
    text('BMI Value', 18, y + 6, { size: 8, color: muted });
    text(String(bmiResult.bmi), 18, y + 13, { size: 11, bold: true });
    box(14 + half + 4, y, half, 18);
    text('Category', 18 + half + 4, y + 6, { size: 8, color: muted });
    text(bmiResult.category || '—', 18 + half + 4, y + 13, { size: 11, bold: true });
    y += 26;
  }

  // ── Mental Wellbeing ──────────────────────────────────────────────────────
  const mentalResult = assessments?.mental?.result;
  if (mentalResult) {
    if (y > 230) { doc.addPage(); y = 20; }
    text('Mental Wellbeing', 14, y, { size: 13, bold: true, color: pink });
    y += 2; line(y, pink); y += 5;
    box(14, y, half, 18);
    text('Risk Level', 18, y + 6, { size: 8, color: muted });
    const mCol = mentalResult.band === 'low' ? [16, 185, 129] : mentalResult.band === 'moderate' ? [245, 158, 11] : [239, 68, 68];
    text((mentalResult.band || '—').toUpperCase(), 18, y + 13, { size: 11, bold: true, color: mCol });
    box(14 + half + 4, y, half, 18);
    text('Score', 18 + half + 4, y + 6, { size: 8, color: muted });
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
      'This report is generated by Swasthasaheli for personal reference only. Consult a healthcare professional for medical advice.',
      W / 2, 290, { align: 'center', maxWidth: W - 28 }
    );
  }

  // ── Download directly — no popup, no print dialog ─────────────────────────
  const filename = `swasthasaheli-report-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}
