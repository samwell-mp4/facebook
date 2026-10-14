const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testStories() {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const htmlPath = path.resolve('template_pdf/story_template.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  const dataPath = path.resolve('template_pdf/dados-catalogo-completo.json');
  const perfumes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const pBrand = perfumes.find(p => p.numero === '445') || perfumes[0];
  const pArab = perfumes.find(p => p.numero === 'A032') || perfumes[1];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(fileUrl, { waitUntil: 'load' });

  const outDir = path.resolve('catalogo-story');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const p of [pBrand, pArab]) {
    await page.evaluate((item) => {
      window.renderStory(item);
    }, p);

    await page.evaluate(async () => {
      await document.fonts.ready;
      const img = document.querySelector('.hero-image');
      if (img && !img.complete) {
        await new Promise(r => { img.onload = r; img.onerror = r; });
      }
      if (img && img.decode) {
        try { await img.decode(); } catch(e) {}
      }
    });

    await new Promise(r => setTimeout(r, 400));

    const prefix = p.isArabic ? 'arab' : 'brand';
    const cleanNum = p.numero.toLowerCase();
    const cleanName = p.nome.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const filename = `${prefix}-${cleanNum}-${cleanName}.png`;
    const dest = path.join(outDir, filename);

    await page.screenshot({
      path: dest,
      type: 'png',
      fullPage: false,
      animations: 'disabled'
    });

    console.log(`✅ Story gerado: ${filename} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
}

testStories().catch(console.error);
