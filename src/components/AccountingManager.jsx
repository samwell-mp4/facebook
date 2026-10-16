import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Pagination from './Pagination';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpDown,
  MessageCircle,
  ExternalLink,
  Percent,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Building2,
  ShoppingBag,
  Package,
  Layers,
  X,
  CreditCard,
  Banknote,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Coins
} from 'lucide-react';

const CATEGORIAS_ENTRADA = [
  'Receita de Venda / Balcão',
  'Aporte de Capital / Investimento',
  'Recebimento de Cliente',
  'Rendimento / Aplicação',
  'Estorno / Devolução',
  'Outras Entradas'
];

const CATEGORIAS_SAIDA = [
  'Embalagens',
  'Frete / Logística',
  'Marketing / Anúncios',
  'Operacional',
  'Pessoal / Pró-labore',
  'Fornecedores / Parceiros',
  'Impostos / Taxas',
  'Outras Saídas'
];

const CATEGORIAS_DESPESA = CATEGORIAS_SAIDA;

export default function AccountingManager({
  orders = [],
  expenses = [],
  stockPurchases = [],
  products = [],
  onTogglePaymentStatus,
  onSaveExpense,
  onDeleteExpense,
  onToggleExpenseStatus,
  onSaveStockPurchase,
  onDeleteStockPurchase,
  onOpenOrderDetail,
  onToast
}) {
  // Sub-tabs: 'dre', 'receber', 'despesas', 'estoque_compras'
  const [finSubTab, setFinSubTab] = useState('dre');

  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [movTipo, setMovTipo] = useState('saida'); // 'entrada' or 'saida'

  // Filters for Contas a Receber
  const [receberStatusFilter, setReceberStatusFilter] = useState('all'); // 'all', 'pendente', 'pago', 'atrasado'
  const [receberSearch, setReceberSearch] = useState('');
  const [receberCurrentPage, setReceberCurrentPage] = useState(1);
  const [receberPageSize, setReceberPageSize] = useState(10);

  // Filters for Despesas / Entradas
  const [expenseFilter, setExpenseFilter] = useState('all'); // 'all', 'entradas', 'saidas', 'pendente', 'pago'
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);

  useEffect(() => {
    setReceberCurrentPage(1);
  }, [receberStatusFilter, receberSearch]);

  useEffect(() => {
    setExpenseCurrentPage(1);
  }, [expenseFilter, expenseSearch]);

  // New Expense / Entrada Form State
  const [novaDespDescricao, setNovaDespDescricao] = useState('');
  const [novaDespCategoria, setNovaDespCategoria] = useState('Embalagens');
  const [novaDespValor, setNovaDespValor] = useState('');
  const [novaDespData, setNovaDespData] = useState(() => new Date().toISOString().slice(0, 10));
  const [novaDespVencimento, setNovaDespVencimento] = useState(() => new Date().toISOString().slice(0, 10));
  const [novaDespForma, setNovaDespForma] = useState('pix');
  const [novaDespStatus, setNovaDespStatus] = useState('pago');
  const [novaDespObs, setNovaDespObs] = useState('');

  const openNewMov = (tipo) => {
    setMovTipo(tipo);
    setNovaDespCategoria(tipo === 'entrada' ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0]);
    setNovaDespStatus('pago');
    setShowAddExpenseModal(true);
  };

  // New Purchase Form State
  const [novaCompraFornecedor, setNovaCompraFornecedor] = useState('');
  const [novaCompraNF, setNovaCompraNF] = useState('');
  const [novaCompraQtd, setNovaCompraQtd] = useState(10);
  const [novaCompraValor, setNovaCompraValor] = useState('');
  const [novaCompraData, setNovaCompraData] = useState(() => new Date().toISOString().slice(0, 10));
  const [novaCompraForma, setNovaCompraForma] = useState('boleto');
  const [novaCompraStatus, setNovaCompraStatus] = useState('pago');
  const [novaCompraObs, setNovaCompraObs] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (str) => {
    if (!str) return '-';
    try {
      const d = new Date(str + (str.length <= 10 ? 'T12:00:00' : ''));
      return d.toLocaleDateString('pt-BR');
    } catch {
      return str;
    }
  };

  const getDaysDiff = (targetDate) => {
    if (!targetDate) return 0;
    const d1 = new Date(todayStr);
    const d2 = new Date(targetDate.slice(0, 10));
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  };

  // 1. Process Financial Records from Orders (Vendas / Contas a Receber)
  const salesRecords = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelado')
      .map((o) => {
        const totalVenda = Number(
          o.totais?.valorTotal ??
          o.totalCobrar ??
          o.total ??
          o.financeiro?.valorTotal ??
          o.financeiro?.totalVenda ??
          (Array.isArray(o.itens) ? o.itens.reduce((s, i) => s + (Number(i.precoVenda || i.preco || 0) * Number(i.qtd || i.qty || 1)), 0) : 0)
        );
        const totalCusto = Number(
          o.totais?.custoTotal ??
          o.totalCusto ??
          o.financeiro?.totalCusto ??
          o.financeiro?.valorCusto ??
          0
        );
        const lucro = totalVenda - totalCusto;
        const margem = totalCusto > 0 ? (lucro / totalCusto) * 100 : 0;

        const totalPago = o.totalPago !== undefined && o.totalPago !== null
          ? Number(o.totalPago)
          : (o.financeiro?.valorRecebido !== undefined && o.financeiro?.valorRecebido !== null
              ? Number(o.financeiro.valorRecebido)
              : (o.financeiro?.statusPagamento === 'pago' ? totalVenda : 0));

        const valorEmAberto = o.valorEmAberto !== undefined && o.valorEmAberto !== null
          ? Number(o.valorEmAberto)
          : (o.financeiro?.valorEmAberto !== undefined && o.financeiro?.valorEmAberto !== null
              ? Number(o.financeiro.valorEmAberto)
              : Math.max(0, Math.round((totalVenda - totalPago) * 100) / 100));

        const isPago = valorEmAberto === 0 && (totalVenda > 0 || o.financeiro?.statusPagamento === 'pago');
        const isParcial = totalPago > 0 && valorEmAberto > 0;

        const dueDate = o.dataVencimento || o.dataPedido || todayStr;
        const daysOver = getDaysDiff(dueDate);
        const isAtrasado = valorEmAberto > 0 && daysOver > 0;

        return {
          orderId: o.id,
          order: o,
          clienteNome: o.cliente?.nome || 'Cliente',
          clienteTel: o.cliente?.telefone || '',
          dataPedido: o.dataPedido,
          dataVencimento: dueDate,
          itensCount: (o.itens || []).reduce((acc, i) => acc + (i.qtd || i.qty || 1), 0),
          itensSummary: (o.itens || []).map((i) => `${i.qtd || i.qty || 1}x ${i.cod || i.nome}`).join(', '),
          totalVenda,
          totalCusto,
          lucro,
          margem,
          totalPago,
          valorEmAberto,
          isPago,
          isParcial,
          isAtrasado,
          daysOver,
          metodoPagamento: o.financeiro?.metodoPagamento || o.formaPagamento || 'pix',
          status: isPago ? 'pago' : isParcial ? 'parcial' : isAtrasado ? 'atrasado' : 'pendente'
        };
      });
  }, [orders, todayStr]);

  // 2. Comprehensive Accounting Indicators & DRE
  const accounting = useMemo(() => {
    // Vendas
    let receitaBrutaTotal = 0;
    let caixaRecebido = 0;
    let contasAReceber = 0;
    let contasEmAtraso = 0;
    let cmvTotalVendido = 0;
    let cmvRealizadoPago = 0;

    salesRecords.forEach((s) => {
      receitaBrutaTotal += s.totalVenda;
      cmvTotalVendido += s.totalCusto;

      caixaRecebido += s.totalPago;
      contasAReceber += s.valorEmAberto;

      if (s.isAtrasado && s.valorEmAberto > 0) {
        contasEmAtraso += s.valorEmAberto;
      }

      if (s.totalVenda > 0) {
        const propPago = Math.min(1, s.totalPago / s.totalVenda);
        cmvRealizadoPago += s.totalCusto * propPago;
      }
    });

    // Movimentações Financeiras (Entradas & Saídas)
    let despesasPagas = 0;
    let despesasAPagar = 0;
    let entradasPagas = 0;
    let entradasAPagar = 0;

    expenses.forEach((e) => {
      const val = Number(e.valor || 0);
      const isEntrada = e.tipo === 'entrada';
      if (isEntrada) {
        if (e.status === 'pago') {
          entradasPagas += val;
        } else {
          entradasAPagar += val;
        }
      } else {
        if (e.status === 'pago') {
          despesasPagas += val;
        } else {
          despesasAPagar += val;
        }
      }
    });

    // Compras de Estoque
    let totalComprasEstoque = 0;
    stockPurchases.forEach((p) => {
      totalComprasEstoque += Number(p.valorTotal || 0);
    });

    // Capital Imobilizado Atual em Estoque
    let valorEstoqueAtual = 0;
    let frascosEmEstoque = 0;
    products.forEach((p) => {
      const q = Number(p.qtdEstoque || 0);
      const c = Number(p.precoCompra || 0);
      frascosEmEstoque += q;
      valorEstoqueAtual += q * c;
    });

    // DRE Realizada (Regime de Caixa e Competência)
    const lucroBrutoRealizado = caixaRecebido - cmvRealizadoPago;
    const lucroLiquidoRealizado = (lucroBrutoRealizado + entradasPagas) - despesasPagas;
    const totalEntradasPagas = caixaRecebido + entradasPagas;
    const margemLiquidaRealizada = totalEntradasPagas > 0 ? (lucroLiquidoRealizado / totalEntradasPagas) * 100 : 0;

    // DRE Projetada (Considerando pedidos e despesas pendentes)
    const lucroBrutoProjetado = (receitaBrutaTotal + entradasPagas + entradasAPagar) - cmvTotalVendido;
    const lucroLiquidoProjetado = lucroBrutoProjetado - (despesasPagas + despesasAPagar);
    const margemLiquidaProjetada = (receitaBrutaTotal + entradasPagas + entradasAPagar) > 0
      ? (lucroLiquidoProjetado / (receitaBrutaTotal + entradasPagas + entradasAPagar)) * 100
      : 0;

    // Saldo Líquido Atual em Caixa (Entradas Realizadas - Despesas Pagas)
    const saldoCaixaAtual = totalEntradasPagas - despesasPagas;

    return {
      receitaBrutaTotal,
      caixaRecebido,
      contasAReceber,
      contasEmAtraso,
      cmvTotalVendido,
      cmvRealizadoPago,
      despesasPagas,
      despesasAPagar,
      totalComprasEstoque,
      valorEstoqueAtual,
      frascosEmEstoque,
      lucroBrutoRealizado,
      lucroLiquidoRealizado,
      margemLiquidaRealizada,
      lucroBrutoProjetado,
      lucroLiquidoProjetado,
      margemLiquidaProjetada,
      saldoCaixaAtual
    };
  }, [salesRecords, expenses, stockPurchases, products]);

  // Filtered Sales for Contas a Receber Table
  const filteredSales = useMemo(() => {
    const q = receberSearch.toLowerCase().trim();
    return salesRecords.filter((s) => {
      if (receberStatusFilter === 'pago' && !s.isPago) return false;
      if (receberStatusFilter === 'pendente' && (s.isPago || s.isAtrasado)) return false;
      if (receberStatusFilter === 'atrasado' && !s.isAtrasado) return false;
      if (!q) return true;
      return (
        s.orderId?.toLowerCase().includes(q) ||
        s.clienteNome?.toLowerCase().includes(q) ||
        s.clienteTel?.includes(q) ||
        s.itensSummary?.toLowerCase().includes(q)
      );
    });
  }, [salesRecords, receberStatusFilter, receberSearch]);

  // Filtered Expenses / Entradas
  const filteredExpenses = useMemo(() => {
    const q = expenseSearch.toLowerCase().trim();
    return expenses.filter((e) => {
      const isEntrada = e.tipo === 'entrada';
      if (expenseFilter === 'entradas' && !isEntrada) return false;
      if (expenseFilter === 'saidas' && isEntrada) return false;
      if (expenseFilter === 'pago' && e.status !== 'pago') return false;
      if (expenseFilter === 'pendente' && e.status === 'pago') return false;
      if (!q) return true;
      return (
        e.descricao?.toLowerCase().includes(q) ||
        e.categoria?.toLowerCase().includes(q) ||
        e.formaPagamento?.toLowerCase().includes(q)
      );
    });
  }, [expenses, expenseFilter, expenseSearch]);

  // Handle Add Expense or Entrada
  const handleCreateExpense = (e) => {
    e.preventDefault();
    const val = parseFloat(novaDespValor);
    if (!novaDespDescricao.trim() || isNaN(val) || val <= 0) {
      alert(`Informe uma descrição e um valor válido para a ${movTipo === 'entrada' ? 'entrada' : 'despesa'}!`);
      return;
    }

    const newExpense = {
      id: `${movTipo === 'entrada' ? 'REC' : 'DESP'}-${Date.now().toString().slice(-6)}`,
      tipo: movTipo, // 'entrada' or 'saida'
      descricao: novaDespDescricao.trim(),
      categoria: novaDespCategoria,
      valor: val,
      data: novaDespData,
      dataVencimento: novaDespVencimento || novaDespData,
      formaPagamento: novaDespForma,
      status: novaDespStatus,
      observacao: novaDespObs.trim(),
      criadoEm: new Date().toISOString()
    };

    onSaveExpense && onSaveExpense(newExpense);
    setShowAddExpenseModal(false);
    setNovaDespDescricao('');
    setNovaDespValor('');
    setNovaDespObs('');
    onToast && onToast(`${movTipo === 'entrada' ? 'Entrada (Receita)' : 'Saída (Despesa)'} salva com sucesso! 💰`);
  };

  // Handle Add Stock Purchase
  const handleCreatePurchase = (e) => {
    e.preventDefault();
    const val = parseFloat(novaCompraValor);
    const qtd = parseInt(novaCompraQtd) || 0;
    if (!novaCompraFornecedor.trim() || isNaN(val) || val <= 0) {
      alert('Informe o fornecedor e o valor total da compra de estoque!');
      return;
    }

    const newPurchase = {
      id: `COMPRA-${Date.now().toString().slice(-6)}`,
      fornecedor: novaCompraFornecedor.trim(),
      nf: novaCompraNF.trim() || 'Sem NF',
      qtdFrascos: qtd,
      valorTotal: val,
      data: novaCompraData,
      formaPagamento: novaCompraForma,
      status: novaCompraStatus,
      observacao: novaCompraObs.trim(),
      criadoEm: new Date().toISOString()
    };

    onSaveStockPurchase && onSaveStockPurchase(newPurchase);
    setShowAddPurchaseModal(false);
    setNovaCompraFornecedor('');
    setNovaCompraNF('');
    setNovaCompraValor('');
    setNovaCompraObs('');
  };

  // Export Full Accounting Excel
  const handleExportFullAccounting = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: DRE
    const dreRows = [
      { 'Item': 'Receita Bruta Total de Vendas', 'Valor (R$)': accounting.receitaBrutaTotal },
      { 'Item': 'Caixa Efetivamente Recebido (Vendas Pagas)', 'Valor (R$)': accounting.caixaRecebido },
      { 'Item': 'Contas a Receber (Vendas Pendentes)', 'Valor (R$)': accounting.contasAReceber },
      { 'Item': 'CMV Realizado (Custo das Peças Pagas)', 'Valor (R$)': -accounting.cmvRealizadoPago },
      { 'Item': 'Lucro Bruto Operacional Realizado', 'Valor (R$)': accounting.lucroBrutoRealizado },
      { 'Item': 'Despesas Operacionais Pagas', 'Valor (R$)': -accounting.despesasPagas },
      { 'Item': 'Despesas Operacionais a Pagar', 'Valor (R$)': -accounting.despesasAPagar },
      { 'Item': 'LUCRO LÍQUIDO REALIZADO DA EMPRESA', 'Valor (R$)': accounting.lucroLiquidoRealizado },
      { 'Item': 'Margem Líquida Realizada (%)', 'Valor (R$)': accounting.margemLiquidaRealizada.toFixed(1) + '%' },
      { 'Item': 'Saldo Atual em Caixa (Entradas - Saídas)', 'Valor (R$)': accounting.saldoCaixaAtual },
      { 'Item': 'Capital Imobilizado em Estoque Atual', 'Valor (R$)': accounting.valorEstoqueAtual }
    ];
    const wsDre = XLSX.utils.json_to_sheet(dreRows);
    XLSX.utils.book_append_sheet(wb, wsDre, 'DRE & Indicadores');

    // Sheet 2: Contas a Receber
    const salesRows = salesRecords.map((s) => ({
      'ID Pedido': s.orderId,
      'Cliente': s.clienteNome,
      'Telefone': s.clienteTel,
      'Data Pedido': s.dataPedido,
      'Vencimento': s.dataVencimento,
      'Frascos': s.itensCount,
      'Valor Venda (R$)': s.totalVenda,
      'Custo CMV (R$)': s.totalCusto,
      'Lucro Líquido (R$)': s.lucro,
      'Margem (%)': s.margem.toFixed(1) + '%',
      'Status': s.status.toUpperCase(),
      'Forma Pagamento': s.metodoPagamento
    }));
    const wsSales = XLSX.utils.json_to_sheet(salesRows);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Contas a Receber');

    // Sheet 3: Despesas
    const expRows = expenses.map((e) => ({
      'ID': e.id,
      'Descrição': e.descricao,
      'Categoria': e.categoria,
      'Valor (R$)': Number(e.valor || 0),
      'Data': e.data,
      'Vencimento': e.dataVencimento || e.data,
      'Forma': e.formaPagamento,
      'Status': e.status.toUpperCase(),
      'Observação': e.observacao || ''
    }));
    const wsExp = XLSX.utils.json_to_sheet(expRows);
    XLSX.utils.book_append_sheet(wb, wsExp, 'Despesas & Pagamentos');

    XLSX.writeFile(wb, `SnackStoreBH_ContabilidadeCompleta_${todayStr}.xlsx`);
    onToast && onToast('Relatório contábil completo exportado com sucesso! 📊📥');
  };

  return (
    <div className="orders-clean-platform">
      {/* Header and Actions */}
      <div className="platform-header-row">
        <div>
          <h2 className="platform-title">Contabilidade & Conciliação Financeira</h2>
          <p className="platform-subtitle">
            DRE executiva, contas a receber, gestão de despesas operacionais, compras de estoque e conciliação de caixa.
          </p>
        </div>

        <div className="platform-header-actions">
          <button
            className="btn-platform-secondary"
            onClick={handleExportFullAccounting}
          >
            <FileSpreadsheet size={15} /> Exportar Relatório Contábil
          </button>
          <button
            className="btn-platform-entrada"
            onClick={() => openNewMov('entrada')}
            title="Registrar nova entrada de dinheiro ou receita avulsa"
          >
            <ArrowDownRight size={15} /> + Nova Entrada
          </button>
          <button
            className="btn-platform-saida"
            onClick={() => openNewMov('saida')}
            title="Registrar nova saída / despesa operacional"
          >
            <ArrowUpRight size={15} /> + Nova Saída
          </button>
        </div>
      </div>

      {/* Financial KPIs Grid (Clean Dark SaaS) */}
      <div className="metrics-clean-grid">
        <div className="metric-clean-card">
          <span className="card-lbl">Caixa Recebido (Realizado)</span>
          <strong className="card-val green">{formatMoney(accounting.caixaRecebido)}</strong>
          <small className="card-hint">Total já pago por clientes</small>
        </div>

        <div className="metric-clean-card">
          <span className="card-lbl">Contas a Receber (Pendente)</span>
          <strong className="card-val gold">{formatMoney(accounting.contasAReceber)}</strong>
          <small className="card-hint">
            {accounting.contasEmAtraso > 0 ? `${formatMoney(accounting.contasEmAtraso)} em atraso` : 'Sem atrasos'}
          </small>
        </div>

        <div className="metric-clean-card">
          <span className="card-lbl">Despesas Operacionais Pagas</span>
          <strong className="card-val" style={{ color: '#f43f5e' }}>
            - {formatMoney(accounting.despesasPagas)}
          </strong>
          <small className="card-hint">{formatMoney(accounting.despesasAPagar)} a pagar</small>
        </div>

        <div className="metric-clean-card">
          <span className="card-lbl">LUCRO LÍQUIDO REALIZADO</span>
          <strong className="card-val" style={{ color: '#38bdf8' }}>
            +{formatMoney(accounting.lucroLiquidoRealizado)}
          </strong>
          <small className="card-hint">
            Margem Líquida Real: {accounting.margemLiquidaRealizada.toFixed(0)}%
          </small>
        </div>
      </div>

      {/* Internal Sub-Tabs Navigation */}
      <div className="orders-pipeline-pills">
        <button
          className={`pipeline-pill-btn ${finSubTab === 'dre' ? 'active' : ''}`}
          onClick={() => setFinSubTab('dre')}
        >
          <TrendingUp size={14} />
          <span>DRE & Fluxo de Caixa</span>
        </button>

        <button
          className={`pipeline-pill-btn ${finSubTab === 'receber' ? 'active' : ''}`}
          onClick={() => setFinSubTab('receber')}
        >
          <DollarSign size={14} />
          <span>Contas a Receber (Vendas)</span>
          {accounting.contasAReceber > 0 && (
            <span className="pill-badge-num">{salesRecords.filter((s) => !s.isPago).length}</span>
          )}
        </button>

        <button
          className={`pipeline-pill-btn ${finSubTab === 'despesas' ? 'active' : ''}`}
          onClick={() => setFinSubTab('despesas')}
        >
          <Receipt size={14} />
          <span>Movimentações (Entradas & Saídas)</span>
          <span className="pill-badge-num">{expenses.length}</span>
        </button>

        <button
          className={`pipeline-pill-btn ${finSubTab === 'estoque_compras' ? 'active' : ''}`}
          onClick={() => setFinSubTab('estoque_compras')}
        >
          <Package size={14} />
          <span>Estoque & Compras de Fornecedores</span>
        </button>
      </div>

      {/* TAB 1: DRE & FLUXO DE CAIXA GERAL */}
      {finSubTab === 'dre' && (
        <div className="admin-tab-pane" style={{ padding: 0 }}>
          <div className="dre-container-grid">
            {/* DRE Demonstrativo */}
            <div className="dre-card-table">
              <div className="dre-card-header">
                <h3>Demonstrativo de Resultados do Exercício (DRE)</h3>
                <span className="dre-badge">Regime de Competência e Caixa</span>
              </div>

              <div className="dre-lines-list">
                <div className="dre-line-item positive">
                  <span className="line-label">(+) Receita Bruta Total das Vendas</span>
                  <strong className="line-val">{formatMoney(accounting.receitaBrutaTotal)}</strong>
                </div>

                <div className="dre-line-item neutral indent">
                  <span className="line-label">↳ Efetivamente Recebido em Caixa</span>
                  <span className="line-val">{formatMoney(accounting.caixaRecebido)}</span>
                </div>

                <div className="dre-line-item neutral indent">
                  <span className="line-label">↳ A Receber (Vendas a Prazo / Pendentes)</span>
                  <span className="line-val">{formatMoney(accounting.contasAReceber)}</span>
                </div>

                <div className="dre-line-item negative">
                  <span className="line-label">(-) Custo das Mercadorias Vendidas (CMV)</span>
                  <strong className="line-val">- {formatMoney(accounting.cmvTotalVendido)}</strong>
                </div>

                <div className="dre-line-item subtotal">
                  <span className="line-label">(=) LUCRO BRUTO OPERACIONAL</span>
                  <strong className="line-val gold">
                    {formatMoney(accounting.receitaBrutaTotal - accounting.cmvTotalVendido)}
                  </strong>
                </div>

                <div className="dre-line-item negative">
                  <span className="line-label">(-) Despesas Operacionais Totais</span>
                  <strong className="line-val">
                    - {formatMoney(accounting.despesasPagas + accounting.despesasAPagar)}
                  </strong>
                </div>

                <div className="dre-line-item neutral indent">
                  <span className="line-label">↳ Despesas Pagas no Período</span>
                  <span className="line-val">- {formatMoney(accounting.despesasPagas)}</span>
                </div>

                <div className="dre-line-item neutral indent">
                  <span className="line-label">↳ Despesas a Pagar (Pendentes)</span>
                  <span className="line-val">- {formatMoney(accounting.despesasAPagar)}</span>
                </div>

                <div className="dre-line-item grand-total">
                  <span className="line-label">(=) LUCRO LÍQUIDO FINAL DO NEGÓCIO</span>
                  <strong className="line-val green">
                    {formatMoney(accounting.lucroLiquidoProjetado)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Balanço Patrimonial & Caixa */}
            <div className="dre-card-table">
              <div className="dre-card-header">
                <h3>Posição de Caixa & Patrimônio</h3>
                <span className="dre-badge">Instantâneo Real</span>
              </div>

              <div className="dre-lines-list">
                <div className="dre-line-item subtotal">
                  <span className="line-label">💰 Saldo Efetivo de Caixa Atual</span>
                  <strong className="line-val green">{formatMoney(accounting.saldoCaixaAtual)}</strong>
                </div>

                <div className="dre-line-item positive">
                  <span className="line-label">📦 Capital Imobilizado em Estoque</span>
                  <strong className="line-val">{formatMoney(accounting.valorEstoqueAtual)}</strong>
                </div>

                <div className="dre-line-item neutral indent">
                  <span className="line-label">↳ Frascos Físicos Disponíveis</span>
                  <span className="line-val">{accounting.frascosEmEstoque} perfumes</span>
                </div>

                <div className="dre-line-item positive">
                  <span className="line-label">⏳ Ativos a Receber de Clientes</span>
                  <strong className="line-val gold">{formatMoney(accounting.contasAReceber)}</strong>
                </div>

                <div className="dre-line-item negative">
                  <span className="line-label">⚠️ Passivos a Pagar (Despesas)</span>
                  <strong className="line-val">- {formatMoney(accounting.despesasAPagar)}</strong>
                </div>

                <div className="dre-line-item grand-total">
                  <span className="line-label">🏆 PATRIMÔNIO LÍQUIDO TOTAL DA LOJA</span>
                  <strong className="line-val gold">
                    {formatMoney(
                      accounting.saldoCaixaAtual +
                        accounting.valorEstoqueAtual +
                        accounting.contasAReceber -
                        accounting.despesasAPagar
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAS A RECEBER (VENDAS / CLIENTES) */}
      {finSubTab === 'receber' && (
        <div className="admin-tab-pane" style={{ padding: 0 }}>
          <div className="orders-search-filter-bar">
            <div className="search-box-clean">
              <Search size={15} />
              <input
                type="text"
                placeholder="Pesquisar por pedido, cliente, telefone..."
                value={receberSearch}
                onChange={(e) => setReceberSearch(e.target.value)}
              />
            </div>

            <div className="category-chips-clean">
              <button
                className={`cat-chip-btn ${receberStatusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setReceberStatusFilter('all')}
              >
                Todos ({salesRecords.length})
              </button>
              <button
                className={`cat-chip-btn ${receberStatusFilter === 'pendente' ? 'active' : ''}`}
                onClick={() => setReceberStatusFilter('pendente')}
              >
                Pendentes
              </button>
              <button
                className={`cat-chip-btn ${receberStatusFilter === 'atrasado' ? 'active' : ''}`}
                onClick={() => setReceberStatusFilter('atrasado')}
              >
                Em Atraso
              </button>
              <button
                className={`cat-chip-btn ${receberStatusFilter === 'pago' ? 'active' : ''}`}
                onClick={() => setReceberStatusFilter('pago')}
              >
                Quitados / Pagos
              </button>
            </div>
          </div>

          <div className="orders-table-container">
            <div className="table-mobile-hint">
              <span>⇄ Deslize horizontalmente para ver valores, CMV, lucros e ações</span>
            </div>
            <table className="orders-platform-table">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Data Venda</th>
                  <th>Vencimento</th>
                  <th>Valor Venda</th>
                  <th>Custo CMV</th>
                  <th>Lucro Líquido</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ações de Baixa</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales
                  .slice((receberCurrentPage - 1) * receberPageSize, receberCurrentPage * receberPageSize)
                  .map((s) => (
                    <tr key={s.orderId}>
                      <td>
                        <button
                          className="btn-order-id-link"
                          onClick={() => onOpenOrderDetail && onOpenOrderDetail(s.order)}
                          title="Ver comanda completa"
                        >
                          #{s.orderId}
                        </button>
                      </td>
                      <td>
                        <div className="client-cell-info">
                          <strong className="client-name-bold">{s.clienteNome}</strong>
                          <span className="client-phone-sub">{s.clienteTel || '-'}</span>
                        </div>
                      </td>
                      <td><span className="date-label">{formatDate(s.dataPedido)}</span></td>
                      <td>
                        <span className={`date-label ${s.isAtrasado ? 'overdue' : ''}`}>
                          {formatDate(s.dataVencimento)}
                          {s.isAtrasado && <small style={{ color: '#f43f5e', display: 'block' }}>Atrasado {s.daysOver}d</small>}
                        </span>
                      </td>
                      <td>
                        <strong className="price-val">{formatMoney(s.totalVenda)}</strong>
                        {s.valorEmAberto > 0 && (
                          <span style={{ color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700, display: 'block' }}>
                            Aberto: {formatMoney(s.valorEmAberto)}
                          </span>
                        )}
                      </td>
                      <td><span style={{ color: '#f59e0b', fontSize: '0.78rem' }}>{formatMoney(s.totalCusto)}</span></td>
                      <td>
                        <span className="profit-micro-tag">
                          +{formatMoney(s.lucro)} ({s.margem.toFixed(0)}%)
                        </span>
                      </td>
                      <td>
                        <span className={`status-pay-badge ${s.status}`}>
                          {s.isPago ? '✓ Quitado' : s.isParcial ? `🟡 Parcial (${formatMoney(s.totalPago)})` : s.isAtrasado ? '⚠️ Atrasado' : '⏳ A Receber'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`btn-baixa-clean ${s.isPago ? 'reopen' : 'pay'}`}
                          onClick={() => onTogglePaymentStatus(s.orderId)}
                          title={s.isPago ? 'Estornar recebimento' : 'Dar baixa como quitado no caixa'}
                        >
                          {s.isPago ? (
                            <>
                              <RotateCcw size={13} /> Estornar
                            </>
                          ) : (
                            <>
                              <Check size={13} /> Dar Baixa
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-table-cell">
                      <div className="empty-state-wrap">
                        <DollarSign size={28} opacity={0.3} />
                        <p>Nenhuma venda encontrada com os filtros selecionados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredSales.length > 0 && (
            <Pagination
              currentPage={receberCurrentPage}
              totalItems={filteredSales.length}
              pageSize={receberPageSize}
              onPageChange={setReceberCurrentPage}
              onPageSizeChange={setReceberPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </div>
      )}

      {/* TAB 3: MOVIMENTAÇÕES (ENTRADAS & SAÍDAS) */}
      {finSubTab === 'despesas' && (
        <div className="admin-tab-pane" style={{ padding: 0 }}>
          <div className="orders-search-filter-bar">
            <div className="search-box-clean">
              <Search size={15} />
              <input
                type="text"
                placeholder="Pesquisar movimentação por descrição, categoria..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
              />
            </div>

            <div className="category-chips-clean">
              <button
                className={`cat-chip-btn ${expenseFilter === 'all' ? 'active' : ''}`}
                onClick={() => setExpenseFilter('all')}
              >
                Todas ({expenses.length})
              </button>
              <button
                className={`cat-chip-btn ${expenseFilter === 'entradas' ? 'active' : ''}`}
                onClick={() => setExpenseFilter('entradas')}
              >
                🟢 Entradas ({expenses.filter((e) => e.tipo === 'entrada').length})
              </button>
              <button
                className={`cat-chip-btn ${expenseFilter === 'saidas' ? 'active' : ''}`}
                onClick={() => setExpenseFilter('saidas')}
              >
                🔴 Saídas ({expenses.filter((e) => e.tipo !== 'entrada').length})
              </button>
              <button
                className={`cat-chip-btn ${expenseFilter === 'pendente' ? 'active' : ''}`}
                onClick={() => setExpenseFilter('pendente')}
              >
                ⏳ Pendentes ({expenses.filter((e) => e.status !== 'pago').length})
              </button>
              <button
                className={`cat-chip-btn ${expenseFilter === 'pago' ? 'active' : ''}`}
                onClick={() => setExpenseFilter('pago')}
              >
                ✓ Concluídas / Pagas ({expenses.filter((e) => e.status === 'pago').length})
              </button>
            </div>
          </div>

          <div className="orders-table-container">
            <div className="table-mobile-hint">
              <span>⇄ Deslize horizontalmente para ver descrição, vencimentos e status</span>
            </div>
            <table className="orders-platform-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Tipo</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data Registro</th>
                  <th>Vencimento</th>
                  <th>Valor (R$)</th>
                  <th>Forma</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses
                  .slice((expenseCurrentPage - 1) * expensePageSize, expenseCurrentPage * expensePageSize)
                  .map((e) => {
                  const isEntrada = e.tipo === 'entrada';
                  const isPago = e.status === 'pago';
                  return (
                    <tr key={e.id}>
                      <td>
                        <span className={`badge-tipo-mov ${isEntrada ? 'entrada' : 'saida'}`}>
                          {isEntrada ? '+ Entrada' : '- Saída'}
                        </span>
                      </td>
                      <td>
                        <strong className="client-name-bold">{e.descricao}</strong>
                        {e.observacao && <span className="client-phone-sub">{e.observacao}</span>}
                      </td>
                      <td>
                        <span className="code-pill">{e.categoria}</span>
                      </td>
                      <td><span className="date-label">{formatDate(e.data)}</span></td>
                      <td><span className="date-label">{formatDate(e.dataVencimento)}</span></td>
                      <td>
                        <strong className="price-val" style={{ color: isEntrada ? '#10b981' : '#f43f5e' }}>
                          {isEntrada ? '+' : '-'} {formatMoney(e.valor)}
                        </strong>
                      </td>
                      <td><span className="date-label" style={{ textTransform: 'uppercase' }}>{e.formaPagamento}</span></td>
                      <td>
                        <span className={`status-pay-badge ${isPago ? 'pago' : 'pendente'}`}>
                          {isPago ? (isEntrada ? '✓ Recebido' : '✓ Paga') : (isEntrada ? '⏳ A Receber' : '⏳ A Pagar')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-actions-row">
                          <button
                            type="button"
                            className={`btn-baixa-clean ${isPago ? 'reopen' : 'pay'}`}
                            onClick={() => onToggleExpenseStatus(e.id)}
                            title={isPago ? 'Reabrir como pendente' : (isEntrada ? 'Confirmar recebimento' : 'Marcar como Paga')}
                          >
                            {isPago ? <RotateCcw size={13} /> : <Check size={13} />}
                            {isPago ? 'Reabrir' : (isEntrada ? 'Receber' : 'Pagar')}
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => {
                              if (window.confirm(`Excluir ${isEntrada ? 'a entrada' : 'a despesa'} "${e.descricao}"?`)) {
                                onDeleteExpense(e.id);
                              }
                            }}
                            title={`Excluir ${isEntrada ? 'entrada' : 'despesa'}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      <div className="empty-state-wrap">
                        <Receipt size={28} opacity={0.3} />
                        <p>Nenhuma despesa registrada com os filtros atuais.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length > 0 && (
            <Pagination
              currentPage={expenseCurrentPage}
              totalItems={filteredExpenses.length}
              pageSize={expensePageSize}
              onPageChange={setExpenseCurrentPage}
              onPageSizeChange={setExpensePageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </div>
      )}

      {/* TAB 4: ESTOQUE & COMPRAS DE FORNECEDORES */}
      {finSubTab === 'estoque_compras' && (
        <div className="admin-tab-pane" style={{ padding: 0 }}>
          <div className="pane-header-row" style={{ marginBottom: '1rem' }}>
            <div>
              <h3>Histórico de Compras de Estoque & Reposições</h3>
              <p>Registro de notas de compra com fornecedores e reposições de mercadorias.</p>
            </div>
            <button
              className="btn-platform-primary"
              onClick={() => setShowAddPurchaseModal(true)}
            >
              <Plus size={15} /> Registrar Nova Compra
            </button>
          </div>

          <div className="orders-table-container">
            <div className="table-mobile-hint">
              <span>⇄ Deslize horizontalmente para ver fornecedores, notas e custos</span>
            </div>
            <table className="orders-platform-table">
              <thead>
                <tr>
                  <th>ID Compra</th>
                  <th>Fornecedor / Distribuidora</th>
                  <th>Nota Fiscal</th>
                  <th>Data Compra</th>
                  <th>Frascos Comprados</th>
                  <th>Custo Médio / Frasco</th>
                  <th>Valor Total (R$)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {stockPurchases.map((p) => {
                  const custoMedio = p.qtdFrascos > 0 ? p.valorTotal / p.qtdFrascos : 0;
                  return (
                    <tr key={p.id}>
                      <td><strong>#{p.id}</strong></td>
                      <td>
                        <strong className="client-name-bold">{p.fornecedor}</strong>
                        {p.observacao && <span className="client-phone-sub">{p.observacao}</span>}
                      </td>
                      <td><span className="code-pill">{p.nf}</span></td>
                      <td><span className="date-label">{formatDate(p.data)}</span></td>
                      <td><span className="items-qty-tag">{p.qtdFrascos} un</span></td>
                      <td><span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>{formatMoney(custoMedio)}</span></td>
                      <td><strong className="price-val" style={{ color: '#fff' }}>{formatMoney(p.valorTotal)}</strong></td>
                      <td>
                        <span className="status-pay-badge pago">✓ Paga</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action-icon delete"
                          onClick={() => {
                            if (window.confirm(`Deseja remover o registro de compra #${p.id}?`)) {
                              onDeleteStockPurchase(p.id);
                            }
                          }}
                          title="Remover registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP MODAL: NOVA ENTRADA OU SAÍDA */}
      {showAddExpenseModal && (
        <div className="admin-overlay" onClick={() => setShowAddExpenseModal(false)}>
          <div className="expense-modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="add-order-header-clean">
              <div className="header-badge-title">
                <div
                  className="order-icon-badge"
                  style={{
                    background: movTipo === 'entrada' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: movTipo === 'entrada' ? '#10b981' : '#f43f5e'
                  }}
                >
                  {movTipo === 'entrada' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <h3>{movTipo === 'entrada' ? 'Nova Entrada Financeira' : 'Nova Saída (Despesa Manual)'}</h3>
                  <p className="order-subtitle">
                    {movTipo === 'entrada'
                      ? 'Lançamento de receitas avulsas, aportes e recebimentos'
                      : 'Custos operacionais, fretes, embalagens e despesas'}
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowAddExpenseModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div className="add-order-body-clean">
                {/* Tipo de Movimentação Toggle */}
                <div className="mov-type-toggle">
                  <button
                    type="button"
                    className={`btn-mov-toggle entrada ${movTipo === 'entrada' ? 'active' : ''}`}
                    onClick={() => {
                      setMovTipo('entrada');
                      setNovaDespCategoria(CATEGORIAS_ENTRADA[0]);
                    }}
                  >
                    <ArrowDownRight size={15} /> + Entrada (Receita / Aporte)
                  </button>
                  <button
                    type="button"
                    className={`btn-mov-toggle saida ${movTipo === 'saida' ? 'active' : ''}`}
                    onClick={() => {
                      setMovTipo('saida');
                      setNovaDespCategoria(CATEGORIAS_SAIDA[0]);
                    }}
                  >
                    <ArrowUpRight size={15} /> - Saída (Despesa / Custo)
                  </button>
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">
                    {movTipo === 'entrada' ? 'Descrição da Entrada *' : 'Descrição da Despesa *'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      movTipo === 'entrada'
                        ? 'Ex: Venda avulsa balcão, Aporte sócio, Recebimento PIX...'
                        : 'Ex: Sacolas personalizadas, Frete motoboy centro, etc.'
                    }
                    value={novaDespDescricao}
                    onChange={(e) => setNovaDespDescricao(e.target.value)}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="form-clean-grid two">
                  <div className="form-group-clean">
                    <label className="field-label-clean">Categoria</label>
                    <select
                      value={novaDespCategoria}
                      onChange={(e) => setNovaDespCategoria(e.target.value)}
                      className="admin-form-select"
                    >
                      {(movTipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">
                      {movTipo === 'entrada' ? 'Valor da Entrada (R$) *' : 'Valor da Despesa (R$) *'}
                    </label>
                    <div className={`input-money-clean ${movTipo === 'entrada' ? 'price' : 'cost'}`}>
                      <span>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={novaDespValor}
                        onChange={(e) => setNovaDespValor(e.target.value)}
                        className="admin-form-input money"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-clean-grid two">
                  <div className="form-group-clean">
                    <label className="field-label-clean">
                      {movTipo === 'entrada' ? 'Data da Entrada' : 'Data da Despesa'}
                    </label>
                    <input
                      type="date"
                      value={novaDespData}
                      onChange={(e) => setNovaDespData(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Data de Vencimento</label>
                    <input
                      type="date"
                      value={novaDespVencimento}
                      onChange={(e) => setNovaDespVencimento(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="form-clean-grid two">
                  <div className="form-group-clean">
                    <label className="field-label-clean">Forma de Pagamento</label>
                    <select
                      value={novaDespForma}
                      onChange={(e) => setNovaDespForma(e.target.value)}
                      className="admin-form-select"
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão de Crédito</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Status</label>
                    <select
                      value={novaDespStatus}
                      onChange={(e) => setNovaDespStatus(e.target.value)}
                      className="admin-form-select"
                    >
                      <option value="pago">
                        {movTipo === 'entrada' ? '✓ Recebido (Entra no Caixa Agora)' : '✓ Paga (Abater do Caixa Agora)'}
                      </option>
                      <option value="pendente">
                        {movTipo === 'entrada' ? '⏳ Pendente (A Receber)' : '⏳ Pendente (A Pagar)'}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">Observações</label>
                  <input
                    type="text"
                    placeholder="Informações adicionais..."
                    value={novaDespObs}
                    onChange={(e) => setNovaDespObs(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="add-order-footer-clean">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddExpenseModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  style={{
                    background: movTipo === 'entrada' ? '#10b981' : '#f43f5e',
                    color: movTipo === 'entrada' ? '#09090b' : '#fff'
                  }}
                >
                  <Check size={16} /> Salvar {movTipo === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: REGISTRAR COMPRA DE ESTOQUE */}
      {showAddPurchaseModal && (
        <div className="admin-overlay" onClick={() => setShowAddPurchaseModal(false)}>
          <div className="expense-modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="add-order-header-clean">
              <div className="header-badge-title">
                <div className="order-icon-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3>Registrar Compra de Estoque</h3>
                  <p className="order-subtitle">Entrada de mercadorias e reposição com fornecedor</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowAddPurchaseModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase}>
              <div className="add-order-body-clean">
                <div className="form-group-clean">
                  <label className="field-label-clean">Fornecedor / Distribuidora *</label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora Oficial SP / Importadora BH"
                    value={novaCompraFornecedor}
                    onChange={(e) => setNovaCompraFornecedor(e.target.value)}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="form-clean-grid two">
                  <div className="form-group-clean">
                    <label className="field-label-clean">Número da Nota Fiscal (NF-e)</label>
                    <input
                      type="text"
                      placeholder="NF-e 102941"
                      value={novaCompraNF}
                      onChange={(e) => setNovaCompraNF(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Quantidade de Frascos</label>
                    <input
                      type="number"
                      min="1"
                      value={novaCompraQtd}
                      onChange={(e) => setNovaCompraQtd(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-clean-grid two">
                  <div className="form-group-clean">
                    <label className="field-label-clean">Valor Total da Nota (R$) *</label>
                    <div className="input-money-clean cost">
                      <span>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={novaCompraValor}
                        onChange={(e) => setNovaCompraValor(e.target.value)}
                        className="admin-form-input money"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Data da Compra</label>
                    <input
                      type="date"
                      value={novaCompraData}
                      onChange={(e) => setNovaCompraData(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="form-clean-grid two">
                  <div className="form-group-clean">
                    <label className="field-label-clean">Forma de Pagamento</label>
                    <select
                      value={novaCompraForma}
                      onChange={(e) => setNovaCompraForma(e.target.value)}
                      className="admin-form-select"
                    >
                      <option value="boleto">Boleto Bancário</option>
                      <option value="pix">PIX</option>
                      <option value="cartao">Cartão</option>
                      <option value="transferencia">Transferência Bancária</option>
                    </select>
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Status da Compra</label>
                    <select
                      value={novaCompraStatus}
                      onChange={(e) => setNovaCompraStatus(e.target.value)}
                      className="admin-form-select"
                    >
                      <option value="pago">✓ Paga (Liquidada)</option>
                      <option value="pendente">⏳ A Pagar (Faturado / Prazo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="add-order-footer-clean">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddPurchaseModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-submit">
                  <Check size={16} /> Salvar Compra de Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
