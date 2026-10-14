const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function test() {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const htmlPath = path.resolve('template_pdf/test_one_page.html');
  
  // Create a 1-page test HTML using the first perfume with optimized image
  const dataPath = path.resolve('template_pdf/dados-catalogo-completo.json');
  const perfumes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const p1 = perfumes[0];

  const htmlContent = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="template.css">
  <style>
    @page { size: 15in 8.4375in; margin: 0; }
  </style>
</head>
<body>
  <div class="catalog-page-container">
    <article class="catalog-page">
      <div class="photo">
        <img src="${p1.foto}" alt="${p1.nome}" loading="eager">
        <div class="photo-soften"></div>
      </div>
      <header class="brand-title">
        <div class="brand">ARABIC</div>
        <div class="collection">COLLECTION</div>
      </header>
      <div class="slogan">
        <div class="crown">♛</div>
        <div class="copy">FRAGRÂNCIAS<br>QUE INSPIRAM<br>SUA ESSÊNCIA</div>
      </div>
      <section class="product-detail">
        <div class="number-box"><span>Nº</span>${p1.numero}</div>
        <h1 class="product-name" style="font-size: 56px;">${p1.nome}</h1>
        <div class="gold-rule"></div>
        <div class="edp">EAU DE PARFUM</div>
        <div class="specs">
          <div class="spec"><span class="symbol">♙</span><div class="val">25 ml</div><div class="sub">Volume</div></div>
          <div class="spec"><span class="symbol">◇</span><div class="val">EDP</div><div class="sub">Concentração</div></div>
          <div class="spec"><span class="symbol">◷</span><div class="val">PERFUME</div><div class="sub">Fragrância</div></div>
        </div>
      </section>
      <section class="accord-card">
        <h2>Principais acordes</h2>
        <div class="accord-bars">
          ${p1.acordes.map(a => `<div class="accord-bar ${a.claro?'light':''}" style="background:${a.cor};width:${a.intensidade}%;">${a.nome}</div>`).join('')}
        </div>
      </section>
      <footer class="notes-panel">
        <section class="notes-col">
          <h3>Família olfativa</h3>
          <div class="family-icon">✿</div>
          <div class="family-name">${p1.familia_olfativa}</div>
        </section>
        <section class="notes-col"><h3>Notas de topo</h3><div class="note-illustration">${p1.notas.topo.ilustracao}</div><div class="note-text">${p1.notas.topo.ingredientes}</div></section>
        <section class="notes-col"><h3>Notas de coração</h3><div class="note-illustration">${p1.notas.coracao.ilustracao}</div><div class="note-text">${p1.notas.coracao.ingredientes}</div></section>
        <section class="notes-col"><h3>Notas de fundo</h3><div class="note-illustration">${p1.notas.fundo.ilustracao}</div><div class="note-text">${p1.notas.fundo.ingredientes}</div></section>
      </footer>
      <small class="foot-brand">SNACK STORE BH • CATÁLOGO DE FRAGRÂNCIAS 25ML</small>
    </article>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    protocolTimeout: 0,
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const testPdf = path.resolve('template_pdf/test_page.pdf');
  await page.pdf({
    path: testPdf,
    width: '15in',
    height: '8.4375in',
    scale: 0.75,
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  const stat = fs.statSync(testPdf);
  console.log(`Página de teste gerada: ${(stat.size / 1024).toFixed(1)} KB`);
  await browser.close();
}

test().catch(console.error);
