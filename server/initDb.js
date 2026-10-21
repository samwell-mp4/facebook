import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query, testConnection } from './db.js';
import { CATALOG_DATA } from '../src/data/catalogData.js';
import { INITIAL_SUPPLIERS } from '../src/data/initialSuppliers.js';
import { INITIAL_ORDERS } from '../src/data/initialOrders.js';
import { INITIAL_EXPENSES } from '../src/data/initialExpenses.js';
import { INITIAL_PURCHASES } from '../src/data/initialPurchases.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the database schema and seeds initial data if tables are empty.
 */
export async function initializeDatabase(options = { verbose: true }) {
  const log = (...args) => {
    if (options.verbose) console.log(...args);
  };

  log('==================================================================');
  log('⚡ [PostgreSQL] Verificando conexão e inicializando tabelas...');
  log('==================================================================');

  const connTest = await testConnection();
  if (!connTest.connected) {
    console.warn('⚠️ [PostgreSQL Aviso]: Não foi possível conectar ao banco de dados no momento.');
    console.warn(`Motivo: ${connTest.error}`);
    console.warn(`Host configurado: ${connTest.config.host}:${connTest.config.port} / DB: ${connTest.config.database}`);
    return { success: false, error: connTest.error, offline: true };
  }

  log(`✅ Conexão ativa! Banco: ${connTest.database} | Latência: ${connTest.latencyMs}ms`);

  // 1. Executa o Schema DDL
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await query(schemaSql);
  log('✅ Schema e todas as 10 tabelas criadas/atualizadas com sucesso!');

  // 2. Seed tb_fornecedores
  const fornRes = await query('SELECT COUNT(*) FROM tb_fornecedores');
  const fornCount = parseInt(fornRes.rows[0].count, 10);
  if (fornCount === 0) {
    log(`🌱 Populando tabela tb_fornecedores com ${INITIAL_SUPPLIERS.length} fornecedores iniciais...`);
    for (const forn of INITIAL_SUPPLIERS) {
      await query(
        `INSERT INTO tb_fornecedores (id, nome, tipo, contato, whatsapp, documento, cidade, estado, observacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          forn.id,
          forn.nome,
          forn.tipo || 'Distribuidora',
          forn.contato || '',
          forn.whatsapp || '',
          forn.documento || '',
          forn.cidade || 'Belo Horizonte',
          forn.estado || 'MG',
          forn.observacao || ''
        ]
      );
    }
    log('✅ tb_fornecedores populada com sucesso!');
  }

  // 3. Seed tb_produtos (52 perfumes)
  const prodRes = await query('SELECT COUNT(*) FROM tb_produtos');
  const prodCount = parseInt(prodRes.rows[0].count, 10);
  if (prodCount === 0) {
    log(`🌱 Populando tabela tb_produtos com ${CATALOG_DATA.length} perfumes oficiais...`);
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
        ) ON CONFLICT (sku) DO NOTHING`,
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
    log(`✅ tb_produtos populada com todos os ${CATALOG_DATA.length} perfumes!`);
  }

  // 4. Seed tb_pedidos & tb_itens_pedido
  const pedRes = await query('SELECT COUNT(*) FROM tb_pedidos');
  const pedCount = parseInt(pedRes.rows[0].count, 10);
  if (pedCount === 0) {
    log(`🌱 Populando tabela tb_pedidos com ${INITIAL_ORDERS.length} pedidos iniciais...`);
    for (const ped of INITIAL_ORDERS) {
      await query(
        `INSERT INTO tb_pedidos (
          id, data_pedido, data_vencimento, status, cliente, itens,
          original_items, returned_items, totais, total_cobrar, total_pago,
          valor_em_aberto, forma_pagamento, payment_splits, financeiro,
          observacoes, historico_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`,
        [
          ped.id,
          ped.dataPedido || ped.createdAt.slice(0, 10),
          ped.dataVencimento || null,
          ped.status || 'pendente',
          JSON.stringify(ped.cliente || {}),
          JSON.stringify(ped.itens || []),
          JSON.stringify(ped.originalItems || []),
          JSON.stringify(ped.returnedItems || []),
          JSON.stringify(ped.totais || {}),
          ped.totalCobrar || ped.totais?.valorTotal || 0,
          ped.totalPago || 0,
          ped.valorEmAberto || 0,
          ped.formaPagamento || 'pix',
          JSON.stringify(ped.paymentSplits || {}),
          JSON.stringify(ped.financeiro || {}),
          ped.observacoes || '',
          JSON.stringify(ped.historicoStatus || []),
          ped.createdAt ? new Date(ped.createdAt) : new Date()
        ]
      );

      // Normaliza itens de pedido na tabela relacional tb_itens_pedido
      if (Array.isArray(ped.itens)) {
        for (const item of ped.itens) {
          await query(
            `INSERT INTO tb_itens_pedido (
              pedido_id, sku, cod, nome, qtd, preco_venda, preco_custo,
              subtotal_venda, subtotal_custo, lucro_item, is_estoque_proprio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              ped.id,
              item.sku || '',
              item.cod || '',
              item.nome || '',
              item.qtd || item.qty || 1,
              item.precoVenda || 0,
              item.precoCusto || 0,
              item.subtotalVenda || 0,
              item.subtotalCusto || 0,
              item.lucroItem || 0,
              item.isEstoqueProprio !== false
            ]
          );
        }
      }
    }
    log('✅ tb_pedidos e tb_itens_pedido populados com sucesso!');
  }

  // 5. Seed tb_despesas
  const despRes = await query('SELECT COUNT(*) FROM tb_despesas');
  const despCount = parseInt(despRes.rows[0].count, 10);
  if (despCount === 0) {
    log(`🌱 Populando tabela tb_despesas com ${INITIAL_EXPENSES.length} despesas operacionais...`);
    for (const desp of INITIAL_EXPENSES) {
      await query(
        `INSERT INTO tb_despesas (id, descricao, categoria, valor, data, data_vencimento, forma_pagamento, status, observacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          desp.id,
          desp.descricao,
          desp.categoria,
          desp.valor,
          desp.data,
          desp.dataVencimento || desp.data,
          desp.formaPagamento || 'pix',
          desp.status || 'pago',
          desp.observacao || ''
        ]
      );
    }
    log('✅ tb_despesas populada com sucesso!');
  }

  // 6. Seed tb_compras_estoque
  const compRes = await query('SELECT COUNT(*) FROM tb_compras_estoque');
  const compCount = parseInt(compRes.rows[0].count, 10);
  if (compCount === 0) {
    log(`🌱 Populando tabela tb_compras_estoque com nota inicial de compra...`);
    for (const comp of INITIAL_PURCHASES) {
      await query(
        `INSERT INTO tb_compras_estoque (id, fornecedor, fornecedor_id, nf, data, qtd_frascos, valor_total, status, forma_pagamento, observacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          comp.id,
          comp.fornecedor,
          comp.fornecedorId || 'FORN-001',
          comp.nf || '',
          comp.data,
          comp.qtdFrascos || 0,
          comp.valorTotal,
          comp.status || 'pago',
          comp.formaPagamento || 'boleto',
          comp.observacao || ''
        ]
      );
    }
    log('✅ tb_compras_estoque populada com sucesso!');
  }

  // 7. Atualiza tb_configuracoes
  await query(
    `INSERT INTO tb_configuracoes (chave, valor, descricao)
     VALUES ($1, $2, $3)
     ON CONFLICT (chave) DO UPDATE SET valor = $2, updated_at = NOW()`,
    [
      'app_init_metadata',
      JSON.stringify({
        initializedAt: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        dbName: connTest.database
      }),
      'Metadados de inicialização do sistema e banco PostgreSQL'
    ]
  );

  // Auto-repara qualquer data nula ou inconsistente em tb_pedidos existente
  try {
    await query(`
      UPDATE tb_pedidos
      SET data_pedido = created_at::date
      WHERE data_pedido IS NULL;

      UPDATE tb_pedidos
      SET data_vencimento = (data_pedido + INTERVAL '30 days')::date
      WHERE data_vencimento IS NULL AND valor_em_aberto > 0;
    `);
  } catch (healErr) {
    console.warn('Aviso ao auto-reparar datas no banco:', healErr.message);
  }

  // Status final
  const [fCount, pCount, ordCount, dCount, cCount] = await Promise.all([
    query('SELECT COUNT(*) FROM tb_fornecedores').then((r) => r.rows[0].count),
    query('SELECT COUNT(*) FROM tb_produtos').then((r) => r.rows[0].count),
    query('SELECT COUNT(*) FROM tb_pedidos').then((r) => r.rows[0].count),
    query('SELECT COUNT(*) FROM tb_despesas').then((r) => r.rows[0].count),
    query('SELECT COUNT(*) FROM tb_compras_estoque').then((r) => r.rows[0].count)
  ]);

  log('==================================================================');
  log('🎉 BANCO DE DADOS POSTGRESQL TOTALMENTE CONECTADO E PRONTO!');
  log(`📊 Totais Cadastrados no Banco:`);
  log(`   - Perfumes / Produtos: ${pCount}`);
  log(`   - Fornecedores:        ${fCount}`);
  log(`   - Pedidos:             ${ordCount}`);
  log(`   - Despesas:            ${dCount}`);
  log(`   - Compras de Estoque:  ${cCount}`);
  log('==================================================================');

  return {
    success: true,
    counts: {
      produtos: parseInt(pCount, 10),
      fornecedores: parseInt(fCount, 10),
      pedidos: parseInt(ordCount, 10),
      despesas: parseInt(dCount, 10),
      compras: parseInt(cCount, 10)
    }
  };
}

// Se executado diretamente: node server/initDb.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase({ verbose: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Falha na inicialização do banco:', err);
      process.exit(1);
    });
}
