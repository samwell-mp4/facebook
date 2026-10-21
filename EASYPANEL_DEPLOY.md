# 🚀 Snack Store BH - Deploy no Easypanel com PostgreSQL na Nuvem

Este projeto é uma aplicação moderna completa: **Frontend React/Vite** + **Backend Node.js/Express** + **Banco de Dados PostgreSQL (`pg_snk`)**.

Tudo roda perfeitamente em produção no **Easypanel** com conexão interna ultra-rápida, migração e população automática de tabelas no primeiro boot!

---

## 💎 Conexão PostgreSQL Integrada

A URL interna informada já está configurada como padrão de fallback no backend:

```env
DATABASE_URL=postgres://pg_snk_bnk:jaIFJADOFJADppga@plug_sales_dispatch_app_pga_snk:5432/pga_snk?sslmode=disable
```

### 📋 As 10 Tabelas Criadas Automaticamente:
1. **`tb_produtos`**: Todos os 52 perfumes (Brand Collection e Árabes) com especificações olfativas, fotos, pirâmide olfativa, preços de compra, atacado, varejo, estoque próprio e alocações de parceiros.
2. **`tb_fornecedores`**: Cadastro completo de fornecedores, importadoras e lojistas parceiros com contatos, WhatsApp, CNPJ/CPF e cidades.
3. **`tb_fornecedor_produtos`**: Tabela relacional de vínculo entre fornecedor e estoque de perfumes.
4. **`tb_pedidos`**: Central de vendas e despachos com dados do cliente (JSONB), status do pedido, histórico de rastreio, totais de venda, custo, lucro e pagamentos.
5. **`tb_itens_pedido`**: Normalização relacional de itens de pedidos para queries analíticas e relatórios.
6. **`tb_despesas`**: Gestão contábil de despesas operacionais (sacolas, frete, marketing, motoboy) com vencimentos e status.
7. **`tb_compras_estoque`**: Lotes de compra de mercadoria com notas fiscais, frascos e valores totais.
8. **`tb_acertos_historico`**: Histórico detalhado de conciliações de consignados com devoluções e recebimentos.
9. **`tb_configuracoes`**: Configurações gerais da loja, versionamento e metadados de auditoria.
10. **`tb_logs_auditoria`**: Rastreabilidade de alterações operacionais no sistema.

---

## 🌐 Passo a Passo no Easypanel:

### 1. Criar o Serviço App
1. Acesse o seu painel do **Easypanel**;
2. No seu Projeto (onde o serviço PostgreSQL `plug_sales_dispatch_app_pg_snk` já existe), clique em **+ Service** ➔ escolha **App**;
3. Dê um nome ao app (ex: `snack-store-app` ou `snack-catalogo`).

### 2. Configurar a Origem (Source)
- Na aba **Source**:
  - Selecione o seu repositório Git (GitHub ou GitLab);
  - Branch: `main`.

### 3. Configurar Build
- Na aba **Build**:
  - Build Method: **Dockerfile**;
  - Dockerfile Path: `./Dockerfile`.

### 4. Configurar Variáveis de Ambiente (Environment)
Na aba **Environment**, adicione:
```env
NODE_ENV=production
PORT=80
DATABASE_URL=postgres://pg_snk_bnk:jaIFJADOFJADppga@plug_sales_dispatch_app_pga_snk:5432/pga_snk?sslmode=disable
```
*(Nota: O backend já possui essa URL como fallback padrão, mas declarar no painel é uma boa prática).*

### 5. Configurar Portas e Domínio
- Na aba **Domains**: adicione o domínio ou subdomínio desejado (ex: `catalogo.snackstorebh.com.br`) ou use o domínio `.easypanel.host`;
- Na aba **Ports**: porta `80`.

### 6. Clicar em Deploy! 🚀
- O Easypanel irá construir a imagem Docker;
- Ao inicializar, o backend se conectará ao container `plug_sales_dispatch_app_pg_snk`;
- Executará o arquivo `server/schema.sql` criando todas as 10 tabelas;
- Populará automaticamente todos os 52 perfumes, fornecedores, pedidos iniciais e despesas;
- O painel executivo mostrará o badge: **🟢 PostgreSQL pg_snk Conectado**!

---

## 🔍 Como Testar e Validar a Conexão:

### Endpoint de Saúde e Status do Banco:
Acesse no navegador ou via curl:
```
GET https://seu-dominio.com.br/api/health
```
Resposta esperada:
```json
{
  "status": "online",
  "app": "Snack Store BH - API & Catálogo Nuvem",
  "database": {
    "connected": true,
    "latencyMs": 8,
    "database": "pg_snk"
  },
  "counts": {
    "produtos": 52,
    "fornecedores": 4,
    "pedidos": 3,
    "despesas": 3,
    "compras": 1
  }
}
```

### Script de Execução Manual (Opcional):
Caso queira rodar a inicialização manualmente via linha de comando ou container shell:
```bash
npm run db:init
```
Ou executar o script SQL diretamente no DBeaver / pgAdmin / Console Easypanel com o arquivo [server/schema.sql](file:///c:/Users/User/Downloads/Catalogo%20Novo%20Snack%20Store%20BH-20261013T151552Z-1-001/Catalogo%20Novo%20Snack%20Store%20BH/server/schema.sql).
