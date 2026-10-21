import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query, testConnection, getDbStatus } from './db.js';
import { initializeDatabase } from './initDb.js';
import { CATALOG_DATA } from '../src/data/catalogData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 80;

// ==============================================================================
// MIDDLEWARES ESSENCIAIS
// ==============================================================================
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging básico para produção
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

// ==============================================================================
// ROTAS DE STATUS E SAÚDE DO SISTEMA
// ==============================================================================
app.get('/api/health', async (req, res) => {
  const dbHealth = await testConnection();
  let counts = null;

  if (dbHealth.connected) {
    try {
      const [fCount, pCount, ordCount, dCount, cCount] = await Promise.all([
        query('SELECT COUNT(*) FROM tb_fornecedores').then((r) => r.rows[0].count),
        query('SELECT COUNT(*) FROM tb_produtos').then((r) => r.rows[0].count),
        query('SELECT COUNT(*) FROM tb_pedidos').then((r) => r.rows[0].count),
        query('SELECT COUNT(*) FROM tb_despesas').then((r) => r.rows[0].count),
        query('SELECT COUNT(*) FROM tb_compras_estoque').then((r) => r.rows[0].count)
      ]);
      counts = {
        fornecedores: parseInt(fCount, 10),
        produtos: parseInt(pCount, 10),
        pedidos: parseInt(ordCount, 10),
        despesas: parseInt(dCount, 10),
        compras: parseInt(cCount, 10)
      };
    } catch (e) {
      console.error('Erro ao ler contadores:', e.message);
    }
  }

  res.json({
    status: 'online',
    app: 'Snack Store BH - API & Catálogo Nuvem',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    counts
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    dbStatus: getDbStatus()
  });
});

// ==============================================================================
// ROTAS: PRODUTOS (tb_produtos)
// ==============================================================================
function formatProductFromDb(row) {
  return {
    sku: row.sku,
    itemNum: row.item_num,
    cod: row.cod,
    name: row.name,
    cleanName: row.clean_name,
    collectionName: row.collection_name,
    isArabic: Boolean(row.is_arabic),
    gender: row.gender,
    genderWord: row.gender_word,
    ref: row.ref_olfativa,
    familia: row.familia_olfativa,
    saida: row.notas_saida,
    corpo: row.notas_corpo,
    fundo: row.notas_fundo,
    dirName: row.dir_name,
    coverImage: row.cover_image,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
    imageCount: row.image_count,
    titleShort: row.title_short,
    titleLong: row.title_long,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
    tagsString: row.tags_string,
    fullDescription: row.full_description,
    precoCompra: Number(row.preco_compra || 0),
    precoAtacado: Number(row.preco_atacado || 0),
    precoVarejo: Number(row.preco_varejo || 0),
    qtdEstoque: Number(row.qtd_estoque || 0),
    estoqueProprio: Number(row.estoque_proprio || 0),
    fornecedores: typeof row.fornecedores === 'string' ? JSON.parse(row.fornecedores) : (row.fornecedores || []),
    lucroAtacado: Number(row.lucro_atacado || 0),
    margemAtacado: Number(row.margem_atacado || 0),
    lucroVarejo: Number(row.lucro_varejo || 0),
    margemVarejo: Number(row.margem_varejo || 0),
    lucroRevendedor: Number(row.lucro_revendedor || 0),
    margemRevendedor: Number(row.margem_revendedor || 0),
    ativo: Boolean(row.ativo)
  };
}

// Listar todos os produtos
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tb_produtos WHERE ativo = true ORDER BY is_arabic DESC, sku ASC');
    const products = result.rows.map(formatProductFromDb);
    res.json(products);
  } catch (err) {
    console.error('Erro em GET /api/products:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos no PostgreSQL', details: err.message });
  }
});

// Criar ou atualizar produto (UPSERT)
app.post('/api/products', async (req, res) => {
  try {
    const p = req.body;
    if (!p.sku) return res.status(400).json({ error: 'SKU é obrigatório' });

    const sql = `
      INSERT INTO tb_produtos (
        sku, item_num, cod, name, clean_name, collection_name, is_arabic,
        gender, gender_word, ref_olfativa, familia_olfativa, notas_saida, notas_corpo, notas_fundo,
        dir_name, cover_image, images, image_count, title_short, title_long,
        tags, tags_string, full_description, preco_compra, preco_atacado, preco_varejo,
        qtd_estoque, estoque_proprio, fornecedores, lucro_atacado, margem_atacado,
        lucro_varejo, margem_varejo, lucro_revendedor, margem_revendedor, ativo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36
      )
      ON CONFLICT (sku) DO UPDATE SET
        item_num = EXCLUDED.item_num,
        cod = EXCLUDED.cod,
        name = EXCLUDED.name,
        clean_name = EXCLUDED.clean_name,
        collection_name = EXCLUDED.collection_name,
        is_arabic = EXCLUDED.is_arabic,
        gender = EXCLUDED.gender,
        gender_word = EXCLUDED.gender_word,
        ref_olfativa = EXCLUDED.ref_olfativa,
        familia_olfativa = EXCLUDED.familia_olfativa,
        notas_saida = EXCLUDED.notas_saida,
        notas_corpo = EXCLUDED.notas_corpo,
        notas_fundo = EXCLUDED.notas_fundo,
        dir_name = COALESCE(NULLIF(EXCLUDED.dir_name, ''), tb_produtos.dir_name),
        cover_image = COALESCE(NULLIF(EXCLUDED.cover_image, ''), tb_produtos.cover_image),
        images = CASE WHEN EXCLUDED.images = '[]'::jsonb THEN tb_produtos.images ELSE EXCLUDED.images END,
        title_short = EXCLUDED.title_short,
        title_long = EXCLUDED.title_long,
        tags = EXCLUDED.tags,
        tags_string = EXCLUDED.tags_string,
        full_description = EXCLUDED.full_description,
        preco_compra = EXCLUDED.preco_compra,
        preco_atacado = EXCLUDED.preco_atacado,
        preco_varejo = EXCLUDED.preco_varejo,
        qtd_estoque = EXCLUDED.qtd_estoque,
        estoque_proprio = EXCLUDED.estoque_proprio,
        fornecedores = EXCLUDED.fornecedores,
        lucro_atacado = EXCLUDED.lucro_atacado,
        margem_atacado = EXCLUDED.margem_atacado,
        lucro_varejo = EXCLUDED.lucro_varejo,
        margem_varejo = EXCLUDED.margem_varejo,
        lucro_revendedor = EXCLUDED.lucro_revendedor,
        margem_revendedor = EXCLUDED.margem_revendedor,
        ativo = EXCLUDED.ativo,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      p.sku,
      p.itemNum || '',
      p.cod || '',
      p.name || '',
      p.cleanName || p.name || '',
      p.collectionName || '',
      Boolean(p.isArabic),
      p.gender || '',
      p.genderWord || '',
      p.ref || '',
      p.familia || '',
      p.saida || '',
      p.corpo || '',
      p.fundo || '',
      p.dirName || '',
      p.coverImage || '',
      JSON.stringify(p.images || []),
      p.imageCount || (p.images ? p.images.length : 0),
      p.titleShort || '',
      p.titleLong || '',
      JSON.stringify(p.tags || []),
      p.tagsString || '',
      p.fullDescription || '',
      p.precoCompra || 0,
      p.precoAtacado || 0,
      p.precoVarejo || 0,
      p.qtdEstoque !== undefined ? p.qtdEstoque : 1,
      p.estoqueProprio !== undefined ? p.estoqueProprio : (p.qtdEstoque || 1),
      JSON.stringify(p.fornecedores || []),
      p.lucroAtacado || 0,
      p.margemAtacado || 0,
      p.lucroVarejo || 0,
      p.margemVarejo || 0,
      p.lucroRevendedor || 0,
      p.margemRevendedor || 0,
      p.ativo !== undefined ? Boolean(p.ativo) : true
    ];

    const result = await query(sql, values);
    res.json({ success: true, product: formatProductFromDb(result.rows[0]) });
  } catch (err) {
    console.error('Erro em POST /api/products:', err);
    res.status(500).json({ error: 'Erro ao salvar produto no PostgreSQL', details: err.message });
  }
});

// Atualizar produto por SKU
app.put('/api/products/:sku', async (req, res) => {
  try {
    const sku = req.params.sku;
    const p = { ...req.body, sku };
    // Redireciona para o upsert
    req.body.sku = sku;
    const updateRes = await query('SELECT sku FROM tb_produtos WHERE sku = $1', [sku]);
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    // Reutiliza POST para atualização consistente
    const postReq = { body: p };
    const fakeRes = {
      json: (data) => res.json(data),
      status: (code) => res.status(code)
    };
    // Executa query de update direta
    const sql = `
      UPDATE tb_produtos SET
        name = COALESCE($2, name),
        clean_name = COALESCE($3, clean_name),
        preco_compra = COALESCE($4, preco_compra),
        preco_atacado = COALESCE($5, preco_atacado),
        preco_varejo = COALESCE($6, preco_varejo),
        qtd_estoque = COALESCE($7, qtd_estoque),
        estoque_proprio = COALESCE($8, estoque_proprio),
        fornecedores = COALESCE($9::jsonb, fornecedores),
        lucro_atacado = COALESCE($10, lucro_atacado),
        margem_atacado = COALESCE($11, margem_atacado),
        lucro_varejo = COALESCE($12, lucro_varejo),
        margem_varejo = COALESCE($13, margem_varejo),
        updated_at = NOW()
      WHERE sku = $1
      RETURNING *;
    `;
    const result = await query(sql, [
      sku,
      p.name,
      p.cleanName,
      p.precoCompra,
      p.precoAtacado,
      p.precoVarejo,
      p.qtdEstoque,
      p.estoqueProprio,
      p.fornecedores ? JSON.stringify(p.fornecedores) : null,
      p.lucroAtacado,
      p.margemAtacado,
      p.lucroVarejo,
      p.margemVarejo
    ]);
    res.json({ success: true, product: formatProductFromDb(result.rows[0]) });
  } catch (err) {
    console.error('Erro em PUT /api/products/:sku:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reajuste em lote de produtos
app.post('/api/products/batch', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Array de produtos inválido' });
    }

    for (const p of products) {
      await query(
        `UPDATE tb_produtos SET
          preco_compra = $2,
          preco_atacado = $3,
          preco_varejo = $4,
          lucro_atacado = $5,
          margem_atacado = $6,
          lucro_varejo = $7,
          margem_varejo = $8,
          lucro_revendedor = $9,
          margem_revendedor = $10,
          updated_at = NOW()
        WHERE sku = $1`,
        [
          p.sku,
          p.precoCompra || 0,
          p.precoAtacado || 0,
          p.precoVarejo || 0,
          p.lucroAtacado || 0,
          p.margemAtacado || 0,
          p.lucroVarejo || 0,
          p.margemVarejo || 0,
          p.lucroRevendedor || 0,
          p.margemRevendedor || 0
        ]
      );
    }

    const updated = await query('SELECT * FROM tb_produtos WHERE ativo = true ORDER BY is_arabic DESC, sku ASC');
    res.json({ success: true, totalUpdated: products.length, products: updated.rows.map(formatProductFromDb) });
  } catch (err) {
    console.error('Erro em POST /api/products/batch:', err);
    res.status(500).json({ error: err.message });
  }
});

// Restaurar produtos padrão
app.post('/api/products/reset', async (req, res) => {
  try {
    await query('DELETE FROM tb_produtos');
    for (const prod of CATALOG_DATA) {
      await query(
        `INSERT INTO tb_produtos (
          sku, item_num, cod, name, clean_name, collection_name, is_arabic,
          gender, gender_word, ref_olfativa, familia_olfativa, notas_saida, notas_corpo, notas_fundo,
          dir_name, cover_image, images, image_count, title_short, title_long,
          tags, tags_string, full_description, preco_compra, preco_atacado, preco_varejo,
          qtd_estoque, estoque_proprio, fornecedores, lucro_atacado, margem_atacado,
          lucro_varejo, margem_varejo, lucro_revendedor, margem_revendedor, ativo
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31,
          $32, $33, $34, $35, $36
        )`,
        [
          prod.sku,
          prod.itemNum || '',
          prod.cod || '',
          prod.name || '',
          prod.cleanName || prod.name || '',
          prod.collectionName || '',
          Boolean(prod.isArabic),
          prod.gender || '',
          prod.genderWord || '',
          prod.ref || '',
          prod.familia || '',
          prod.saida || '',
          prod.corpo || '',
          prod.fundo || '',
          prod.dirName || '',
          prod.coverImage || '',
          JSON.stringify(prod.images || []),
          prod.imageCount || (prod.images ? prod.images.length : 0),
          prod.titleShort || '',
          prod.titleLong || '',
          JSON.stringify(prod.tags || []),
          prod.tagsString || '',
          prod.fullDescription || '',
          prod.precoCompra || 0,
          prod.precoAtacado || 0,
          prod.precoVarejo || 0,
          prod.qtdEstoque !== undefined ? prod.qtdEstoque : 1,
          prod.estoqueProprio !== undefined ? prod.estoqueProprio : (prod.qtdEstoque || 1),
          JSON.stringify(prod.fornecedores || []),
          prod.lucroAtacado || 0,
          prod.margemAtacado || 0,
          prod.lucroVarejo || 0,
          prod.margemVarejo || 0,
          prod.lucroRevendedor || 0,
          prod.margemRevendedor || 0,
          true
        ]
      );
    }
    const fresh = await query('SELECT * FROM tb_produtos WHERE ativo = true ORDER BY is_arabic DESC, sku ASC');
    res.json({ success: true, products: fresh.rows.map(formatProductFromDb) });
  } catch (err) {
    console.error('Erro em POST /api/products/reset:', err);
    res.status(500).json({ error: err.message });
  }
});

// Deletar produto
app.delete('/api/products/:sku', async (req, res) => {
  try {
    const sku = req.params.sku;
    await query('DELETE FROM tb_produtos WHERE sku = $1', [sku]);
    res.json({ success: true, message: `Produto ${sku} excluído com sucesso` });
  } catch (err) {
    console.error('Erro em DELETE /api/products/:sku:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// ROTAS: PEDIDOS & DESPACHOS (tb_pedidos)
// ==============================================================================
function formatOrderFromDb(row) {
  return {
    id: row.id,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    dataPedido: row.data_pedido ? row.data_pedido.toString().slice(0, 10) : '',
    dataVencimento: row.data_vencimento ? row.data_vencimento.toString().slice(0, 10) : '',
    status: row.status,
    cliente: typeof row.cliente === 'string' ? JSON.parse(row.cliente) : (row.cliente || {}),
    itens: typeof row.itens === 'string' ? JSON.parse(row.itens) : (row.itens || []),
    originalItems: typeof row.original_items === 'string' ? JSON.parse(row.original_items) : (row.original_items || []),
    returnedItems: typeof row.returned_items === 'string' ? JSON.parse(row.returned_items) : (row.returned_items || []),
    totais: typeof row.totais === 'string' ? JSON.parse(row.totais) : (row.totais || {}),
    totalCobrar: Number(row.total_cobrar || 0),
    totalPago: Number(row.total_pago || 0),
    valorEmAberto: Number(row.valor_em_aberto || 0),
    formaPagamento: row.forma_pagamento,
    paymentSplits: typeof row.payment_splits === 'string' ? JSON.parse(row.payment_splits) : (row.payment_splits || {}),
    financeiro: typeof row.financeiro === 'string' ? JSON.parse(row.financeiro) : (row.financeiro || {}),
    observacoes: row.observacoes,
    historicoStatus: typeof row.historico_status === 'string' ? JSON.parse(row.historico_status) : (row.historico_status || [])
  };
}

// Listar todos os pedidos
app.get('/api/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tb_pedidos ORDER BY created_at DESC');
    res.json(result.rows.map(formatOrderFromDb));
  } catch (err) {
    console.error('Erro em GET /api/orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// Criar ou atualizar pedido (UPSERT)
app.post('/api/orders', async (req, res) => {
  try {
    const o = req.body;
    if (!o.id) return res.status(400).json({ error: 'ID do pedido é obrigatório' });

    const totalCobrar = Number(o.totalCobrar ?? o.totais?.valorTotal ?? 0);
    const totalPago = Number(o.totalPago ?? o.financeiro?.valorRecebido ?? 0);
    const valorEmAberto = Number(o.valorEmAberto ?? Math.max(0, totalCobrar - totalPago));

    const sql = `
      INSERT INTO tb_pedidos (
        id, data_pedido, data_vencimento, status, cliente, itens,
        original_items, returned_items, totais, total_cobrar, total_pago,
        valor_em_aberto, forma_pagamento, payment_splits, financeiro,
        observacoes, historico_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        data_pedido = EXCLUDED.data_pedido,
        data_vencimento = EXCLUDED.data_vencimento,
        status = EXCLUDED.status,
        cliente = EXCLUDED.cliente,
        itens = EXCLUDED.itens,
        original_items = EXCLUDED.original_items,
        returned_items = EXCLUDED.returned_items,
        totais = EXCLUDED.totais,
        total_cobrar = EXCLUDED.total_cobrar,
        total_pago = EXCLUDED.total_pago,
        valor_em_aberto = EXCLUDED.valor_em_aberto,
        forma_pagamento = EXCLUDED.forma_pagamento,
        payment_splits = EXCLUDED.payment_splits,
        financeiro = EXCLUDED.financeiro,
        observacoes = EXCLUDED.observacoes,
        historico_status = EXCLUDED.historico_status,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      o.id,
      o.dataPedido || (o.createdAt ? o.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      o.dataVencimento || null,
      o.status || 'pendente',
      JSON.stringify(o.cliente || {}),
      JSON.stringify(o.itens || []),
      JSON.stringify(o.originalItems || []),
      JSON.stringify(o.returnedItems || []),
      JSON.stringify(o.totais || {}),
      totalCobrar,
      totalPago,
      valorEmAberto,
      o.formaPagamento || 'pix',
      JSON.stringify(o.paymentSplits || {}),
      JSON.stringify(o.financeiro || {}),
      o.observacoes || '',
      JSON.stringify(o.historicoStatus || []),
      o.createdAt ? new Date(o.createdAt) : new Date()
    ];

    const result = await query(sql, values);

    // Deduz estoque físico se for pedido com itens de estoque próprio
    if (Array.isArray(o.itens)) {
      for (const it of o.itens) {
        if (it.sku && it.isEstoqueProprio !== false) {
          const qty = Number(it.qtd || it.qty || 1);
          await query(
            `UPDATE tb_produtos SET
              estoque_proprio = GREATEST(0, estoque_proprio - $2),
              qtd_estoque = GREATEST(0, qtd_estoque - $2),
              updated_at = NOW()
             WHERE sku = $1`,
            [it.sku, qty]
          );
        }
      }
    }

    res.json({ success: true, order: formatOrderFromDb(result.rows[0]) });
  } catch (err) {
    console.error('Erro em POST /api/orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar status de pedido
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const currentOrderRes = await query('SELECT * FROM tb_pedidos WHERE id = $1', [id]);
    if (currentOrderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const current = currentOrderRes.rows[0];
    const historico = typeof current.historico_status === 'string'
      ? JSON.parse(current.historico_status)
      : (current.historico_status || []);

    historico.push({
      status,
      data: new Date().toISOString(),
      nota: `Status alterado para ${status.toUpperCase()}`
    });

    const isFinalizado = status === 'concluido';
    const financeiro = typeof current.financeiro === 'string'
      ? JSON.parse(current.financeiro)
      : (current.financeiro || {});

    const valorAberto = Number(current.valor_em_aberto || 0);
    if (isFinalizado && valorAberto === 0) {
      financeiro.statusPagamento = 'pago';
      financeiro.pagoEm = financeiro.pagoEm || new Date().toISOString();
    }

    const updateRes = await query(
      `UPDATE tb_pedidos SET
        status = $2,
        historico_status = $3,
        financeiro = $4,
        updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id, status, JSON.stringify(historico), JSON.stringify(financeiro)]
    );

    res.json({ success: true, order: formatOrderFromDb(updateRes.rows[0]) });
  } catch (err) {
    console.error('Erro em PUT /api/orders/:id/status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle pagamento
app.put('/api/orders/:id/toggle-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrderRes = await query('SELECT * FROM tb_pedidos WHERE id = $1', [id]);
    if (currentOrderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    const current = currentOrderRes.rows[0];
    const financeiro = typeof current.financeiro === 'string'
      ? JSON.parse(current.financeiro)
      : (current.financeiro || {});

    const isPago = financeiro.statusPagamento === 'pago';
    const nextPago = !isPago;
    financeiro.statusPagamento = nextPago ? 'pago' : 'pendente';
    financeiro.pagoEm = nextPago ? new Date().toISOString() : null;

    const totalCobrar = Number(current.total_cobrar || 0);
    const totalPago = nextPago ? totalCobrar : 0;
    const valorEmAberto = nextPago ? 0 : totalCobrar;

    const updateRes = await query(
      `UPDATE tb_pedidos SET
        financeiro = $2,
        total_pago = $3,
        valor_em_aberto = $4,
        updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id, JSON.stringify(financeiro), totalPago, valorEmAberto]
    );

    res.json({ success: true, order: formatOrderFromDb(updateRes.rows[0]) });
  } catch (err) {
    console.error('Erro em toggle-payment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Acerto / Consignação
app.post('/api/orders/:id/acerto', async (req, res) => {
  try {
    const { id } = req.params;
    const acertoData = req.body;

    const currentOrderRes = await query('SELECT * FROM tb_pedidos WHERE id = $1', [id]);
    if (currentOrderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const {
      finalize,
      baseItems,
      remainingItems,
      returnedItems,
      totalCobrar,
      totalPago,
      valorEmAberto,
      totalCusto,
      paymentSplits,
      observacao
    } = acertoData;

    const safeCobrar = Math.max(0, Math.round(Number(totalCobrar || 0) * 100) / 100);
    const safePago = Math.max(0, Math.round(Number(totalPago || 0) * 100) / 100);
    const safeAberto = Math.max(0, Math.round((safeCobrar - safePago) * 100) / 100);

    const updateRes = await query(
      `UPDATE tb_pedidos SET
        status = $2,
        original_items = $3,
        itens = $4,
        returned_items = $5,
        total_cobrar = $6,
        total_pago = $7,
        valor_em_aberto = $8,
        payment_splits = $9,
        updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [
        id,
        finalize ? 'concluido' : 'acerto',
        JSON.stringify(baseItems || []),
        JSON.stringify(remainingItems || []),
        JSON.stringify(returnedItems || []),
        safeCobrar,
        safePago,
        safeAberto,
        JSON.stringify(paymentSplits || {})
      ]
    );

    // Salva histórico na tb_acertos_historico
    await query(
      `INSERT INTO tb_acertos_historico (
        pedido_id, total_cobrado, total_pago, saldo_devedor, itens_vendidos, itens_devolvidos, observacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        safeCobrar,
        safePago,
        safeAberto,
        JSON.stringify(remainingItems || []),
        JSON.stringify(returnedItems || []),
        observacao || 'Acerto de consignação processado'
      ]
    );

    // Devolve estoque dos itens retornados
    if (Array.isArray(returnedItems)) {
      for (const item of returnedItems) {
        const qtyReturned = Number(item.devolvido || item.qtdDevolvida || 0);
        if (item.sku && qtyReturned > 0) {
          await query(
            `UPDATE tb_produtos SET
              estoque_proprio = estoque_proprio + $2,
              qtd_estoque = qtd_estoque + $2,
              updated_at = NOW()
             WHERE sku = $1`,
            [item.sku, qtyReturned]
          );
        }
      }
    }

    res.json({ success: true, order: formatOrderFromDb(updateRes.rows[0]) });
  } catch (err) {
    console.error('Erro em acerto:', err);
    res.status(500).json({ error: err.message });
  }
});

// Deletar pedido
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tb_pedidos WHERE id = $1', [id]);
    res.json({ success: true, message: `Pedido ${id} removido` });
  } catch (err) {
    console.error('Erro em DELETE /api/orders/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// ROTAS: FORNECEDORES (tb_fornecedores)
// ==============================================================================
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tb_fornecedores WHERE ativo = true ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em GET /api/suppliers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const s = req.body;
    if (!s.id || !s.nome) return res.status(400).json({ error: 'ID e Nome são obrigatórios' });

    const sql = `
      INSERT INTO tb_fornecedores (id, nome, tipo, contato, whatsapp, documento, cidade, estado, observacao, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        tipo = EXCLUDED.tipo,
        contato = EXCLUDED.contato,
        whatsapp = EXCLUDED.whatsapp,
        documento = EXCLUDED.documento,
        cidade = EXCLUDED.cidade,
        estado = EXCLUDED.estado,
        observacao = EXCLUDED.observacao,
        ativo = EXCLUDED.ativo,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      s.id,
      s.nome,
      s.tipo || 'Distribuidora',
      s.contato || '',
      s.whatsapp || '',
      s.documento || '',
      s.cidade || 'Belo Horizonte',
      s.estado || 'MG',
      s.observacao || '',
      s.ativo !== undefined ? Boolean(s.ativo) : true
    ];

    const result = await query(sql, values);
    res.json({ success: true, supplier: result.rows[0] });
  } catch (err) {
    console.error('Erro em POST /api/suppliers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tb_fornecedores WHERE id = $1', [id]);
    res.json({ success: true, message: `Fornecedor ${id} excluído` });
  } catch (err) {
    console.error('Erro em DELETE /api/suppliers/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// ROTAS: DESPESAS OPERACIONAIS (tb_despesas)
// ==============================================================================
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tb_despesas ORDER BY data DESC');
    const expenses = result.rows.map((r) => ({
      id: r.id,
      descricao: r.descricao,
      categoria: r.categoria,
      valor: Number(r.valor),
      data: r.data ? r.data.toString().slice(0, 10) : '',
      dataVencimento: r.data_vencimento ? r.data_vencimento.toString().slice(0, 10) : '',
      formaPagamento: r.forma_pagamento,
      status: r.status,
      observacao: r.observacao
    }));
    res.json(expenses);
  } catch (err) {
    console.error('Erro em GET /api/expenses:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id || !d.descricao) return res.status(400).json({ error: 'ID e Descrição são obrigatórios' });

    const sql = `
      INSERT INTO tb_despesas (id, descricao, categoria, valor, data, data_vencimento, forma_pagamento, status, observacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        descricao = EXCLUDED.descricao,
        categoria = EXCLUDED.categoria,
        valor = EXCLUDED.valor,
        data = EXCLUDED.data,
        data_vencimento = EXCLUDED.data_vencimento,
        forma_pagamento = EXCLUDED.forma_pagamento,
        status = EXCLUDED.status,
        observacao = EXCLUDED.observacao,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      d.id,
      d.descricao,
      d.categoria || 'Geral',
      d.valor || 0,
      d.data || new Date().toISOString().slice(0, 10),
      d.dataVencimento || d.data || new Date().toISOString().slice(0, 10),
      d.formaPagamento || 'pix',
      d.status || 'pago',
      d.observacao || ''
    ];

    const result = await query(sql, values);
    res.json({ success: true, expense: result.rows[0] });
  } catch (err) {
    console.error('Erro em POST /api/expenses:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const current = await query('SELECT status FROM tb_despesas WHERE id = $1', [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Despesa não encontrada' });

    const newStatus = current.rows[0].status === 'pago' ? 'pendente' : 'pago';
    const updateRes = await query(
      'UPDATE tb_despesas SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;',
      [id, newStatus]
    );
    res.json({ success: true, expense: updateRes.rows[0] });
  } catch (err) {
    console.error('Erro em toggle-status expense:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tb_despesas WHERE id = $1', [id]);
    res.json({ success: true, message: `Despesa ${id} excluída` });
  } catch (err) {
    console.error('Erro em DELETE /api/expenses/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// ROTAS: COMPRAS DE ESTOQUE (tb_compras_estoque)
// ==============================================================================
app.get('/api/purchases', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tb_compras_estoque ORDER BY data DESC');
    const purchases = result.rows.map((r) => ({
      id: r.id,
      fornecedor: r.fornecedor,
      fornecedorId: r.fornecedor_id,
      nf: r.nf,
      data: r.data ? r.data.toString().slice(0, 10) : '',
      qtdFrascos: Number(r.qtd_frascos || 0),
      valorTotal: Number(r.valor_total || 0),
      status: r.status,
      formaPagamento: r.forma_pagamento,
      observacao: r.observacao
    }));
    res.json(purchases);
  } catch (err) {
    console.error('Erro em GET /api/purchases:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const p = req.body;
    if (!p.id || !p.fornecedor) return res.status(400).json({ error: 'ID e Fornecedor são obrigatórios' });

    const sql = `
      INSERT INTO tb_compras_estoque (id, fornecedor, fornecedor_id, nf, data, qtd_frascos, valor_total, status, forma_pagamento, observacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        fornecedor = EXCLUDED.fornecedor,
        fornecedor_id = EXCLUDED.fornecedor_id,
        nf = EXCLUDED.nf,
        data = EXCLUDED.data,
        qtd_frascos = EXCLUDED.qtd_frascos,
        valor_total = EXCLUDED.valor_total,
        status = EXCLUDED.status,
        forma_pagamento = EXCLUDED.forma_pagamento,
        observacao = EXCLUDED.observacao,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      p.id,
      p.fornecedor,
      p.fornecedorId || 'FORN-001',
      p.nf || '',
      p.data || new Date().toISOString().slice(0, 10),
      p.qtdFrascos || 0,
      p.valorTotal || 0,
      p.status || 'pago',
      p.formaPagamento || 'boleto',
      p.observacao || ''
    ];

    const result = await query(sql, values);
    res.json({ success: true, purchase: result.rows[0] });
  } catch (err) {
    console.error('Erro em POST /api/purchases:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tb_compras_estoque WHERE id = $1', [id]);
    res.json({ success: true, message: `Compra ${id} excluída` });
  } catch (err) {
    console.error('Erro em DELETE /api/purchases/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// BACKUP / EXPORT TOTAL DO BANCO DE DADOS EM JSON
// ==============================================================================
app.get('/api/db/export', async (req, res) => {
  try {
    const [prods, forns, peds, desps, comps] = await Promise.all([
      query('SELECT * FROM tb_produtos'),
      query('SELECT * FROM tb_fornecedores'),
      query('SELECT * FROM tb_pedidos'),
      query('SELECT * FROM tb_despesas'),
      query('SELECT * FROM tb_compras_estoque')
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      counts: {
        produtos: prods.rows.length,
        fornecedores: forns.rows.length,
        pedidos: peds.rows.length,
        despesas: desps.rows.length,
        compras: comps.rows.length
      },
      data: {
        produtos: prods.rows.map(formatProductFromDb),
        fornecedores: forns.rows,
        pedidos: peds.rows.map(formatOrderFromDb),
        despesas: desps.rows,
        compras: comps.rows
      }
    });
  } catch (err) {
    console.error('Erro em /api/db/export:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// SERVIÇO DE ARQUIVOS ESTÁTICOS & FOTOS
// ==============================================================================
// 1. Stories
const storyPath = path.join(rootDir, 'catalogo-story');
if (fs.existsSync(storyPath)) {
  app.use('/catalogo-story', express.static(storyPath, { maxAge: '7d' }));
}

// 2. Template PDF
const pdfTemplatePath = path.join(rootDir, 'template_pdf');
if (fs.existsSync(pdfTemplatePath)) {
  app.use('/template_pdf', express.static(pdfTemplatePath, { maxAge: '7d' }));
}

// 3. Fallback inteligente para as pastas numeradas de fotos dos perfumes
app.use((req, res, next) => {
  try {
    const rawPath = decodeURIComponent(req.path);
    if (/^\/[0-9]+/.test(rawPath)) {
      let targetFile = path.join(rootDir, rawPath);

      // Fallback automático para .webp se .jpg/.png foi requisitado
      if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
        if (/\.(jpg|jpeg|png)$/i.test(targetFile)) {
          const webpFile = targetFile.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          if (fs.existsSync(webpFile) && fs.statSync(webpFile).isFile()) {
            targetFile = webpFile;
          }
        }
      }

      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        const ext = path.extname(targetFile).toLowerCase();
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml'
        };
        if (mimeTypes[ext]) {
          res.setHeader('Content-Type', mimeTypes[ext]);
          res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 dias
          return fs.createReadStream(targetFile).pipe(res);
        }
      }
    }
  } catch (e) {
    // Segue para a próxima rota
  }
  next();
});

// 4. Servir Frontend Vite Build (dist/)
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1d' }));

  // SPA Fallback: Qualquer rota GET não-API serve index.html
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// ==============================================================================
// INICIALIZAÇÃO DO SERVIDOR COM CONEXÃO AUTOMÁTICA AO BANCO
// ==============================================================================
app.listen(PORT, async () => {
  console.log('==================================================================');
  console.log(`🚀 [Snack Store BH] SERVIDOR ATIVO NA PORTA: ${PORT}`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log('==================================================================');

  // Inicializa banco e tabelas em background (não trava a subida do servidor)
  try {
    const initResult = await initializeDatabase({ verbose: true });
    if (!initResult.success && initResult.offline) {
      console.log('ℹ️ Servidor em execução. Conexão ao PostgreSQL será refeita assim que a rede estiver disponível.');
    }
  } catch (err) {
    console.warn('⚠️ Inicialização do banco em background pendente:', err.message);
  }
});
