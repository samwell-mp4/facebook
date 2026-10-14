/**
 * SNACK STORE BH - Automação de Cadastro de Catálogo WhatsApp Web
 * Injeta um painel flutuante de controle diretamente na tela do WhatsApp Web.
 */

(async function () {
    // Evita duplicar o painel se já existir
    if (document.getElementById('snack-wa-automation-panel')) {
        document.getElementById('snack-wa-automation-panel').remove();
    }

    const SERVER_URL = 'http://localhost:3500';

    // Utilitários de espera e delay
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function waitForElement(selector, timeoutMs = 12000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(300);
        }
        return null;
    }

    // Função para preencher campos com editor Lexical (WhatsApp Web)
    function setLexicalValue(el, text) {
        if (!el) return false;
        el.focus();
        
        // Seleciona todo o conteúdo anterior
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);

        // Insere o novo texto
        const success = document.execCommand('insertText', false, text);
        
        // Dispara eventos nativos para o reconciliador do React / Lexical
        el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return success;
    }

    // Criar Painel Flutuante na interface
    const panel = document.createElement('div');
    panel.id = 'snack-wa-automation-panel';
    panel.innerHTML = `
      <div class="sw-header">
        <div class="sw-title">
          <span>💎</span>
          <strong>Snack Store BH</strong>
          <span class="sw-badge">Auto-Catálogo</span>
        </div>
        <div class="sw-controls">
          <button id="sw-min-btn" title="Minimizar">_</button>
          <button id="sw-close-btn" title="Fechar">&times;</button>
        </div>
      </div>

      <div class="sw-body" id="sw-body-content">
        <div class="sw-status-bar" id="sw-status">
          <span class="sw-dot online"></span> Conectando ao servidor local...
        </div>

        <div class="sw-options">
          <div class="sw-row">
            <label>Iniciar do item:</label>
            <input type="number" id="sw-start-idx" min="1" value="1" style="width: 65px;">
            <label>Até:</label>
            <input type="number" id="sw-end-idx" min="1" value="52" style="width: 65px;">
          </div>
          <div class="sw-row">
            <label>Intervalo:</label>
            <select id="sw-delay-select">
              <option value="2500">Rápido (2.5s)</option>
              <option value="4000" selected>Recomendado (4.0s)</option>
              <option value="6000">Seguro (6.0s)</option>
            </select>
          </div>
        </div>

        <div class="sw-progress-box">
          <div class="sw-progress-label">
            <span>Progresso</span>
            <strong id="sw-prog-text">0 / 0 (0%)</strong>
          </div>
          <div class="sw-progress-track">
            <div class="sw-progress-bar" id="sw-prog-bar"></div>
          </div>
        </div>

        <div class="sw-actions">
          <button id="sw-btn-start" class="sw-btn primary">▶ Iniciar Cadastro</button>
          <button id="sw-btn-pause" class="sw-btn secondary" disabled>⏸ Pausar</button>
        </div>

        <div class="sw-log-title">Histórico de Execução:</div>
        <div class="sw-log-box" id="sw-logs"></div>
      </div>
    `;

    // Estilos do Painel Flutuante
    const style = document.createElement('style');
    style.id = 'snack-wa-automation-styles';
    style.innerHTML = `
      #snack-wa-automation-panel {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 360px;
        background: #111827;
        color: #f8fafc;
        border: 1px solid #374151;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
        z-index: 9999999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        overflow: hidden;
        transition: all 0.25s ease;
      }
      #snack-wa-automation-panel.minimized .sw-body { display: none; }
      .sw-header {
        background: #1f2937;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #374151;
        cursor: move;
      }
      .sw-title { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; }
      .sw-badge { background: #f59e0b; color: #000; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
      .sw-controls button { background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1; }
      .sw-controls button:hover { color: #fff; }
      .sw-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
      .sw-status-bar { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9ca3af; background: #0f172a; padding: 8px 12px; border-radius: 8px; border: 1px solid #1e293b; }
      .sw-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .sw-dot.online { background: #10b981; box-shadow: 0 0 8px #10b981; }
      .sw-dot.busy { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
      .sw-dot.error { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
      .sw-options { background: #1a2234; border: 1px solid #2e3b52; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
      .sw-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12px; color: #cbd5e1; }
      .sw-row input, .sw-row select { background: #0f172a; border: 1px solid #374151; color: #fff; padding: 5px 8px; border-radius: 6px; outline: none; font-size: 12px; }
      .sw-progress-box { display: flex; flex-direction: column; gap: 4px; }
      .sw-progress-label { display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
      .sw-progress-track { height: 8px; background: #1f2937; border-radius: 4px; overflow: hidden; border: 1px solid #374151; }
      .sw-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #f59e0b, #10b981); transition: width 0.3s ease; }
      .sw-actions { display: flex; gap: 8px; }
      .sw-btn { flex: 1; padding: 9px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; transition: filter 0.2s; }
      .sw-btn:hover { filter: brightness(1.1); }
      .sw-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }
      .sw-btn.primary { background: #f59e0b; color: #000; }
      .sw-btn.secondary { background: #374151; color: #fff; }
      .sw-log-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-top: 2px; }
      .sw-log-box { height: 120px; overflow-y: auto; background: #080d16; border: 1px solid #1f2937; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 11px; color: #93c5fd; display: flex; flex-direction: column; gap: 4px; }
      .sw-log-entry.success { color: #86efac; }
      .sw-log-entry.warn { color: #fde047; }
      .sw-log-entry.error { color: #fca5a5; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // Logs no painel
    const logsEl = document.getElementById('sw-logs');
    function log(msg, type = 'info') {
        const time = new Date().toLocaleTimeString('pt-BR');
        const entry = document.createElement('div');
        entry.className = `sw-log-entry ${type}`;
        entry.textContent = `[${time}] ${msg}`;
        logsEl.appendChild(entry);
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    // Variáveis de controle de execução
    let productsList = [];
    let isRunning = false;
    let isPaused = false;
    let currentIndex = 0;

    // Conectar ao servidor local
    try {
        log('Conectando ao servidor local na porta 3500...');
        const res = await fetch(`${SERVER_URL}/api/produtos`);
        const data = await res.json();
        if (data.success && data.produtos) {
            productsList = data.produtos;
            document.getElementById('sw-status').innerHTML = `<span class="sw-dot online"></span> Conectado: ${productsList.length} produtos carregados`;
            document.getElementById('sw-end-idx').value = productsList.length;
            log(`Pronto! ${productsList.length} perfumes disponíveis para cadastro.`, 'success');
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (e) {
        document.getElementById('sw-status').innerHTML = `<span class="sw-dot error"></span> Servidor Offline (${SERVER_URL})`;
        log('Erro: Certifique-se de que o servidor local está rodando (execute "iniciar_servidor.bat").', 'error');
    }

    // Min / Close handlers
    document.getElementById('sw-min-btn').onclick = () => {
        panel.classList.toggle('minimized');
    };
    document.getElementById('sw-close-btn').onclick = () => {
        if (isRunning && !confirm('O cadastro está em andamento. Deseja realmente fechar o painel?')) return;
        panel.remove();
        style.remove();
    };

    // Controle de execução (Start / Pause)
    const btnStart = document.getElementById('sw-btn-start');
    const btnPause = document.getElementById('sw-btn-pause');

    btnStart.onclick = async () => {
        if (isPaused) {
            isPaused = false;
            btnStart.disabled = true;
            btnPause.disabled = false;
            log('Execução retomada.');
            runAutomationLoop();
            return;
        }

        if (productsList.length === 0) {
            alert('Nenhum produto carregado do servidor local.');
            return;
        }

        const startIdx = parseInt(document.getElementById('sw-start-idx').value) || 1;
        currentIndex = Math.max(0, startIdx - 1);

        isRunning = true;
        isPaused = false;
        btnStart.disabled = true;
        btnPause.disabled = false;
        document.getElementById('sw-status').innerHTML = `<span class="sw-dot busy"></span> Cadastrando produtos...`;
        log(`Iniciando automação a partir do produto #${currentIndex + 1}...`);
        
        runAutomationLoop();
    };

    btnPause.onclick = () => {
        isPaused = true;
        btnStart.disabled = false;
        btnStart.textContent = '▶ Continuar';
        btnPause.disabled = true;
        document.getElementById('sw-status').innerHTML = `<span class="sw-dot online"></span> Pausado pelo usuário`;
        log('Automação pausada.');
    };

    // Loop de cadastro
    async function runAutomationLoop() {
        const endIdx = parseInt(document.getElementById('sw-end-idx').value) || productsList.length;
        const delayBetweenItems = parseInt(document.getElementById('sw-delay-select').value) || 4000;

        while (isRunning && !isPaused && currentIndex < endIdx) {
            const product = productsList[currentIndex];
            const currentDisplayNum = currentIndex + 1;

            // Atualiza barra de progresso
            const pct = Math.round((currentDisplayNum / endIdx) * 100);
            document.getElementById('sw-prog-bar').style.width = `${pct}%`;
            document.getElementById('sw-prog-text').textContent = `${currentDisplayNum} / ${endIdx} (${pct}%)`;

            log(`[${currentDisplayNum}/${endIdx}] Iniciando: ${product.name}...`);

            try {
                await addProductToWhatsApp(product);
                log(`[${currentDisplayNum}/${endIdx}] Cadastrado com sucesso: ${product.sku} ✅`, 'success');
            } catch (err) {
                log(`[${currentDisplayNum}/${endIdx}] Erro ao cadastrar ${product.sku}: ${err.message}`, 'error');
                // Pergunta se deseja tentar novamente ou continuar
                const retry = confirm(`Erro ao cadastrar o produto "${product.name}":\n\n${err.message}\n\nDeseja tentar este produto novamente? (Cancelar para pular para o próximo)`);
                if (retry) {
                    continue; // Tenta o mesmo produto novamente
                }
            }

            currentIndex++;
            if (currentIndex < endIdx && isRunning && !isPaused) {
                log(`Aguardando intervalo de ${delayBetweenItems / 1000}s...`);
                await sleep(delayBetweenItems);
            }
        }

        if (currentIndex >= endIdx) {
            isRunning = false;
            btnStart.disabled = false;
            btnStart.textContent = '▶ Iniciar Cadastro';
            btnPause.disabled = true;
            document.getElementById('sw-status').innerHTML = `<span class="sw-dot online"></span> Finalizado com sucesso!`;
            log('🎉 TODOS OS PRODUTOS FORAM CADASTRADOS NO CATÁLOGO!', 'success');
            alert('🎉 Parabéns! Todos os produtos foram cadastrados com sucesso no seu Catálogo do WhatsApp Business!');
        }
    }

    // Função que cadastra um único produto
    async function addProductToWhatsApp(product) {
        // 1. Clicar no botão "Adicionar item"
        const addBtn = document.querySelector('[data-testid="add-item"] button') 
                    || document.querySelector('[data-testid="add-item"]');
        if (!addBtn) {
            throw new Error('Botão "Adicionar item" não foi encontrado. Abra a tela de Catálogo do WhatsApp primeiro.');
        }
        addBtn.click();
        await sleep(1000);

        // 2. Aguardar o drawer abrir
        const drawer = await waitForElement('[data-testid="drawer-middle"]', 10000);
        if (!drawer) {
            throw new Error('O modal de edição do produto não abriu.');
        }
        await sleep(800);

        // 3. Adicionar as imagens do produto
        if (product.images && product.images.length > 0) {
            log(`Carregando ${product.images.length} fotos do servidor...`);
            const fileList = [];
            for (const imgInfo of product.images) {
                try {
                    const res = await fetch(`${SERVER_URL}/api/imagem?path=${encodeURIComponent(imgInfo.relativePath)}`);
                    if (res.ok) {
                        const blob = await res.blob();
                        const file = new File([blob], imgInfo.fileName, { type: blob.type || 'image/jpeg' });
                        fileList.push(file);
                    }
                } catch (e) {
                    console.warn('Erro ao carregar foto:', imgInfo.fileName, e);
                }
            }

            if (fileList.length > 0) {
                const fileInput = document.querySelector('[data-testid="drawer-middle"] input[type="file"]') 
                               || document.querySelector('input[type="file"][accept*="image"]');
                if (fileInput) {
                    const dataTransfer = new DataTransfer();
                    fileList.forEach(f => dataTransfer.items.add(f));
                    fileInput.files = dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                    // Aguarda o WhatsApp processar as fotos
                    await sleep(2500);
                }
            }
        }

        // 4. Preencher "Nome"
        const nameInput = await waitForElement('[data-testid="product-edit-drawer-name-input"]', 5000);
        if (nameInput) {
            setLexicalValue(nameInput, product.name);
            await sleep(400);
        } else {
            throw new Error('Campo "Nome" não encontrado.');
        }

        // 5. Preencher "Preço" (0 por enquanto conforme solicitado)
        const priceInput = await waitForElement('[data-testid="product-edit-drawer-price-input"]', 5000);
        if (priceInput) {
            setLexicalValue(priceInput, '0');
            await sleep(400);
        }

        // 6. Preencher "Descrição" (apenas notas olfativas e dados importantes)
        const descInput = await waitForElement('[data-testid="product-edit-drawer-description-input"]', 5000);
        if (descInput) {
            setLexicalValue(descInput, product.description);
            await sleep(500);
        }

        // 7. Preencher "Código do item" (SKU)
        const skuInput = document.querySelector('[data-testid="product-edit-drawer-retailer-id-input"]');
        if (skuInput) {
            setLexicalValue(skuInput, product.sku);
            await sleep(400);
        }

        // 8. Selecionar "País de origem" (Brasil)
        const countrySection = document.querySelector('[data-testid="product-edit-drawer-compliance"]')
                            || document.querySelector('[data-testid="product-edit-drawer-compliance-country-of-origin-input"]');
        if (countrySection) {
            const trigger = countrySection.querySelector('[role="textbox"]') 
                         || countrySection.querySelector('div[tabindex="-1"]')
                         || countrySection;
            trigger.click();
            await sleep(1000);

            // Localizar campo de busca no popup
            const popupSearch = Array.from(document.querySelectorAll('input')).find(input => 
                input.placeholder && input.placeholder.toLowerCase().includes('pesquisar')
            );

            if (popupSearch) {
                popupSearch.focus();
                document.execCommand('insertText', false, 'Brasil');
                popupSearch.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(500);
            }

            // Clicar na opção Brasil
            const options = Array.from(document.querySelectorAll('label, div[role="radio"], div[role="button"], span, p'));
            const brasilOption = options.find(el => el.textContent && el.textContent.trim() === 'Brasil');
            if (brasilOption) {
                brasilOption.click();
                await sleep(500);
            }

            // Clicar no botão "Salvar" do popup de país
            const allButtons = Array.from(document.querySelectorAll('button'));
            const salvarBtn = allButtons.find(b => b.textContent && b.textContent.trim().toLowerCase() === 'salvar');
            if (salvarBtn) {
                salvarBtn.click();
                await sleep(800);
            }
        }

        // 9. Clicar no botão "Adicionar ao catálogo"
        await sleep(800);
        const addCatalogBtn = Array.from(document.querySelectorAll('[data-testid="drawer-middle"] button, header button'))
            .find(b => b.textContent && b.textContent.includes('Adicionar ao catálogo'));

        if (!addCatalogBtn) {
            throw new Error('Botão "Adicionar ao catálogo" não encontrado no topo do formulário.');
        }

        // Aguarda botão sair do estado desabilitado (quando validação de campos passa)
        let retries = 15;
        while ((addCatalogBtn.disabled || addCatalogBtn.getAttribute('aria-disabled') === 'true') && retries > 0) {
            await sleep(500);
            retries--;
        }

        addCatalogBtn.click();
        log('Salvando no WhatsApp...');
        await sleep(2000);

        // Aguarda o drawer fechar
        let waitClose = 20;
        while (document.querySelector('[data-testid="drawer-middle"]') && waitClose > 0) {
            await sleep(800);
            waitClose--;
        }

        if (document.querySelector('[data-testid="drawer-middle"]')) {
            throw new Error('O formulário ainda está aberto. Verifique se faltou algum campo obrigatório.');
        }
    }
})();
