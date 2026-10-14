const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

function sanitizeFilename(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateAllStories() {
  console.log('🚀 Iniciando geração em lote dos Stories (1080x1920 px)...');

  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error('Google Chrome não encontrado em: ' + chromePath);
  }

  const htmlPath = path.resolve('template_pdf/story_template.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  const dataPath = path.resolve('template_pdf/dados-catalogo-completo.json');
  const perfumes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Pastas de saída: catalogo-story e public/catalogo-story (para o React)
  const outDir = path.resolve('catalogo-story');
  const publicDir = path.resolve('public/catalogo-story');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

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

  const manifest = [];
  let successCount = 0;
  let failCount = 0;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 120000 });

    for (let i = 0; i < perfumes.length; i++) {
      const p = perfumes[i];
      const prefix = p.isArabic ? 'arab' : 'brand';
      const cleanNum = sanitizeFilename(p.numero);
      const cleanName = sanitizeFilename(p.nome);
      const filename = `${prefix}-${cleanNum}-${cleanName}.png`;
      const outPath = path.join(outDir, filename);
      const publicPath = path.join(publicDir, filename);

      try {
        // Renderiza produto no template
        await page.evaluate((item) => {
          window.renderStory(item);
        }, p);

        // Aguarda carregamento de fontes e decodificação da foto original
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

        await new Promise(r => setTimeout(r, 200));

        // Captura screenshot individual exato 1080x1920
        await page.screenshot({
          path: outPath,
          type: 'png',
          fullPage: false,
          animations: 'disabled'
        });

        // Copia para a pasta public do React
        fs.copyFileSync(outPath, publicPath);

        const stat = fs.statSync(outPath);
        successCount++;

        manifest.push({
          sku: p.sku,
          numero: p.numero,
          nome: p.nome,
          marca: p.marca,
          isArabic: p.isArabic,
          concentracao: p.concentracao,
          volume: p.volume,
          familia_olfativa: p.familia_olfativa,
          ref: p.ref,
          filename: filename,
          path: `/catalogo-story/${filename}`,
          sizeBytes: stat.size,
          sizeKb: (stat.size / 1024).toFixed(1) + ' KB',
          dimensions: '1080x1920'
        });

        console.log(`[${i + 1}/${perfumes.length}] ✅ ${filename} (${(stat.size / 1024).toFixed(1)} KB)`);

      } catch (err) {
        failCount++;
        console.error(`[${i + 1}/${perfumes.length}] ❌ Erro ao gerar ${p.nome} (${p.numero}):`, err.message);
      }
    }

    // Salva o manifesto de stories em JSON
    const manifestPath = path.join(outDir, 'stories-manifest.json');
    const publicManifestPath = path.join(publicDir, 'stories-manifest.json');
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(manifestPath, manifestJson, 'utf8');
    fs.writeFileSync(publicManifestPath, manifestJson, 'utf8');

    // Também salva cópia para src/data/storiesManifest.js para o React importar estaticamente
    const srcManifestPath = path.resolve('src/data/storiesManifest.js');
    fs.writeFileSync(srcManifestPath, `export const STORIES_MANIFEST = ${manifestJson};\n`, 'utf8');

    console.log(`\n📦 Criando arquivo ZIP com todos os Stories...`);
    const zipPath = path.join(outDir, 'catalogo-stories-completo-1080x1920.zip');
    const publicZipPath = path.join(publicDir, 'catalogo-stories-completo-1080x1920.zip');
    const downloadsZipPath = 'C:/Users/User/Downloads/catalogo-stories-completo-1080x1920.zip';

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`🎉 ZIP criado com sucesso: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        // Copia para public e Downloads
        fs.copyFileSync(zipPath, publicZipPath);
        fs.copyFileSync(zipPath, downloadsZipPath);
        console.log(`📁 Cópia do ZIP salva em Downloads: ${downloadsZipPath}`);
        resolve();
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Adiciona cada imagem PNG ao ZIP
      for (const item of manifest) {
        const itemFile = path.join(outDir, item.filename);
        if (fs.existsSync(itemFile)) {
          archive.file(itemFile, { name: item.filename });
        }
      }

      archive.finalize();
    });

    console.log('\n======================================================');
    console.log(`🏁 GERAÇÃO EM LOTE FINALIZADA!`);
    console.log(`Sucessos: ${successCount}`);
    console.log(`Falhas: ${failCount}`);
    console.log(`Pasta dos Stories: ${outDir}`);
    console.log('======================================================');

  } finally {
    await browser.close();
  }
}

generateAllStories().catch(err => {
  console.error('❌ Falha geral na geração em lote:', err);
  process.exit(1);
});
