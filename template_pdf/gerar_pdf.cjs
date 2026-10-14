const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('🚀 Iniciando geração do Catálogo PDF Otimizado e Responsivo...');

  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error('Google Chrome não encontrado em: ' + chromePath);
  }

  const htmlPath = path.resolve('template_pdf/catalogo_completo.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('📄 Abrindo arquivo HTML:', fileUrl);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    protocolTimeout: 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
      '--enable-local-file-accesses',
      '--disable-web-security'
    ]
  });

  try {
    const page = await browser.newPage();
    // Usa viewport 1920x1080 para layout mestre
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    console.log('⏳ Carregando páginas e fotos otimizadas...');
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 120000 });

    console.log('🖼️ Aguardando fontes e fotos...');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map(img => {
          if (img.complete) return null;
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    await new Promise(r => setTimeout(r, 1500));

    const totalPages = await page.evaluate(() => document.querySelectorAll('.catalog-page').length);
    console.log(`📊 Total de páginas detectadas: ${totalPages} páginas.`);

    const outputPdf = path.resolve('Catalogo_Snack_Store_BH_2026.pdf');
    console.log(`🖨️ Exportando PDF otimizado (15in x 8.4375in - proporção 16:9, escala 0.75 perfeita para 100% de zoom)...`);

    // PDF ajustado: largura 15in (1440px), altura 8.4375in (810px), scale 0.75
    // Enquadra perfeitamente em telas sem necessidade de diminuir o zoom do Chrome para 75%
    await page.pdf({
      path: outputPdf,
      width: '15in',
      height: '8.4375in',
      scale: 0.75,
      printBackground: true,
      preferCSSPageSize: false,
      timeout: 0,
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0'
      }
    });

    const stat = fs.statSync(outputPdf);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
    console.log(`🎉 PDF gerado com sucesso! Tamanho final: ${sizeMb} MB`);
    console.log(`📁 Arquivo salvo em: ${outputPdf}`);

    // Copia diretamente para a pasta de Downloads
    const downloadsPdf = 'C:/Users/User/Downloads/Catalogo_Snack_Store_BH_2026.pdf';
    fs.copyFileSync(outputPdf, downloadsPdf);
    console.log(`📁 Cópia salva em Downloads: ${downloadsPdf}`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Erro na geração do PDF:', err);
  process.exit(1);
});
