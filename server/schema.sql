-- ==============================================================================
-- SNACK STORE BH - SCHEMA OFICIAL POSTGRESQL
-- Banco: pg_snk | Usuário: pg_snk_bnk
-- Criado para suportar Catálogo, Copyboard, Vendas, Estoque e Contabilidade
-- ==============================================================================

-- Extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar automaticamente a coluna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TABELA DE CONFIGURAÇÕES DO SISTEMA (tb_configuracoes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_configuracoes (
    chave VARCHAR(100) PRIMARY KEY,
    valor JSONB NOT NULL,
    descricao TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE PRODUTOS / PERFUMES (tb_produtos)
-- Armazena os 52 perfumes (Brand Collection e Árabes) com especificações e preços
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_produtos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    item_num VARCHAR(20),
    cod VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    clean_name VARCHAR(255),
    collection_name VARCHAR(150),
    is_arabic BOOLEAN DEFAULT FALSE,
    gender VARCHAR(50),
    gender_word VARCHAR(50),
    ref_olfativa VARCHAR(255),
    familia_olfativa VARCHAR(255),
    notas_saida TEXT,
    notas_corpo TEXT,
    notas_fundo TEXT,
    dir_name VARCHAR(255),
    cover_image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    image_count INTEGER DEFAULT 0,
    title_short TEXT,
    title_long TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    tags_string TEXT,
    full_description TEXT,
    preco_compra NUMERIC(10, 2) DEFAULT 0.00,
    preco_atacado NUMERIC(10, 2) DEFAULT 0.00,
    preco_varejo NUMERIC(10, 2) DEFAULT 0.00,
    qtd_estoque INTEGER DEFAULT 0,
    estoque_proprio INTEGER DEFAULT 0,
    fornecedores JSONB DEFAULT '[]'::jsonb,
    lucro_atacado NUMERIC(10, 2) DEFAULT 0.00,
    margem_atacado NUMERIC(10, 2) DEFAULT 0.00,
    lucro_varejo NUMERIC(10, 2) DEFAULT 0.00,
    margem_varejo NUMERIC(10, 2) DEFAULT 0.00,
    lucro_revendedor NUMERIC(10, 2) DEFAULT 0.00,
    margem_revendedor NUMERIC(10, 2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_sku ON tb_produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_is_arabic ON tb_produtos(is_arabic);
CREATE INDEX IF NOT EXISTS idx_produtos_gender ON tb_produtos(gender);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON tb_produtos(ativo);

DROP TRIGGER IF EXISTS trg_produtos_updated_at ON tb_produtos;
CREATE TRIGGER trg_produtos_updated_at
BEFORE UPDATE ON tb_produtos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. TABELA DE FORNECEDORES & PARCEIROS (tb_fornecedores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_fornecedores (
    id VARCHAR(50) PRIMARY KEY, -- ex: FORN-001
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100), -- Distribuidora, Importadora, Lojista Parceiro
    contato VARCHAR(100),
    whatsapp VARCHAR(50),
    documento VARCHAR(50),
    cidade VARCHAR(100),
    estado VARCHAR(10),
    observacao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON tb_fornecedores(nome);

DROP TRIGGER IF EXISTS trg_fornecedores_updated_at ON tb_fornecedores;
CREATE TRIGGER trg_fornecedores_updated_at
BEFORE UPDATE ON tb_fornecedores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. TABELA DE ESTOQUE POR FORNECEDOR / RELAÇÃO (tb_fornecedor_produtos)
-- Vincula cada fornecedor aos produtos fornecidos e quantidades alocadas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_fornecedor_produtos (
    id SERIAL PRIMARY KEY,
    fornecedor_id VARCHAR(50) REFERENCES tb_fornecedores(id) ON DELETE CASCADE,
    produto_sku VARCHAR(100) REFERENCES tb_produtos(sku) ON DELETE CASCADE,
    qtd INTEGER DEFAULT 0,
    custo_unidade NUMERIC(10, 2) DEFAULT 0.00,
    observacao TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fornecedor_id, produto_sku)
);

CREATE INDEX IF NOT EXISTS idx_forn_prod_forn ON tb_fornecedor_produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_forn_prod_prod ON tb_fornecedor_produtos(produto_sku);

-- ------------------------------------------------------------------------------
-- 5. TABELA DE PEDIDOS & DESPACHOS (tb_pedidos)
-- Gerenciamento de vendas, consignações, rotas de entrega e acertos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_pedidos (
    id VARCHAR(50) PRIMARY KEY, -- ex: PED-102941
    data_pedido DATE NOT NULL,
    data_vencimento DATE,
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, confirmado, em-rota, concluido, cancelado, acerto
    cliente JSONB NOT NULL, -- { nome, telefone, cpf, endereco: { ... } }
    itens JSONB NOT NULL DEFAULT '[]'::jsonb, -- lista de produtos do pedido
    original_items JSONB DEFAULT '[]'::jsonb, -- itens base para conferência de acerto
    returned_items JSONB DEFAULT '[]'::jsonb, -- itens devolvidos no acerto
    totais JSONB NOT NULL, -- { valorTotal, custoTotal, lucroBruto, margemLucro, qtdItens }
    total_cobrar NUMERIC(10, 2) DEFAULT 0.00,
    total_pago NUMERIC(10, 2) DEFAULT 0.00,
    valor_em_aberto NUMERIC(10, 2) DEFAULT 0.00,
    forma_pagamento VARCHAR(50),
    payment_splits JSONB DEFAULT '{}'::jsonb, -- divisão de pagamentos (pix, cartao, etc)
    financeiro JSONB DEFAULT '{}'::jsonb, -- detalhes de faturamento e quitação
    observacoes TEXT,
    historico_status JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_status ON tb_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON tb_pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_nome ON tb_pedidos USING gin ((cliente -> 'nome'));

DROP TRIGGER IF EXISTS trg_pedidos_updated_at ON tb_pedidos;
CREATE TRIGGER trg_pedidos_updated_at
BEFORE UPDATE ON tb_pedidos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. TABELA NORMALIZADA DE ITENS DE PEDIDO (tb_itens_pedido)
-- Permite queries analíticas SQL diretas (ranking de mais vendidos, ticket médio)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(50) REFERENCES tb_pedidos(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    cod VARCHAR(50),
    nome VARCHAR(255),
    qtd INTEGER NOT NULL DEFAULT 1,
    preco_venda NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    preco_custo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal_venda NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal_custo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lucro_item NUMERIC(10, 2) DEFAULT 0.00,
    is_estoque_proprio BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_ped_pedido ON tb_itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_ped_sku ON tb_itens_pedido(sku);

-- ------------------------------------------------------------------------------
-- 7. TABELA DE DESPESAS OPERACIONAIS (tb_despesas)
-- Embalagens, fretes, tráfego pago, custos fixos e taxas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_despesas (
    id VARCHAR(50) PRIMARY KEY, -- ex: DESP-001
    descricao TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data DATE NOT NULL,
    data_vencimento DATE,
    forma_pagamento VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pago', -- pago, pendente, atrasado
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_data ON tb_despesas(data);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON tb_despesas(categoria);
CREATE INDEX IF NOT EXISTS idx_despesas_status ON tb_despesas(status);

DROP TRIGGER IF EXISTS trg_despesas_updated_at ON tb_despesas;
CREATE TRIGGER trg_despesas_updated_at
BEFORE UPDATE ON tb_despesas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 8. TABELA DE COMPRAS DE ESTOQUE & NOTAS FISCAIS (tb_compras_estoque)
-- Entradas de lotes de perfumes com quantidade de frascos e valor total
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_compras_estoque (
    id VARCHAR(50) PRIMARY KEY, -- ex: COMPRA-001
    fornecedor VARCHAR(255) NOT NULL,
    fornecedor_id VARCHAR(50),
    nf VARCHAR(100),
    data DATE NOT NULL,
    qtd_frascos INTEGER DEFAULT 0,
    valor_total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pago',
    forma_pagamento VARCHAR(50),
    observacao TEXT,
    itens_detalhe JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_data ON tb_compras_estoque(data);
CREATE INDEX IF NOT EXISTS idx_compras_fornecedor ON tb_compras_estoque(fornecedor);

DROP TRIGGER IF EXISTS trg_compras_updated_at ON tb_compras_estoque;
CREATE TRIGGER trg_compras_updated_at
BEFORE UPDATE ON tb_compras_estoque
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 9. TABELA DE HISTÓRICO DE ACERTOS (tb_acertos_historico)
-- Registra conciliações de consignados com clientes e parceiros
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_acertos_historico (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(50) REFERENCES tb_pedidos(id) ON DELETE CASCADE,
    data_acerto TIMESTAMPTZ DEFAULT NOW(),
    cliente_nome VARCHAR(255),
    total_cobrado NUMERIC(10, 2) NOT NULL,
    total_pago NUMERIC(10, 2) NOT NULL,
    saldo_devedor NUMERIC(10, 2) NOT NULL,
    itens_vendidos JSONB DEFAULT '[]'::jsonb,
    itens_devolvidos JSONB DEFAULT '[]'::jsonb,
    forma_pagamento VARCHAR(50),
    observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_acertos_pedido ON tb_acertos_historico(pedido_id);

-- ------------------------------------------------------------------------------
-- 10. TABELA DE LOGS DE AUDITORIA & SINCRONIZAÇÃO (tb_logs_auditoria)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_logs_auditoria (
    id SERIAL PRIMARY KEY,
    entidade VARCHAR(50) NOT NULL, -- produtos, pedidos, fornecedores, etc
    operacao VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, SEED
    registro_id VARCHAR(100),
    dados JSONB,
    usuario VARCHAR(100) DEFAULT 'sistema',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_entidade ON tb_logs_auditoria(entidade);
