const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, filename, logoBase64 } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  let browser = null;
  try {
    // Must set this for Vercel serverless
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    const logoTag = logoBase64
      ? `<img src="${logoBase64}" style="height:34px;object-fit:contain;">`
      : `<span style="font-size:9pt;font-weight:700;">Orbit Digital</span>`;

    const headerHtml = `<div style="width:100%;padding:4px 20mm;display:flex;justify-content:space-between;align-items:center;font-family:sans-serif;font-size:8pt;border-bottom:0.5px solid #aaa;-webkit-print-color-adjust:exact">
      ${logoTag}
      <span style="color:#555">บริษัท ออร์บิท ดิจิทัล จำกัด</span>
    </div>`;

    const footerHtml = `<div style="width:100%;padding:4px 20mm;text-align:center;font-family:sans-serif;font-size:8pt;font-weight:700;border-top:0.5px solid #aaa;-webkit-print-color-adjust:exact">
      บริษัท ออร์บิท ดิจิทัล จำกัด<br>
      <span style="font-weight:400;color:#555;font-size:7.5pt">51 ถนนนราธิวาสราชนครินทร์ แขวงสีลม เขตบางรัก กรุงเทพมหานคร</span>
    </div>`;

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'TH Sarabun New',sans-serif;font-size:10pt;color:#000;line-height:1.75;padding:0 4px}
      table{width:100%;border-collapse:collapse;margin:6px 0;font-size:10pt}
      th{background:#d0d0d0;font-weight:700;text-align:center;padding:4px 8px;border:1px solid #555}
      td{padding:3px 8px;border:1px solid #888;text-align:center}
      td.tdl{text-align:left}
      tr.tr-total td{font-weight:700;background:#ebebeb;border-top:1.5px solid #333}
      .mp-title{text-align:center;font-size:16pt;font-weight:700;letter-spacing:1px;margin-bottom:14px}
      .mp-field{display:flex;margin-bottom:5px;font-size:10pt}
      .mp-field-label{font-weight:700;min-width:80px}
      .mp-body p{text-indent:3em;margin-bottom:3px;font-size:10pt}
      .mp-list{margin:3px 0 3px 3em;font-size:10pt}
      .mp-list li{margin-bottom:2px}
      .mp-note{font-size:9pt;color:#333;margin:3px auto 8px;text-align:center}
      .mp-closing p{text-indent:3em;font-size:9.5pt;line-height:1.7}
      .mp-approval{display:grid;grid-template-columns:1fr 1fr;border:1px solid #555;margin-top:10px;page-break-inside:avoid;break-inside:avoid}
      .mp-appr-cell{padding:6px 12px}
      .mp-appr-cell:first-child{border-right:1px solid #555}
      .mp-appr-head{font-size:10pt;font-weight:700;margin-bottom:4px}
      .mp-appr-opt{font-size:10pt;margin:2px 0}
      .mp-sig-space{height:36px;border-bottom:1px solid #333;margin:10px 16px 4px}
      .mp-sig-name,.mp-sig-role,.mp-sig-date{text-align:center;font-size:10pt}
      .mp-sig-name{font-weight:700}
      .mp-sig-date{font-size:9pt;color:#666}
      .mp-hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #888;padding-bottom:10px;margin-bottom:14px}
      .mp-logo{max-height:55px;max-width:140px;object-fit:contain}
      .mp-hdr-right{text-align:right;font-size:10pt;line-height:2}
      .num{text-decoration:underline;font-weight:700}
      .mp-footer{display:none}
      .preview-wrap{background:transparent}
    </style></head><body>${html}</body></html>`;

    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 10000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '28mm', right: '18mm', bottom: '28mm', left: '18mm' },
      displayHeaderFooter: true,
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'memo.pdf'}"`);
    res.send(pdf);

  } catch (err) {
    console.error('PDF error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
