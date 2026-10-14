const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('🚀 Iniciando geração do PDF em alta resolução (1920x1080 - 16:9)...');

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
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    console.log('⏳ Carregando catálogo e renderizando páginas...');
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 120000 });

    // Aguarda fontes e todas as fotos originais carregarem completamente
    console.log('🖼️ Aguardando carregamento completo de fontes e fotos...');
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

    // Pequena pausa para garantir renderização de filtros CSS e gradientes
    await new Promise(r => setTimeout(r, 2000));

    const totalPages = await page.evaluate(() => document.querySelectorAll('.catalog-page').length);
    console.log(`📊 Total de páginas detectadas: ${totalPages} páginas.`);

    const outputPdf = path.resolve('Catalogo_Snack_Store_BH_2026.pdf');
    console.log(`🖨️ Exportando PDF para: ${outputPdf}...`);

    await page.pdf({
      path: outputPdf,
      width: '20in',
      height: '11.25in',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0'
      }
    });

    const stat = fs.statSync(outputPdf);
    console.log(`🎉 PDF gerado com sucesso! Tamanho: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`📁 Arquivo salvo em: ${outputPdf}`);

    // Copia também para C:\Users\User\Downloads\Catalogo_Snack_Store_BH_2026.pdf para fácil acesso
    const downloadsPdf = 'C:/Users/User/Downloads/Catalogo_Snack_Store_BH_2026.pdf';
    fs.copyFileSync(outputPdf, downloadsPdf);
    console.log(`📁 Cópia salva diretamente em Downloads: ${downloadsPdf}`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Erro na geração do PDF:', err);
  process.exit(1);
});
