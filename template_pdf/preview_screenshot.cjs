const puppeteer = require('puppeteer-core');
const path = require('path');

async function main() {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const htmlPath = path.resolve('template_pdf/catalogo_completo.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const cards = await page.$$('.catalog-page');
  const card = cards[0];
  const screenshotPath = path.resolve('template_pdf/preview_test_page.png');
  await card.screenshot({ path: screenshotPath });
  console.log('Preview gerado em:', screenshotPath);

  await browser.close();
}

main().catch(console.error);
