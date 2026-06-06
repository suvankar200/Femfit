import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { translations } from '../i18n/index.js';

/**
 * generateHealthReport
 * All languages → renders a styled HTML div using html2canvas,
 * then saves it directly as a PDF download (no print dialog).
 *
 * Why html2canvas for Hindi/Bengali?
 *   jsPDF's built-in Helvetica has NO Devanagari or Bengali glyphs.
 *   html2canvas lets the browser render text with the correct Unicode font,
 *   then snapshots it as an image that jsPDF embeds into the PDF.
 */
export async function generateHealthReport({ user, cycleData, assessments, predictions, language = 'en' }) {
  const dict = translations[language] || translations.en;
  const tl = (key) => dict[key] || translations.en[key] || key;

  const name  = user?.name || 'User';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fmtShort = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  // ── Build period history rows ─────────────────────────────────────────────
  let historyRows = '';
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
      historyRows += `
        <tr style="background:${idx % 2 === 0 ? '#f9fafb' : '#fff'}">
          <td style="padding:7px 10px">${fmt(r.start)}</td>
          <td style="padding:7px 10px">${fmt(r.end)}</td>
          <td style="padding:7px 10px">${cycleData.periodDuration} days</td>
        </tr>`;
    });
  }

  // ── Optional sections ─────────────────────────────────────────────────────
  const pcosResult   = assessments?.pcos?.result;
  const bmiResult    = assessments?.bmi?.result;
  const mentalResult = assessments?.mental?.result;

  const bandColor = (band) =>
    band === 'low' ? '#10b981' : band === 'moderate' ? '#f59e0b' : '#ef4444';

  const pcosHtml = pcosResult ? `
    <div style="margin-bottom:24px">
      <h2 style="font-size:14px;font-weight:700;color:#f43f5e;padding-bottom:6px;border-bottom:1.5px solid #f43f5e;margin-bottom:14px">
        ${tl('pdf.pcosRisk')}
      </h2>
      <div style="display:flex;gap:12px;margin-bottom:8px">
        <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.riskLevel')}</div>
          <div style="font-size:14px;font-weight:700;color:${bandColor(pcosResult.band)}">${(pcosResult.band || '—').toUpperCase()}</div>
        </div>
        <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.score')}</div>
          <div style="font-size:14px;font-weight:700;color:#1f2937">${pcosResult.points ?? '—'} / ${pcosResult.maxPoints ?? '—'}</div>
        </div>
      </div>
      ${pcosResult.recommendation ? `<p style="font-size:11px;color:#6b7280;margin:0">${pcosResult.recommendation}</p>` : ''}
    </div>` : '';

  const bmiHtml = bmiResult ? `
    <div style="margin-bottom:24px">
      <h2 style="font-size:14px;font-weight:700;color:#f43f5e;padding-bottom:6px;border-bottom:1.5px solid #f43f5e;margin-bottom:14px">
        ${tl('pdf.bmiReport')}
      </h2>
      <div style="display:flex;gap:12px">
        <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.bmiValue')}</div>
          <div style="font-size:14px;font-weight:700;color:#1f2937">${bmiResult.bmi}</div>
        </div>
        <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.category')}</div>
          <div style="font-size:14px;font-weight:700;color:#1f2937">${bmiResult.category || '—'}</div>
        </div>
      </div>
    </div>` : '';

  const mentalHtml = mentalResult ? `
    <div style="margin-bottom:24px">
      <h2 style="font-size:14px;font-weight:700;color:#f43f5e;padding-bottom:6px;border-bottom:1.5px solid #f43f5e;margin-bottom:14px">
        ${tl('pdf.mentalWellbeing')}
      </h2>
      <div style="display:flex;gap:12px">
        <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.riskLevel')}</div>
          <div style="font-size:14px;font-weight:700;color:${bandColor(mentalResult.band)}">${(mentalResult.band || '—').toUpperCase()}</div>
        </div>
        <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.score')}</div>
          <div style="font-size:14px;font-weight:700;color:#1f2937">${mentalResult.points ?? '—'} / ${mentalResult.maxPoints ?? '—'}</div>
        </div>
      </div>
    </div>` : '';

  // ── Pick Unicode font for non-Latin scripts ───────────────────────────────
  // Loaded via a <link> injected into the offscreen container's shadow DOM
  // doesn't work — so we inject a @import into a <style> tag instead.
  const googleFontImport =
    language === 'bn'
      ? "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap');"
      : language === 'hi'
      ? "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');"
      : '';

  const fontFamily =
    language === 'bn'
      ? "'Noto Sans Bengali', sans-serif"
      : language === 'hi'
      ? "'Noto Sans Devanagari', sans-serif"
      : "'Helvetica Neue', Helvetica, Arial, sans-serif";

  // ── Build the HTML string for the report ─────────────────────────────────
  const reportHtml = `
    <style>
      ${googleFontImport}
      .ss-report * { box-sizing: border-box; margin: 0; padding: 0; }
      .ss-report {
        font-family: ${fontFamily};
        color: #1f2937;
        background: #fff;
        width: 794px;
        padding: 0;
        font-size: 13px;
        line-height: 1.6;
      }
    </style>
    <div class="ss-report">

      <!-- Header -->
      <div style="background:#f43f5e;color:#fff;padding:18px 28px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:10px;color:#ffc8d2;margin-bottom:4px">Swasthasaheli</div>
          <div style="font-size:15px;font-weight:700">${tl('pdf.patient')} ${name}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:700">Femfit</div>
          <div style="font-size:10px;color:#ffc8d2;margin-top:4px">${tl('pdf.generated')} ${today}</div>
        </div>
      </div>

      <!-- Content -->
      <div style="padding:24px 28px">

        <!-- Cycle Summary -->
        <div style="margin-bottom:24px">
          <h2 style="font-size:14px;font-weight:700;color:#f43f5e;padding-bottom:6px;border-bottom:1.5px solid #f43f5e;margin-bottom:14px">
            ${tl('pdf.cycleSummary')}
          </h2>
          <div style="display:flex;gap:12px;margin-bottom:10px">
            <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
              <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.lastPeriod')}</div>
              <div style="font-size:14px;font-weight:700">${fmtShort(cycleData?.lastPeriodDate)}</div>
            </div>
            <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
              <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.cycleLength')}</div>
              <div style="font-size:14px;font-weight:700">${cycleData?.cycleLength || '—'} days</div>
            </div>
            <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
              <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.periodDuration')}</div>
              <div style="font-size:14px;font-weight:700">${cycleData?.periodDuration || '—'} days</div>
            </div>
            <div style="flex:1;background:#fdf2f4;border-radius:8px;padding:10px 14px">
              <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.nextOvulation')}</div>
              <div style="font-size:14px;font-weight:700">${fmtShort(predictions?.ovulation)}</div>
            </div>
          </div>
          <div style="background:#fee2e6;border-radius:8px;padding:12px 16px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${tl('pdf.nextPeriod')}</div>
            <div style="font-size:18px;font-weight:700;color:#e11d48">${fmt(predictions?.nextPeriod)}</div>
          </div>
        </div>

        <!-- Period History -->
        <div style="margin-bottom:24px">
          <h2 style="font-size:14px;font-weight:700;color:#f43f5e;padding-bottom:6px;border-bottom:1.5px solid #f43f5e;margin-bottom:14px">
            ${tl('pdf.periodHistory')}
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#fdf2f4">
                <th style="padding:7px 10px;text-align:left;color:#be185d;font-weight:700">${tl('pdf.periodStart')}</th>
                <th style="padding:7px 10px;text-align:left;color:#be185d;font-weight:700">${tl('pdf.periodEnd')}</th>
                <th style="padding:7px 10px;text-align:left;color:#be185d;font-weight:700">${tl('pdf.duration')}</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows || `<tr><td colspan="3" style="padding:10px;color:#9ca3af">—</td></tr>`}
            </tbody>
          </table>
        </div>

        ${pcosHtml}
        ${bmiHtml}
        ${mentalHtml}

        <!-- Footer -->
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;text-align:center">
          ${tl('pdf.disclaimer')}
        </div>

      </div>
    </div>`;

  // ── Mount the HTML in an off-screen container ─────────────────────────────
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    'width:794px',          // A4 at 96 dpi ≈ 794px wide
    'background:#fff',
    'z-index:-1',
  ].join(';');
  container.innerHTML = reportHtml;
  document.body.appendChild(container);

  // For non-Latin scripts: wait for the Google Font to load before capturing
  const waitForFont = () => {
    if (language === 'en') return Promise.resolve();
    const fontName =
      language === 'bn' ? 'Noto Sans Bengali' : 'Noto Sans Devanagari';
    // document.fonts.load resolves when the font is available
    return document.fonts.load(`700 14px "${fontName}"`).catch(() => {});
  };

  try {
    // Wait for font, then add a small buffer for layout
    await waitForFont();
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(container, {
      scale: 2,          // 2× for crisp text on retina / print
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData   = canvas.toDataURL('image/jpeg', 0.95);
    const pdfW      = 210;               // A4 mm
    const pdfH      = (canvas.height / canvas.width) * pdfW;

    // If the report is taller than A4, split into multiple pages
    const pageHeight = 297; // A4 height mm
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    if (pdfH <= pageHeight) {
      doc.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
    } else {
      // Multi-page: slice the image by page height
      const ratio       = canvas.width / pdfW;          // px per mm
      const pageHeightPx = pageHeight * ratio;
      let   offsetPx    = 0;
      let   page        = 0;

      while (offsetPx < canvas.height) {
        if (page > 0) doc.addPage();

        // Create a slice canvas for this page
        const sliceH   = Math.min(pageHeightPx, canvas.height - offsetPx);
        const slice    = document.createElement('canvas');
        slice.width    = canvas.width;
        slice.height   = sliceH;
        slice.getContext('2d').drawImage(
          canvas,
          0, offsetPx, canvas.width, sliceH,
          0, 0, canvas.width, sliceH
        );

        const sliceMmH = sliceH / ratio;
        doc.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, sliceMmH);
        offsetPx += pageHeightPx;
        page++;
      }
    }

    const filename = `swasthasaheli-report-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    doc.save(filename);

  } finally {
    document.body.removeChild(container);
  }
}
