// Content Script v1.3 - Snack Store BH Auto-Catálogo WhatsApp Web
(function () {
    console.log('💎 Snack Store BH Auto-Catálogo v1.3 ativo!');

    const existing = document.getElementById('snack-wa-automation-panel');
    if (existing) existing.remove();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function waitForElement(selector, timeoutMs = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(150);
        }
        return null;
    }

    // Dispara clique completo nativo
    function fullClick(el) {
        if (!el) return;
        try {
            el.scrollIntoView && el.scrollIntoView({ behavior: 'instant', block: 'center' });
            el.focus && el.focus();
            const opts = { bubbles: true, cancelable: true, view: window };
            el.dispatchEvent(new PointerEvent('pointerdown', opts));
            el.dispatchEvent(new MouseEvent('mousedown', opts));
            el.dispatchEvent(new PointerEvent('pointerup', opts));
            el.dispatchEvent(new MouseEvent('mouseup', opts));
            el.dispatchEvent(new MouseEvent('click', opts));
        } catch (e) {
            el.click && el.click();
        }
    }

    // Preenche inputs Lexical com limpeza total prévia (Zero Duplicação)
    function clearAndSetLexicalValue(el, text) {
        if (!el) return false;
        el.focus();
        
        // Se já tiver exatamente o mesmo texto, não mexe
        if (el.innerText && el.innerText.trim() === text.trim()) {
            return true;
        }

        // 1. Limpa completamente qualquer texto existente no editor
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('delete', false, null);

        // 2. Garante seleção limpa
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);

        // 3. Insere o texto limpo
        const success = document.execCommand('insertText', false, text);
        el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return success;
    }

    // Converte DataURL em File de forma rápida
    function dataUrlToFile(dataUrl, fileName, mimeType = 'image/jpeg') {
        let base64String = dataUrl;
        let mime = mimeType;
        if (dataUrl.includes(',')) {
            const parts = dataUrl.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match) mime = match[1];
            base64String = parts[1];
        }
        const bstr = atob(base64String);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], fileName, { type: mime });
    }

    // Carrega um arquivo de imagem da extensão através do Background Worker
    async function loadExtensionFile(relativePath, fileName) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'LOAD_IMAGE',
                path: relativePath,
                fileName: fileName
            }, (res) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                if (!res || !res.success) {
                    return reject(new Error(res ? res.error : 'Falha ao carregar imagem'));
                }
                try {
                    const file = dataUrlToFile(res.dataUrl, fileName, res.mimeType);
                    resolve(file);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    // Cria Painel Flutuante na tela
    const panel = document.createElement('div');
    panel.id = 'snack-wa-automation-panel';
    panel.innerHTML = `
      <div class="sw-header" id="sw-drag-handle">
        <div class="sw-title">
          <span>💎</span>
          <strong>Snack Store BH</strong>
          <span class="sw-badge">Auto-Catálogo v1.3</span>
        </div>
        <div class="sw-controls">
          <button id="sw-min-btn" title="Minimizar">_</button>
          <button id="sw-close-btn" title="Fechar">&times;</button>
        </div>
      </div>

      <div class="sw-body" id="sw-body-content">
        <div class="sw-status-bar" id="sw-status">
          <span class="sw-dot online"></span> Pronto! ${SNACK_WHATSAPP_PRODUCTS.length} produtos carregados
        </div>

        <div class="sw-options">
          <div class="sw-row">
            <label>Iniciar do item:</label>
            <input type="number" id="sw-start-idx" min="1" max="${SNACK_WHATSAPP_PRODUCTS.length}" value="1" style="width: 60px;">
            <label>Até:</label>
            <input type="number" id="sw-end-idx" min="1" max="${SNACK_WHATSAPP_PRODUCTS.length}" value="${SNACK_WHATSAPP_PRODUCTS.length}" style="width: 60px;">
          </div>
          <div class="sw-row">
            <label>Velocidade:</label>
            <select id="sw-delay-select">
              <option value="1500">Ultra Rápido (1.5s)</option>
              <option value="2500" selected>Rápido (2.5s)</option>
              <option value="4000">Moderado (4.0s)</option>
            </select>
          </div>
        </div>

        <div class="sw-progress-box">
          <div class="sw-progress-label">
            <span>Progresso</span>
            <strong id="sw-prog-text">0 / ${SNACK_WHATSAPP_PRODUCTS.length} (0%)</strong>
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

    const style = document.createElement('style');
    style.id = 'snack-wa-automation-styles';
    style.innerHTML = `
      #snack-wa-automation-panel {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 380px;
        background: #111827;
        color: #f8fafc;
        border: 1px solid #374151;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
        z-index: 99999999;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        overflow: hidden;
      }
      #snack-wa-automation-panel.minimized .sw-body { display: none; }
      .sw-header {
        background: #1f2937;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #374151;
        user-select: none;
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
      .sw-btn { flex: 1; padding: 9px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
      .sw-btn:hover { filter: brightness(1.1); }
      .sw-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }
      .sw-btn.primary { background: #f59e0b; color: #000; }
      .sw-btn.secondary { background: #374151; color: #fff; }
      .sw-log-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-top: 2px; }
      .sw-log-box { height: 130px; overflow-y: auto; background: #080d16; border: 1px solid #1f2937; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 11px; color: #93c5fd; display: flex; flex-direction: column; gap: 4px; }
      .sw-log-entry.success { color: #86efac; }
      .sw-log-entry.warn { color: #fde047; }
      .sw-log-entry.error { color: #fca5a5; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    const logsEl = document.getElementById('sw-logs');
    function log(msg, type = 'info') {
        const time = new Date().toLocaleTimeString('pt-BR');
        const entry = document.createElement('div');
        entry.className = `sw-log-entry ${type}`;
        entry.textContent = `[${time}] ${msg}`;
        logsEl.appendChild(entry);
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    log('Painel v1.3 otimizado e ultrarrápido pronto!', 'success');

    // Minimize / Close
    document.getElementById('sw-min-btn').onclick = () => panel.classList.toggle('minimized');
    document.getElementById('sw-close-btn').onclick = () => {
        if (isRunning && !confirm('Automação em andamento. Deseja fechar o painel?')) return;
        panel.remove();
        style.remove();
    };

    let isRunning = false;
    let isPaused = false;
    let currentIndex = 0;

    const btnStart = document.getElementById('sw-btn-start');
    const btnPause = document.getElementById('sw-btn-pause');

    btnStart.onclick = async () => {
        if (isPaused) {
            isPaused = false;
            btnStart.disabled = true;
            btnPause.disabled = false;
            log('Execução retomada.');
            runLoop();
            return;
        }

        const startIdx = parseInt(document.getElementById('sw-start-idx').value) || 1;
        currentIndex = Math.max(0, startIdx - 1);

        isRunning = true;
        isPaused = false;
        btnStart.disabled = true;
        btnPause.disabled = false;
        document.getElementById('sw-status').innerHTML = `<span class="sw-dot busy"></span> Cadastrando produtos...`;
        log(`Iniciando a partir do produto #${currentIndex + 1}...`);
        runLoop();
    };

    btnPause.onclick = () => {
        isPaused = true;
        btnStart.disabled = false;
        btnStart.textContent = '▶ Continuar';
        btnPause.disabled = true;
        document.getElementById('sw-status').innerHTML = `<span class="sw-dot online"></span> Pausado pelo usuário`;
        log('Automação pausada.');
    };

    async function runLoop() {
        const endIdx = parseInt(document.getElementById('sw-end-idx').value) || SNACK_WHATSAPP_PRODUCTS.length;
        const delayBetweenItems = parseInt(document.getElementById('sw-delay-select').value) || 2500;

        while (isRunning && !isPaused && currentIndex < endIdx) {
            const product = SNACK_WHATSAPP_PRODUCTS[currentIndex];
            const currentDisplayNum = currentIndex + 1;

            const pct = Math.round((currentDisplayNum / endIdx) * 100);
            document.getElementById('sw-prog-bar').style.width = `${pct}%`;
            document.getElementById('sw-prog-text').textContent = `${currentDisplayNum} / ${endIdx} (${pct}%)`;

            log(`[${currentDisplayNum}/${endIdx}] Cadastrando: ${product.name}...`);

            try {
                await addProduct(product);
                log(`[${currentDisplayNum}/${endIdx}] ${product.sku} indexado com sucesso! ✅`, 'success');
            } catch (err) {
                log(`[${currentDisplayNum}/${endIdx}] Erro em ${product.sku}: ${err.message}`, 'error');
                // Se der erro, aguarda 2s e avança para o próximo sem bloquear com popup
                await sleep(2000);
            }

            currentIndex++;
            if (currentIndex < endIdx && isRunning && !isPaused) {
                log(`Aguardando ${delayBetweenItems / 1000}s para próximo item...`);
                await sleep(delayBetweenItems);
            }
        }

        if (currentIndex >= endIdx) {
            isRunning = false;
            btnStart.disabled = false;
            btnStart.textContent = '▶ Iniciar Cadastro';
            btnPause.disabled = true;
            document.getElementById('sw-status').innerHTML = `<span class="sw-dot online"></span> Todos os itens cadastrados!`;
            log('🎉 TODOS OS PRODUTOS FORAM CADASTRADOS NO CATÁLOGO!', 'success');
            alert('🎉 Parabéns! Todos os produtos foram cadastrados com sucesso no seu Catálogo do WhatsApp Business!');
        }
    }

    async function addProduct(product) {
        // Se a tela de detalhes de produto anterior estiver aberta, fecha clicando no X
        const closeDetailBtn = document.querySelector('[data-testid="drawer-middle"] header button, header button[aria-label="Fechar"]');
        if (closeDetailBtn && document.querySelector('[data-testid="catalog-item-edit-btn"], button[aria-label="Editar"]')) {
            fullClick(closeDetailBtn);
            await sleep(400);
        }

        // 1. Clicar no botão "Adicionar item"
        const addBtn = document.querySelector('[data-testid="add-item"] button') 
                    || document.querySelector('[data-testid="add-item"]');
        if (!addBtn) {
            throw new Error('Botão "Adicionar item" não encontrado na tela. Abra a aba Catálogo do WhatsApp.');
        }
        fullClick(addBtn);
        await sleep(600);

        // 2. Aguarda drawer abrir
        const nameInput = await waitForElement('[data-testid="product-edit-drawer-name-input"]', 8000);
        if (!nameInput) {
            throw new Error('O formulário de edição do produto não abriu.');
        }
        await sleep(300);

        // 3. Adicionar as imagens do produto (Carregamento paralelo super rápido)
        if (product.images && product.images.length > 0) {
            log(`Carregando ${product.images.length} fotos em paralelo...`);
            
            const filePromises = product.images.map(img => 
                loadExtensionFile(img.relativePath, img.fileName).catch(err => null)
            );
            const loadedFiles = await Promise.all(filePromises);
            const fileList = loadedFiles.filter(Boolean);

            if (fileList.length > 0) {
                const fileInput = document.querySelector('[data-testid="drawer-middle"] input[type="file"]') 
                               || document.querySelector('input[type="file"][accept*="image"]')
                               || document.querySelector('input[type="file"]');

                if (fileInput) {
                    const dataTransfer = new DataTransfer();
                    fileList.forEach(f => dataTransfer.items.add(f));
                    fileInput.files = dataTransfer.files;

                    fileInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    fileInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

                    const dropTargets = [
                        document.querySelector('[data-testid="add-image"]'),
                        fileInput.parentElement,
                        document.querySelector('[data-testid="drawer-middle"]')
                    ].filter(Boolean);

                    dropTargets.forEach(target => {
                        try {
                            target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
                            target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
                        } catch (err) {}
                    });

                    log(`✓ ${fileList.length} fotos anexadas com sucesso!`);
                    await sleep(1800); // Aguarda o WhatsApp gerar miniaturas
                }
            }
        }

        // 4. Preencher "Nome" (limpeza total prévia para evitar qualquer duplicação)
        clearAndSetLexicalValue(nameInput, product.name);
        await sleep(250);

        // 5. Preencher "Preço" como 0
        const priceInput = document.querySelector('[data-testid="product-edit-drawer-price-input"]');
        if (priceInput) {
            clearAndSetLexicalValue(priceInput, '0');
            await sleep(250);
        }

        // 6. Preencher "Descrição" (apenas pirâmide e notas, com limpeza total prévia)
        const descInput = document.querySelector('[data-testid="product-edit-drawer-description-input"]');
        if (descInput) {
            clearAndSetLexicalValue(descInput, product.description);
            await sleep(300);
        }

        // 7. Preencher "Código do item" (SKU)
        const skuInput = document.querySelector('[data-testid="product-edit-drawer-retailer-id-input"]');
        if (skuInput) {
            clearAndSetLexicalValue(skuInput, product.sku);
            await sleep(250);
        }

        // 8. Selecionar "País de origem" (Brasil)
        let complianceSection = document.querySelector('[data-testid="product-edit-drawer-compliance"]');
        if (!complianceSection) {
            complianceSection = Array.from(document.querySelectorAll('span, div')).find(el => 
                el.textContent && el.textContent.includes('País de origem')
            )?.closest('[tabindex="-1"], div');
        }

        if (complianceSection) {
            // Se já tem "Brasil" escrito, pula o modal e ganha tempo!
            const alreadyHasBrasil = complianceSection.innerText && complianceSection.innerText.includes('Brasil');

            if (!alreadyHasBrasil) {
                complianceSection.scrollIntoView({ behavior: 'instant', block: 'center' });
                await sleep(300);

                const countryInput = complianceSection.querySelector('[data-testid="product-edit-drawer-compliance-country-of-origin-input"]')
                                  || complianceSection.querySelector('[role="textbox"]')
                                  || complianceSection;

                fullClick(countryInput);
                await sleep(200);
                fullClick(complianceSection);
                await sleep(400);

                // Aguarda modal aparecer
                let modalAppeared = false;
                for (let wait = 0; wait < 8; wait++) {
                    const searchInput = Array.from(document.querySelectorAll('input')).find(i => 
                        i.placeholder && i.placeholder.toLowerCase().includes('pesquisar') && i.offsetWidth > 0
                    );
                    const salvarBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(b => 
                        b.textContent && b.textContent.trim().toLowerCase() === 'salvar' && b.offsetWidth > 0 && !b.closest('[data-testid="drawer-middle"]')
                    );

                    if (searchInput || salvarBtn) {
                        modalAppeared = true;
                        break;
                    }
                    fullClick(countryInput);
                    await sleep(250);
                }

                if (modalAppeared) {
                    // Seleciona Brasil
                    const allOptions = Array.from(document.querySelectorAll('*')).filter(el => {
                        if (el.closest('[data-testid="drawer-middle"]')) return false;
                        return el.children.length === 0 && el.textContent && el.textContent.trim() === 'Brasil';
                    });

                    if (allOptions.length > 0) {
                        const targetOption = allOptions[0].closest('label, div[role="radio"], div[role="button"], li') || allOptions[0];
                        fullClick(targetOption);
                        await sleep(250);
                    }

                    // Salva no modal
                    const salvarBtn = Array.from(document.querySelectorAll('button, div[role="button"], span, div')).find(el => {
                        return el.textContent && el.textContent.trim().toLowerCase() === 'salvar' && el.offsetWidth > 0 && !el.closest('[data-testid="drawer-middle"]');
                    });

                    if (salvarBtn) {
                        fullClick(salvarBtn);
                        await sleep(500);
                    }
                } else {
                    const countryInput = complianceSection.querySelector('[data-testid="product-edit-drawer-compliance-country-of-origin-input"]');
                    if (countryInput) {
                        clearAndSetLexicalValue(countryInput, 'Brasil');
                        await sleep(250);
                    }
                }
            }
        }

        // 9. Clicar no botão "Adicionar ao catálogo"
        const drawer = document.querySelector('[data-testid="drawer-middle"]') || document.body;
        drawer.scrollTop = 0;
        await sleep(300);

        const addCatalogBtn = Array.from(document.querySelectorAll('[data-testid="drawer-middle"] button, header button'))
            .find(b => b.textContent && b.textContent.includes('Adicionar ao catálogo'));

        if (!addCatalogBtn) {
            throw new Error('Botão "Adicionar ao catálogo" não encontrado.');
        }

        // Aguarda validação do WhatsApp habilitar o botão
        let retries = 10;
        while ((addCatalogBtn.disabled || addCatalogBtn.getAttribute('aria-disabled') === 'true') && retries > 0) {
            await sleep(300);
            retries--;
        }

        if (addCatalogBtn.disabled || addCatalogBtn.getAttribute('aria-disabled') === 'true') {
            addCatalogBtn.disabled = false;
            addCatalogBtn.setAttribute('aria-disabled', 'false');
        }

        fullClick(addCatalogBtn);
        log('Salvando produto no catálogo...');

        // 10. Aguarda indexação (detecção instantânea de sucesso)
        // O WhatsApp ou fecha o formulário de edição OU muda para a tela de visualização do produto com "Esse item está em análise"
        let isSaved = false;
        for (let waitSave = 0; waitSave < 20; waitSave++) {
            await sleep(400);

            const isFormGone = !document.querySelector('[data-testid="product-edit-drawer-name-input"]');
            const isUnderReview = document.body.innerText.includes('Esse item está em análise') || document.body.innerText.includes('está em análise');
            const hasEditButton = Array.from(document.querySelectorAll('button')).some(b => b.textContent && b.textContent.trim().toLowerCase() === 'editar');

            if (isFormGone || isUnderReview || hasEditButton) {
                isSaved = true;
                break;
            }
        }

        if (!isSaved) {
            log('Aviso: Aguardando confirmação do WhatsApp...', 'warn');
            await sleep(1500);
        }

        // Fecha tela de detalhes se estiver aberta para deixar pronto para o próximo
        const closeBtn = document.querySelector('[data-testid="drawer-middle"] header button, header button[aria-label="Fechar"]');
        if (closeBtn && (document.body.innerText.includes('está em análise') || !document.querySelector('[data-testid="product-edit-drawer-name-input"]'))) {
            fullClick(closeBtn);
            await sleep(400);
        }
    }
})();
