const puppeteer = require('puppeteer');

const BASE = 'http://localhost:8733/';
const pages = [
  ['social.html', 'preview-social.png'],
  ['dashboards.html', 'preview-dashboards.png'],
  ['class-projects.html', 'preview-projects.png'],
  ['chatbot.html', 'preview-chatbot.png'],
  ['about.html', 'preview-about.png'],
  ['projects/project-n8n.html', 'preview-n8n.png'],
  ['projects/project-langchain.html', 'preview-langchain.png'],
  ['projects/project-aistudio.html', 'preview-aistudio.png'],
  ['projects/project-ml.html', 'preview-ml.png'],
  ['projects/project-skillswap.html', 'preview-skillswap.png'],
  ['projects/project-chatbot.html', 'preview-projchatbot.png'],
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const [url, out] of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    try {
      await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1440, height: 900 } });
      console.log('shot', out);
    } catch (e) {
      console.log('FAIL', url, e.message);
    }
    await page.close();
  }
  await browser.close();
})();
