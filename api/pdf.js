const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { html, filename = 'CV.pdf' } = req.body || {};
  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid html parameter' });
  }
  if (html.length > 5_000_000) {
    return res.status(413).json({ error: 'HTML too large (max 5MB)' });
  }

  let browser = null;
  try {
    const executablePath = await chromium.executablePath();
    const libPath = path.dirname(executablePath);

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      defaultViewport: { width: 1280, height: 800 },
      executablePath,
      headless: true,
      env: {
        ...process.env,
        LD_LIBRARY_PATH: libPath + ':' + (process.env.LD_LIBRARY_PATH || ''),
      },
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'websocket'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await new Promise(r => setTimeout(r, 500));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });

    const safeFilename = filename.replace(/[^a-zA-Z0-9._\-åäöÅÄÖ ]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(Buffer.from(pdf));

  } catch (error) {
    console.error('[pdf.js] error:', error.message);
    res.status(500).json({ error: 'PDF generation failed', message: error.message });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { }
    }
  }
};
