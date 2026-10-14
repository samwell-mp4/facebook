const fs = require('fs');
const path = require('path');

function buildHtml() {
  const dataPath = path.resolve('template_pdf/dados-catalogo-completo.json');
  const perfumes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catálogo Oficial Snack Store BH - 2026</title>
  <link rel="stylesheet" href="template.css">
</head>
<body>
  <main id="catalogo"></main>

  <script>
    'use strict';
    const PERFUMES = ${JSON.stringify(perfumes)};

    const escapeHtml = x => String(x ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const stripUnsafePath = x => String(x || '').replace(/["<>]/g, '');

    function renderPage(perfume) {
      const accords = (perfume.acordes || []).slice(0, 10).map(a => 
        \`<div class="accord-bar \${a.claro ? 'light' : ''}" style="background:\${/^#[0-9a-f]{6}$/i.test(a.cor) ? a.cor : '#957a6b'};width:\${Math.max(35, Math.min(100, +a.intensidade || 50))}%;">\${escapeHtml(a.nome)}</div>\`
      ).join('');

      const note = (key, label) => {
        const n = perfume.notas?.[key] || {};
        return \`<section class="notes-col \${n.ilustracao ? '' : 'note-col-empty'}">
          <h3>\${label}</h3>
          <div class="note-illustration">\${n.ilustracao || ''}</div>
          <div class="note-text">\${escapeHtml(n.ingredientes || 'Não informado')}</div>
        </section>\`;
      };

      const brandWord = perfume.isArabic ? 'ARABIC' : 'BRAND';
      const collWord = 'COLLECTION';
      const nameLen = String(perfume.nome || '').length;
      const fontSize = nameLen > 18 ? '36' : (nameLen > 13 ? '44' : '56');

      return \`<div class="catalog-page-container">
        <article class="catalog-page">
          <div class="photo">
            <img src="\${stripUnsafePath(perfume.foto)}" alt="Foto original do perfume \${escapeHtml(perfume.nome)}" loading="eager">
            <div class="photo-soften"></div>
          </div>

          <header class="brand-title">
            <div class="brand">\${brandWord}</div>
            <div class="collection">\${collWord}</div>
          </header>

          <div class="slogan">
            <div class="crown">♛</div>
            <div class="copy">FRAGRÂNCIAS<br>QUE INSPIRAM<br>SUA ESSÊNCIA</div>
          </div>

          <section class="product-detail">
            <div class="number-box"><span>Nº</span>\${escapeHtml(perfume.numero)}</div>
            <h1 class="product-name" style="font-size: \${fontSize}px;">\${escapeHtml(perfume.nome)}</h1>
            <div class="gold-rule"></div>
            <div class="edp">\${escapeHtml(perfume.concentracao || 'EAU DE PARFUM')}</div>

            <div class="specs">
              <div class="spec">
                <span class="symbol">♙</span>
                <div class="val">\${escapeHtml(perfume.volume || '25 ml')}</div>
                <div class="sub">Volume</div>
              </div>
              <div class="spec">
                <span class="symbol">◇</span>
                <div class="val">\${escapeHtml(perfume.concentracao || 'EDP')}</div>
                <div class="sub">Concentração</div>
              </div>
              <div class="spec">
                <span class="symbol">◷</span>
                <div class="val">PERFUME</div>
                <div class="sub">Fragrância</div>
              </div>
            </div>
          </section>

          <section class="accord-card">
            <h2>Principais acordes</h2>
            <div class="accord-bars">\${accords}</div>
          </section>

          <footer class="notes-panel">
            <section class="notes-col">
              <h3>Família olfativa</h3>
              <div class="family-icon">✿</div>
              <div class="family-name">\${escapeHtml(perfume.familia_olfativa || 'Não informada')}</div>
            </section>
            \${note('topo', 'Notas de topo')}
            \${note('coracao', 'Notas de coração')}
            \${note('fundo', 'Notas de fundo')}
          </footer>

          <small class="foot-brand">SNACK STORE BH • CATÁLOGO DE FRAGRÂNCIAS 25ML</small>
        </article>
      </div>\`;
    }

    document.getElementById('catalogo').innerHTML = PERFUMES.map(renderPage).join('');
  </script>
</body>
</html>`;

  const destHtml = path.resolve('template_pdf/catalogo_completo.html');
  fs.writeFileSync(destHtml, html, 'utf8');
  console.log('✅ catalogo_completo.html atualizado com sucesso!');
}

buildHtml();
