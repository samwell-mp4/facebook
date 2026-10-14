const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3500;
const rootDir = path.resolve(__dirname, '..');
const productsFile = path.join(__dirname, 'produtos_whatsapp.json');

// Read products data
function getProducts() {
    if (fs.existsSync(productsFile)) {
        return JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    }
    return [];
}

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.html': 'text/html'
};

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API: Status
    if (pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'online', totalProducts: getProducts().length }));
        return;
    }

    // API: Products
    if (pathname === '/api/produtos') {
        const products = getProducts();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            success: true,
            total: products.length,
            produtos: products
        }));
        return;
    }

    // API: Serve Image
    if (pathname === '/api/imagem') {
        const relativePath = parsedUrl.query.path;
        if (!relativePath) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Caminho da imagem ausente.');
            return;
        }

        const fullPath = path.join(rootDir, relativePath);

        // Security check: ensure path is within rootDir
        if (!fullPath.startsWith(rootDir) || !fs.existsSync(fullPath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Imagem não encontrada.');
            return;
        }

        const ext = path.extname(fullPath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        try {
            const imgBuffer = fs.readFileSync(fullPath);
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': imgBuffer.length,
                'Cache-Control': 'public, max-age=86400'
            });
            res.end(imgBuffer);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erro ao ler a imagem: ' + err.message);
        }
        return;
    }

    // Root UI: Server status & quick injector dashboard
    if (pathname === '/' || pathname === '/index.html') {
        const products = getProducts();
        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Snack Store BH - Servidor de Automação WhatsApp</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 30px; margin: 0; }
    .card { max-width: 800px; margin: 0 auto; background: #131b28; border: 1px solid #222f42; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { color: #f59e0b; margin-top: 0; display: flex; align-items: center; gap: 10px; }
    .badge { background: #10b981; color: #000; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-size: 13px; }
    p { color: #94a3b8; line-height: 1.6; }
    pre { background: #080c14; border: 1px solid #1f2b3e; padding: 14px; border-radius: 8px; color: #38bdf8; overflow-x: auto; font-size: 13px; }
    .step { background: rgba(255,255,255,0.02); border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
    .step strong { color: #fff; }
    .btn { background: #f59e0b; color: #000; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <h1>💎 Servidor de Automação WhatsApp <span class="badge">ONLINE</span></h1>
    <p>O servidor ponte está ativo na porta <strong>${PORT}</strong> e pronto para enviar os <strong>${products.length} produtos</strong> com fotos para o WhatsApp Web.</p>
    
    <h3>📋 Como usar no WhatsApp Web:</h3>
    <div class="step">
      <strong>Opção 1: Script Rápido no Console (F12)</strong><br>
      Abra o <a href="https://web.whatsapp.com" target="_blank" style="color:#38bdf8;">web.whatsapp.com</a>, aperte <code>F12</code> -> <code>Console</code>, copie e cole o código abaixo:
      <pre>fetch('http://localhost:3500/injetor.js').then(r=>r.text()).then(eval);</pre>
    </div>

    <div class="step">
      <strong>Opção 2: Extensão do Chrome (Instalação Permanente)</strong><br>
      Vá em <code>chrome://extensions</code>, ative o <strong>Modo do desenvolvedor</strong>, clique em <strong>Carregar sem compactação</strong> e selecione a pasta:
      <pre>${path.join(__dirname, 'extensao-chrome')}</pre>
    </div>

    <p style="margin-top: 24px; font-size: 13px;">API Endpoint de Produtos: <a href="/api/produtos" target="_blank" style="color:#38bdf8;">/api/produtos</a></p>
  </div>
</body>
</html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    }

    // Serve injector script
    if (pathname === '/injetor.js') {
        const injectorPath = path.join(__dirname, 'injetor_whatsapp.js');
        if (fs.existsSync(injectorPath)) {
            const script = fs.readFileSync(injectorPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            res.end(script);
            return;
        }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Rota não encontrada.');
});

server.listen(PORT, () => {
    console.log(`==================================================================`);
    console.log(`🚀 SERVIDOR DE AUTOMAÇÃO WHATSAPP INICIADO COM SUCESSO!`);
    console.log(`📡 URL Local: http://localhost:${PORT}`);
    console.log(`📦 Produtos Carregados: ${getProducts().length}`);
    console.log(`==================================================================`);
});
