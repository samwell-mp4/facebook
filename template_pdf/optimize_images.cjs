const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeAll() {
  const dataPath = path.resolve('template_pdf/dados-catalogo-completo.json');
  const perfumes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const optDir = path.resolve('template_pdf/opt_images');
  if (!fs.existsSync(optDir)) {
    fs.mkdirSync(optDir, { recursive: true });
  }

  console.log(`🖼️ Otimizando imagens de ${perfumes.length} perfumes...`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (let i = 0; i < perfumes.length; i++) {
    const p = perfumes[i];
    // Resolve absolute path from relative foto path
    const origRelPath = p.foto.replace(/^\.\.\//, '');
    const origAbsPath = path.resolve(origRelPath);

    const destFileName = `opt_${p.numero.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    const destPath = path.join(optDir, destFileName);

    if (fs.existsSync(origAbsPath)) {
      const origStat = fs.statSync(origAbsPath);
      totalOriginalSize += origStat.size;

      await sharp(origAbsPath)
        .rotate() // Auto-orient based on EXIF
        .resize({ height: 1200, withoutEnlargement: true })
        .jpeg({ quality: 84, mozjpeg: true })
        .toFile(destPath);

      const optStat = fs.statSync(destPath);
      totalOptimizedSize += optStat.size;

      // Update perfume data to point to optimized image
      p.fotoOriginal = p.foto;
      p.foto = `./opt_images/${destFileName}`;
      p.fotoAbsoluta = 'file:///' + destPath.replace(/\\/g, '/');

      console.log(`[${i + 1}/${perfumes.length}] ${p.nome}: ${(origStat.size / 1024 / 1024).toFixed(2)}MB -> ${(optStat.size / 1024).toFixed(1)}KB`);
    } else {
      console.warn(`[AVISO] Foto não encontrada: ${origAbsPath}`);
    }
  }

  // Salva dados atualizados
  fs.writeFileSync(dataPath, JSON.stringify(perfumes, null, 2), 'utf8');

  console.log('\n📊 RESULTADO DA OTIMIZAÇÃO:');
  console.log(`Tamanho original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Tamanho otimizado total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Redução de: ${((1 - (totalOptimizedSize / totalOriginalSize)) * 100).toFixed(1)}%!`);
}

optimizeAll().catch(console.error);
