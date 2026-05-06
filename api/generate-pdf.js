const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, filename, logoBase64 } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Missing html content' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Full HTML with header/footer styles
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'TH Sarabun New', 'Sarabun', serif;
    font-size: 10pt;
    color: #000;
    line-height: 1.8;
  }
  .memo-content { padding: 0 8px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
  th { background: #d0d0d0; font-weight: 700; text-align: center; padding: 4px 8px; border: 1px solid #555; }
  td { padding: 3px 8px; border: 1px solid #888; text-align: center; color: #000; }
  td.tdl { text-align: left; }
  tr.tr-total td { font-weight: 700; background: #ebebeb; border-top: 1.5px solid #333; }
  .mp-title { text-align: center; font-size: 16pt; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; }
  .mp-field { display: flex; gap: 0; margin-bottom: 6px; font-size: 10pt; }
  .mp-field-label { font-weight: 700; min-width: 80px; }
  .mp-body p { text-indent: 3em; margin-bottom: 4px; font-size: 10pt; }
  .mp-list { margin: 4px 0 4px 3em; font-size: 10pt; }
  .mp-list li { margin-bottom: 3px; }
  .mp-note { font-size: 9pt; color: #333; margin: 4px auto 12px; text-align: center; }
  .mp-closing p { text-indent: 3em; font-size: 10pt; }
  .mp-approval { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #555; margin-top: 12px; page-break-inside: avoid; break-inside: avoid; }
  .mp-appr-cell { padding: 12px 16px; }
  .mp-appr-cell:first-child { border-right: 1px solid #555; }
  .mp-appr-head { font-size: 10pt; font-weight: 700; margin-bottom: 5px; }
  .mp-appr-opt { font-size: 10pt; margin: 2px 0; }
  .mp-sig-space { height: 48px; border-bottom: 1px solid #333; margin: 14px 20px 5px; }
  .mp-sig-name, .mp-sig-role, .mp-sig-date { text-align: center; font-size: 10pt; }
  .mp-sig-name { font-weight: 700; }
  .mp-sig-date { font-size: 9pt; color: #666; margin-top: 2px; }
  .mp-hdr-in-content { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #888; padding-bottom: 12px; margin-bottom: 20px; }
  .mp-logo { max-height: 60px; max-width: 150px; object-fit: contain; }
  .mp-hdr-right { text-align: right; font-size: 10pt; line-height: 2; }
  .mp-hdr-right .num { text-decoration: underline; font-weight: 700; }
</style>
</head>
<body>
<div class="memo-content">
${html}
</div>
</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Header HTML with logo
    const headerHtml = `
      <div style="width:100%;padding:8px 20mm 6px;border-bottom:1px solid #888;display:flex;justify-content:space-between;align-items:center;font-family:'Sarabun',serif;font-size:9pt;">
        <img src="${logoBase64 || ''}" style="height:40px;object-fit:contain;" />
        <div style="text-align:right;line-height:1.8;color:#000">
          <span style="font-size:8pt;color:#555">บริษัท ออร์บิท ดิจิทัล จำกัด</span>
        </div>
      </div>`;

    // Footer HTML
    const footerHtml = `
      <div style="width:100%;padding:6px 20mm 8px;border-top:1px solid #888;text-align:center;font-family:'Sarabun',serif;font-size:9pt;font-weight:700;color:#000">
        บริษัท ออร์บิท ดิจิทัล จำกัด<br>
        <span style="font-size:8.5pt;font-weight:400;color:#555">51 ถนนนราธิวาสราชนครินทร์ แขวงสีลม เขตบางรัก กรุงเทพมหานคร</span>
      </div>`;

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '35mm', right: '20mm', bottom: '30mm', left: '20mm' },
      displayHeaderFooter: true,
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'memo.pdf'}"`);
    res.send(pdf);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};
