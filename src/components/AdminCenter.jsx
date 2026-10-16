import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Search,
  X,
  Check,
  RotateCcw,
  Download,
  Share2,
  Sliders,
  Save,
  Percent,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  MessageCircle,
  ExternalLink,
  Info,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Plus,
  LayoutDashboard,
  ClipboardList,
  Tags,
  Coins,
  ArrowLeft,
  Building2,
  Users,
  Edit,
  Handshake,
  Megaphone,
  Smartphone,
  FileText,
  AlertTriangle,
  Truck,
  Eye,
  ArrowRight,
  ArrowUpRight,
  Menu
} from 'lucide-react';
import { CATALOG_DATA as ORIGINAL_DATA } from '../data/catalogData';
import OrdersManager from './OrdersManager';
import AccountingManager from './AccountingManager';
import AddOrderModal from './AddOrderModal';
import OrderDetailModal from './OrderDetailModal';
import AcertoModal from './AcertoModal';
import SupplierStockModal from './SupplierStockModal';
import ProductsAndSuppliersManager from './ProductsAndSuppliersManager';
import CopyboardManager from './CopyboardManager';
import StoryGallery from './StoryGallery';
import PdfCatalogViewer from './PdfCatalogViewer';

export const getOrderTotal = (o) => {
  if (!o) return 0;
  if (o.totais?.valorTotal !== undefined && o.totais?.valorTotal !== null) return Number(o.totais.valorTotal);
  if (o.totalCobrar !== undefined && o.totalCobrar !== null) return Number(o.totalCobrar);
  if (o.total !== undefined && o.total !== null) return Number(o.total);
  if (o.financeiro?.valorTotal !== undefined && o.financeiro?.valorTotal !== null) return Number(o.financeiro.valorTotal);
  if (o.financeiro?.totalVenda !== undefined && o.financeiro?.totalVenda !== null) return Number(o.financeiro.totalVenda);
  if (Array.isArray(o.itens) && o.itens.length > 0) {
    return o.itens.reduce((s, i) => s + ((Number(i.precoVenda || i.preco || 0)) * (Number(i.qtd || i.qty || 1))), 0);
  }
  return 0;
};

export const getOrderQty = (o) => {
  if (!o) return 0;
  if (o.totais?.qtdItens !== undefined && o.totais?.qtdItens !== null) return Number(o.totais.qtdItens);
  if (Array.isArray(o.itens)) return o.itens.reduce((s, i) => s + Number(i.qtd || i.qty || 0), 0);
  if (Array.isArray(o.items)) return o.items.reduce((s, i) => s + Number(i.qtd || i.qty || 0), 0);
  return 0;
};

export const getOrderPaid = (o) => {
  if (!o) return 0;
  if (o.totalPago !== undefined && o.totalPago !== null) return Number(o.totalPago);
  if (o.financeiro?.valorRecebido !== undefined && o.financeiro?.valorRecebido !== null) return Number(o.financeiro.valorRecebido);
  if (o.financeiro?.statusPagamento === 'pago') return getOrderTotal(o);
  return 0;
};

export const getOrderAberto = (o) => {
  if (!o || o.status === 'cancelado') return 0;
  if (o.valorEmAberto !== undefined && o.valorEmAberto !== null) return Number(o.valorEmAberto);
  if (o.financeiro?.valorEmAberto !== undefined && o.financeiro?.valorEmAberto !== null) return Number(o.financeiro.valorEmAberto);
  const total = getOrderTotal(o);
  const paid = getOrderPaid(o);
  return Math.max(0, Math.round((total - paid) * 100) / 100);
};

export default function AdminCenter({
  products,
  orders = [],
  expenses = [],
  stockPurchases = [],
  suppliers = [],
  onUpdateProduct,
  onBatchUpdate,
  onResetToDefaults,
  onSaveProduct,
  onDeleteProduct,
  onSaveSupplier,
  onDeleteSupplier,
  onSaveOrder,
  onUpdateOrderStatus,
  onTogglePaymentStatus,
  onDeleteOrder,
  onSaveExpense,
  onDeleteExpense,
  onToggleExpenseStatus,
  onSaveStockPurchase,
  onDeleteStockPurchase,
  onToast,
  onOpenProductModal,
  onBackToCatalog
}) {
  // Navigation sidebar tab: 'dashboard', 'pedidos', 'produtos', 'contabilidade'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [activeDetailOrder, setActiveDetailOrder] = useState(null);
  const [orderDetailMode, setOrderDetailMode] = useState('view'); // 'view' or 'edit'
  const [activeAcertoOrder, setActiveAcertoOrder] = useState(null);
  const [acertoMode, setAcertoMode] = useState('acerto'); // 'acerto' or 'finalizar'
  const [activeSupplierProduct, setActiveSupplierProduct] = useState(null);

  // States for 'produtos' tab
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('all');
  const [prodSort, setProdSort] = useState('itemNum');
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Batch reajuste modal state
  const [batchScope, setBatchScope] = useState('all');
  const [batchTarget, setBatchTarget] = useState('varejo');
  const [batchType, setBatchType] = useState('percent');
  const [batchValue, setBatchValue] = useState(10);
  const [roundDecimals, setRoundDecimals] = useState(true);

  // Currency formatter
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Date formatter
  const formatDate = (str) => {
    if (!str) return '-';
    try {
      const d = new Date(str + (str.length <= 10 ? 'T12:00:00' : ''));
      return d.toLocaleDateString('pt-BR');
    } catch {
      return str;
    }
  };

  // Quick WhatsApp message sender
  const handleQuickWhatsApp = (order) => {
    const fone = (order.cliente?.telefone || '').replace(/\D/g, '');
    if (!fone) {
      onToast && onToast('Cliente sem telefone cadastrado! ⚠️');
      return;
    }
    const cleanFone = fone.startsWith('55') ? fone : `55${fone}`;
    const total = getOrderTotal(order);
    const aberto = getOrderAberto(order);
    const itemsSummary = (order.itens || []).map(i => `• ${i.qtd || 1}x ${i.nome || i.name}`).join('\n');
    let text = `Olá, *${order.cliente?.nome || 'Cliente'}*! Tudo bem? 😊\n\nAqui é da *Snack Store BH* falando sobre o seu pedido *#${order.id?.slice(-6) || order.id}*.\n\n📦 *Itens:*\n${itemsSummary}\n\n💰 *Total:* ${formatMoney(total)}`;
    if (aberto > 0) {
      text += `\n⏳ *Saldo em Aberto:* ${formatMoney(aberto)}`;
    }
    text += `\n🚚 *Status:* ${order.status.toUpperCase()}\n\nQualquer dúvida estamos à disposição! ✨`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanFone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Badges counters
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pendente').length,
    [orders]
  );
  const pendingFinancialCount = useMemo(
    () => orders.filter((o) => o.status !== 'cancelado' && o.financeiro?.statusPagamento === 'pendente').length,
    [orders]
  );

  // Executive Dashboard Calculations & Structured Lists
  const dashboardData = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    let totalRevenue = 0;
    let totalCusto = 0;
    let totalPaid = 0;
    let totalAberto = 0;
    
    orders.forEach((o) => {
      if (o.status !== 'cancelado') {
        const t = getOrderTotal(o);
        const c = Number(o.totais?.custoTotal ?? o.totalCusto ?? o.financeiro?.totalCusto ?? 0);
        const p = getOrderPaid(o);
        const a = getOrderAberto(o);
        
        totalRevenue += t;
        totalCusto += c;
        totalPaid += p;
        totalAberto += a;
      }
    });
    
    const totalLucro = totalRevenue - totalCusto;
    const margemMedia = totalCusto > 0 ? (totalLucro / totalCusto) * 100 : 0;
    
    // Critical & Low Stock Perfumes (qtdEstoque <= 3)
    const criticalStock = products
      .filter((p) => Number(p.qtdEstoque || 0) <= 3)
      .sort((a, b) => Number(a.qtdEstoque || 0) - Number(b.qtdEstoque || 0));
    
    const outOfStockCount = criticalStock.filter((p) => Number(p.qtdEstoque || 0) === 0).length;
    const lowStockCount = criticalStock.filter((p) => Number(p.qtdEstoque || 0) > 0).length;
    
    // Overdue or upcoming receivables
    const overdueReceivables = orders
      .filter((o) => o.status !== 'cancelado' && getOrderAberto(o) > 0 && o.dataVencimento && o.dataVencimento < todayStr);
    
    const upcomingReceivables = orders
      .filter((o) => o.status !== 'cancelado' && getOrderAberto(o) > 0)
      .sort((a, b) => (a.dataVencimento || '9999').localeCompare(b.dataVencimento || '9999'))
      .slice(0, 6);
      
    // Recent Orders (sorted by date/id descending)
    const recentOrders = [...orders]
      .sort((a, b) => (b.dataPedido || b.criadoEm || '').localeCompare(a.dataPedido || a.criadoEm || ''))
      .slice(0, 8);
      
    // Pipeline counts
    const statusCounts = {
      pendente: orders.filter((o) => o.status === 'pendente').length,
      confirmado: orders.filter((o) => o.status === 'confirmado').length,
      'em-rota': orders.filter((o) => o.status === 'em-rota').length,
      entregue: orders.filter((o) => o.status === 'entregue').length,
      acerto: orders.filter((o) => o.status === 'acerto').length,
      concluido: orders.filter((o) => o.status === 'concluido').length,
      cancelado: orders.filter((o) => o.status === 'cancelado').length,
    };
    
    // Categories summary
    const arabProds = products.filter((p) => p.isArabic);
    const brandProds = products.filter((p) => !p.isArabic);
    
    const arabStock = arabProds.reduce((acc, p) => acc + Number(p.qtdEstoque || 0), 0);
    const arabCusto = arabProds.reduce((acc, p) => acc + (Number(p.precoCompra || 0) * Number(p.qtdEstoque || 0)), 0);
    const arabVenda = arabProds.reduce((acc, p) => acc + (Number(p.precoVarejo || 0) * Number(p.qtdEstoque || 0)), 0);
    
    const brandStock = brandProds.reduce((acc, p) => acc + Number(p.qtdEstoque || 0), 0);
    const brandCusto = brandProds.reduce((acc, p) => acc + (Number(p.precoCompra || 0) * Number(p.qtdEstoque || 0)), 0);
    const brandVenda = brandProds.reduce((acc, p) => acc + (Number(p.precoVarejo || 0) * Number(p.qtdEstoque || 0)), 0);

    return {
      totalRevenue,
      totalCusto,
      totalLucro,
      margemMedia,
      totalPaid,
      totalAberto,
      criticalStock,
      outOfStockCount,
      lowStockCount,
      overdueReceivables,
      upcomingReceivables,
      recentOrders,
      statusCounts,
      arab: { count: arabProds.length, stock: arabStock, custo: arabCusto, venda: arabVenda },
      brand: { count: brandProds.length, stock: brandStock, custo: brandCusto, venda: brandVenda },
    };
  }, [orders, products]);

  // Existing customers for autocomplete
  const existingCustomers = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (o.cliente?.telefone && !map.has(o.cliente.telefone)) {
        map.set(o.cliente.telefone, o.cliente);
      }
    });
    return Array.from(map.values());
  }, [orders]);

  // Clone order handler
  const handleCloneOrder = (order) => {
    const cloned = {
      ...order,
      id: `PED-${Date.now().toString().slice(-6)}`,
      dataPedido: new Date().toISOString().slice(0, 10),
      status: 'pendente',
      financeiro: {
        ...order.financeiro,
        statusPagamento: 'pendente',
        pagoEm: null
      },
      criadoEm: new Date().toISOString()
    };
    onSaveOrder && onSaveOrder(cloned);
    onToast && onToast(`Pedido #${order.id} clonado como #${cloned.id}! 📋✨`);
  };

  // Open Acerto Modal
  const handleOpenAcerto = (order, mode = 'acerto') => {
    setActiveAcertoOrder(order);
    setAcertoMode(mode);
  };

  // Save Acerto logic
  const handleSaveAcerto = (acertoData) => {
    const {
      orderId,
      finalize,
      baseItems,
      remainingItems,
      returnedItems,
      totalCobrar,
      totalPago,
      valorEmAberto,
      totalCusto,
      paymentMethod,
      paymentSplits,
      dataInicio,
      dataVencimento,
      status
    } = acertoData;

    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;

    const safeCobrar = Math.max(0, Math.round(Number(totalCobrar || 0) * 100) / 100);
    const safePago = Math.max(0, Math.round(Number(totalPago || 0) * 100) / 100);
    const safeAberto = Math.max(0, Math.round((safeCobrar - safePago) * 100) / 100);

    const updated = {
      ...existing,
      status: status || (finalize ? 'concluido' : 'acerto'),
      originalItems: baseItems,
      itens: remainingItems,
      returnedItems,
      totais: {
        ...existing.totais,
        valorTotal: safeCobrar,
        custoTotal: totalCusto,
        lucroBruto: safeCobrar - totalCusto,
        margemLucro: totalCusto > 0 ? ((safeCobrar - totalCusto) / totalCusto) * 100 : 0
      },
      totalCobrar: safeCobrar,
      totalPago: safePago,
      valorEmAberto: safeAberto,
      paymentSplits: paymentSplits || existing.paymentSplits || {},
      financeiro: {
        ...existing.financeiro,
        statusPagamento: safeAberto === 0 ? 'pago' : 'pendente',
        valorTotal: safeCobrar,
        valorRecebido: safePago,
        valorEmAberto: safeAberto,
        pagoEm: safeAberto === 0 ? new Date().toISOString() : null,
        splits: paymentSplits || existing.financeiro?.splits || {}
      },
      dataVencimento: dataVencimento || existing.dataVencimento,
      formaPagamento: paymentMethod || existing.formaPagamento,
      acertoRealizadoEm: new Date().toISOString()
    };

    onSaveOrder && onSaveOrder(updated);
    onToast &&
      onToast(
        finalize
          ? `Pedido #${orderId} finalizado e registrado! ${safeAberto > 0 ? `(Saldo em aberto: R$ ${safeAberto.toFixed(2)})` : '✅ Quitado 100%!'}`
          : `Acerto do pedido #${orderId} salvo com sucesso! 🤝`
      );
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = prodSearch.toLowerCase().trim();
    return products.filter((p) => {
      if (prodCategory === 'arab' && !p.isArabic) return false;
      if (prodCategory === 'brand' && p.isArabic) return false;
      if (!q) return true;
      const matchName = p.name?.toLowerCase().includes(q) || p.cleanName?.toLowerCase().includes(q);
      const matchCod = p.cod?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      const matchRef = p.ref?.toLowerCase().includes(q);
      return matchName || matchCod || matchRef;
    });
  }, [products, prodSearch, prodCategory]);

  // Overall Catalog Statistics
  const catalogStats = useMemo(() => {
    let totalEstoque = 0;
    let totalCustoEstoque = 0;
    let totalVendaAtacadoEstoque = 0;
    let totalVendaVarejoEstoque = 0;

    products.forEach((p) => {
      const qtd = Number(p.qtdEstoque || 0);
      const custo = Number(p.precoCompra || 0);
      const atc = Number(p.precoAtacado || 0);
      const varj = Number(p.precoVarejo || 0);

      totalEstoque += qtd;
      totalCustoEstoque += custo * qtd;
      totalVendaAtacadoEstoque += atc * qtd;
      totalVendaVarejoEstoque += varj * qtd;
    });

    const lucroPotencialVarejo = totalVendaVarejoEstoque - totalCustoEstoque;
    const margemMediaVarejo =
      totalCustoEstoque > 0 ? (lucroPotencialVarejo / totalCustoEstoque) * 100 : 0;

    return {
      totalItens: products.length,
      totalEstoque,
      totalCustoEstoque,
      totalVendaAtacadoEstoque,
      totalVendaVarejoEstoque,
      lucroPotencialVarejo,
      margemMediaVarejo
    };
  }, [products]);

  // Batch reajuste execution
  const handleApplyBatchReajuste = () => {
    const val = parseFloat(batchValue);
    if (isNaN(val) || val === 0) {
      alert('Informe um valor de reajuste válido!');
      return;
    }

    const updated = products.map((prod) => {
      if (batchScope === 'arab' && !prod.isArabic) return prod;
      if (batchScope === 'brand' && prod.isArabic) return prod;

      const currentVal =
        batchTarget === 'varejo'
          ? Number(prod.precoVarejo)
          : batchTarget === 'atacado'
          ? Number(prod.precoAtacado)
          : Number(prod.precoCompra);

      let newVal = currentVal;
      if (batchType === 'percent') {
        newVal = currentVal * (1 + val / 100);
      } else {
        newVal = currentVal + val;
      }

      if (roundDecimals) {
        newVal = Math.round(newVal * 100) / 100;
      }

      if (batchTarget === 'varejo') return { ...prod, precoVarejo: newVal };
      if (batchTarget === 'atacado') return { ...prod, precoAtacado: newVal };
      return { ...prod, precoCompra: newVal };
    });

    onBatchUpdate && onBatchUpdate(updated);
    setShowBatchModal(false);
    onToast && onToast('Reajuste de preços aplicado com sucesso! 🏷️✨');
  };

  // Export to Excel
  const handleExportCatalogExcel = () => {
    const rows = products.map((p, idx) => ({
      'Item': idx + 1,
      'Código': p.cod || p.sku,
      'Perfume': p.cleanName || p.name,
      'Inspiração Olfativa': p.ref || '',
      'Categoria': p.isArabic ? 'Árabe' : 'Brand',
      'Volume': p.volume || '100ml',
      'Estoque Próprio (un)': p.estoqueProprio !== undefined ? p.estoqueProprio : p.qtdEstoque,
      'Custo Compra (R$)': Number(p.precoCompra || 0),
      'Preço Atacado (R$)': Number(p.precoAtacado || 0),
      'Preço Varejo (R$)': Number(p.precoVarejo || 0),
      'Lucro Varejo (R$)': Number(p.precoVarejo || 0) - Number(p.precoCompra || 0),
      'Margem Varejo (%)': Number(p.precoCompra) > 0 ? (((Number(p.precoVarejo) - Number(p.precoCompra)) / Number(p.precoCompra)) * 100).toFixed(1) + '%' : '0%'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo & Custos');
    XLSX.writeFile(wb, `SnackStoreBH_CatalogoCustos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onToast && onToast('Planilha Excel gerada e baixada com sucesso! 📊📥');
  };

  return (
    <div className="admin-clean-shell">
      {/* MOBILE TOPBAR (Style Modern Mobile App Header - Visible on <= 1024px) */}
      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-topbar-brand">
          <div className="brand-logo-icon mini">
            <Sparkles size={15} color="#10b981" />
          </div>
          <div className="mobile-topbar-title-wrap">
            <strong>Snack Store BH</strong>
            <span className="mobile-active-tab-pill">{activeTab.toUpperCase()}</span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-quick-order-btn"
          onClick={() => setShowAddOrderModal(true)}
          title="Criar Novo Pedido"
        >
          <Plus size={16} />
          <span>Pedido</span>
        </button>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR CLEAN (STYLE OPENAI CHATGPT PLATFORM / RESPONSIVE DRAWER) */}
      <aside className={`admin-clean-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Logo and Brand */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-icon">
            <Sparkles size={18} color="#10b981" />
          </div>
          <div className="brand-text">
            <strong>Snack Store BH</strong>
            <span>Admin Platform</span>
          </div>
          {/* Close button inside mobile drawer */}
          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar gaveta de menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav-list">
          <div className="sidebar-section-label">OPERAÇÃO & GESTÃO</div>

          <button
            className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pedidos');
              setMobileMenuOpen(false);
            }}
          >
            <ClipboardList size={17} />
            <span>Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="sidebar-count-badge">{pendingOrdersCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-btn ${activeTab === 'produtos' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('produtos');
              setMobileMenuOpen(false);
            }}
          >
            <Tags size={17} />
            <span>Produtos & Estoque</span>
            <span className="sidebar-count-badge neutral">{products.length}</span>
          </button>

          <button
            className={`sidebar-nav-btn ${activeTab === 'contabilidade' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('contabilidade');
              setMobileMenuOpen(false);
            }}
          >
            <Coins size={17} />
            <span>Contabilidade & Caixa</span>
            {pendingFinancialCount > 0 && (
              <span className="sidebar-count-badge warn">{pendingFinancialCount}</span>
            )}
          </button>

          <div className="sidebar-section-label" style={{ marginTop: '14px' }}>CATÁLOGO & ANÚNCIOS</div>

          <button
            className={`sidebar-nav-btn ${activeTab === 'copyboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('copyboard');
              setMobileMenuOpen(false);
            }}
          >
            <Megaphone size={17} />
            <span>Central de Anúncios</span>
            <span className="sidebar-count-badge promo">Copy</span>
          </button>

          <button
            className={`sidebar-nav-btn ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('stories');
              setMobileMenuOpen(false);
            }}
          >
            <Smartphone size={17} />
            <span>Stories 1080×1920</span>
            <span className="sidebar-count-badge neutral">51</span>
          </button>

          <button
            className={`sidebar-nav-btn ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pdf');
              setMobileMenuOpen(false);
            }}
          >
            <FileText size={17} />
            <span>Catálogo PDF (16:9)</span>
          </button>
        </nav>

        {/* Sidebar Footer - Clean SaaS Platform Status */}
        <div className="sidebar-footer-box">
          <div className="sidebar-platform-status">
            <span className="platform-status-dot"></span>
            <div className="platform-status-info">
              <span className="platform-status-title">Snack Store Platform</span>
              <span className="platform-status-sub">SaaS Operacional • Ativo</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-clean-main">
        {/* SUB-TAB: DASHBOARD EXECUTIVO SNACK STORE BH */}
        {activeTab === 'dashboard' && (
          <div className="admin-tab-pane">
            {/* Header com Status Operacional e Botão de Novo Pedido */}
            <div className="pane-header-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2>Painel Executivo Snack Store BH</h2>
                  <span className="live-status-badge">
                    <span className="live-dot"></span> Operação Ativa
                  </span>
                </div>
                <p>Visão geral consolidada em tempo real com ações rápidas e alertas prioritários.</p>
              </div>
              <button
                className="btn-platform-primary"
                onClick={() => setShowAddOrderModal(true)}
              >
                <Plus size={16} /> Criar Novo Pedido
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="dash-quick-actions-bar">
              <span className="dash-actions-label">AÇÕES RÁPIDAS:</span>
              <div className="dash-actions-buttons">
                <button
                  className="dash-action-btn primary"
                  onClick={() => setShowAddOrderModal(true)}
                  title="Abrir formulário de criação de novo pedido"
                >
                  <Plus size={15} />
                  <span>Novo Pedido</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => setActiveTab('produtos')}
                  title="Acessar catálogo de produtos e controle de estoque"
                >
                  <Package size={15} />
                  <span>Produtos & Estoque</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => setActiveTab('contabilidade')}
                  title="Acessar controle financeiro, despesas e entradas"
                >
                  <Coins size={15} />
                  <span>Caixa & Contabilidade</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => setActiveTab('copyboard')}
                  title="Central de anúncios com copys persuasivas prontas"
                >
                  <Megaphone size={15} />
                  <span>Central de Anúncios</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => setActiveTab('stories')}
                  title="Visualizar catálogo em stories para Instagram e WhatsApp"
                >
                  <Smartphone size={15} />
                  <span>Stories 1080×1920</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => setActiveTab('pdf')}
                  title="Acessar catálogo widescreen para clientes e TV"
                >
                  <FileText size={15} />
                  <span>Catálogo PDF (16:9)</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => setShowBatchModal(true)}
                  title="Aplicar reajuste de preços em lote percentual ou fixo"
                >
                  <Percent size={15} />
                  <span>Reajuste em Lote</span>
                </button>
                <button
                  className="dash-action-btn"
                  onClick={handleExportCatalogExcel}
                  title="Exportar planilha completa do catálogo para Excel (.xlsx)"
                >
                  <FileSpreadsheet size={15} />
                  <span>Exportar Excel</span>
                </button>
              </div>
            </div>

            {/* Operational Alerts & Notices Banner Grid */}
            <div className="dash-alerts-banner-grid">
              {/* Alerta 1: Estoque Baixo / Crítico */}
              <div className={`dash-alert-card ${dashboardData.criticalStock.length > 0 ? 'alert-danger' : 'alert-ok'}`}>
                <div className="dash-alert-icon-box">
                  <AlertTriangle size={18} />
                </div>
                <div className="dash-alert-content">
                  <div className="dash-alert-title-row">
                    <strong>Estoque Crítico & Reposição</strong>
                    <span className="dash-alert-badge">
                      {dashboardData.criticalStock.length} produtos
                    </span>
                  </div>
                  <p>
                    {dashboardData.criticalStock.length > 0
                      ? `${dashboardData.outOfStockCount} modelos esgotados (0 un) e ${dashboardData.lowStockCount} com estoque baixo (≤3 un).`
                      : 'Todos os produtos estão com níveis saudáveis de estoque.'}
                  </p>
                </div>
                {dashboardData.criticalStock.length > 0 && (
                  <button
                    className="dash-alert-btn"
                    onClick={() => setActiveTab('produtos')}
                  >
                    Repor Estoque →
                  </button>
                )}
              </div>

              {/* Alerta 2: Pedidos Pendentes de Envio */}
              <div className={`dash-alert-card ${dashboardData.statusCounts.pendente > 0 ? 'alert-warning' : 'alert-ok'}`}>
                <div className="dash-alert-icon-box">
                  <Truck size={18} />
                </div>
                <div className="dash-alert-content">
                  <div className="dash-alert-title-row">
                    <strong>Expedição & Despacho</strong>
                    <span className="dash-alert-badge">
                      {dashboardData.statusCounts.pendente} pendentes
                    </span>
                  </div>
                  <p>
                    {dashboardData.statusCounts.pendente > 0
                      ? `${dashboardData.statusCounts.pendente} pedidos aguardando despacho e ${dashboardData.statusCounts['em-rota']} já em rota de entrega.`
                      : 'Nenhum pedido aguardando despacho no momento.'}
                  </p>
                </div>
                <button
                  className="dash-alert-btn"
                  onClick={() => setActiveTab('pedidos')}
                >
                  Ver Pedidos →
                </button>
              </div>

              {/* Alerta 3: Contas a Receber / Cobranças */}
              <div className={`dash-alert-card ${dashboardData.totalAberto > 0 ? 'alert-info' : 'alert-ok'}`}>
                <div className="dash-alert-icon-box">
                  <Coins size={18} />
                </div>
                <div className="dash-alert-content">
                  <div className="dash-alert-title-row">
                    <strong>Cobranças & Saldo em Aberto</strong>
                    <span className="dash-alert-badge gold">
                      {formatMoney(dashboardData.totalAberto)}
                    </span>
                  </div>
                  <p>
                    {dashboardData.overdueReceivables.length > 0
                      ? `⚠️ ${dashboardData.overdueReceivables.length} recebimento(s) com data de vencimento expirada!`
                      : `${dashboardData.upcomingReceivables.length} recebimentos a conciliar nos próximos dias.`}
                  </p>
                </div>
                <button
                  className="dash-alert-btn"
                  onClick={() => setActiveTab('contabilidade')}
                >
                  Conciliação →
                </button>
              </div>
            </div>

            {/* Top KPIs Summary */}
            <div className="metrics-clean-grid">
              <div className="metric-clean-card">
                <div className="card-top-icon-row">
                  <span className="card-lbl">Faturamento Bruto</span>
                  <DollarSign size={16} color="#10b981" />
                </div>
                <strong className="card-val gold">
                  {formatMoney(dashboardData.totalRevenue)}
                </strong>
                <small className="card-hint">
                  {formatMoney(dashboardData.totalPaid)} já recebido • {formatMoney(dashboardData.totalAberto)} em aberto
                </small>
              </div>

              <div className="metric-clean-card">
                <div className="card-top-icon-row">
                  <span className="card-lbl">Lucro Realizado</span>
                  <TrendingUp size={16} color="#38bdf8" />
                </div>
                <strong className="card-val green">
                  +{formatMoney(dashboardData.totalLucro)}
                </strong>
                <small className="card-hint">
                  Margem comercial de {dashboardData.margemMedia.toFixed(0)}% sobre o custo
                </small>
              </div>

              <div className="metric-clean-card">
                <div className="card-top-icon-row">
                  <span className="card-lbl">Pipeline de Pedidos</span>
                  <ClipboardList size={16} color="#a855f7" />
                </div>
                <strong className="card-val">{orders.length} pedidos</strong>
                <small className="card-hint">
                  {dashboardData.statusCounts.pendente} pend • {dashboardData.statusCounts['em-rota']} rota • {dashboardData.statusCounts.concluido} concl
                </small>
              </div>

              <div className="metric-clean-card">
                <div className="card-top-icon-row">
                  <span className="card-lbl">Estoque Geral (Frascos)</span>
                  <Package size={16} color="#f59e0b" />
                </div>
                <strong className="card-val" style={{ color: '#38bdf8' }}>
                  {catalogStats.totalEstoque} un
                </strong>
                <small className="card-hint">
                  CMV: {formatMoney(catalogStats.totalCustoEstoque)} • Varejo: {formatMoney(catalogStats.totalVendaVarejoEstoque)}
                </small>
              </div>
            </div>

            {/* Dual Column Executive SaaS Layout */}
            <div className="dash-two-col-grid">
              {/* LEFT COLUMN: OPERATIONAL ORDERS & RECEIVABLES */}
              <div className="dash-col-primary">
                {/* Recent Active Orders List */}
                <div className="dash-section-panel">
                  <div className="panel-header-clean">
                    <div className="panel-title-group">
                      <ClipboardList size={18} className="panel-icon-gold" />
                      <div>
                        <h3>Últimos Pedidos Movimentados</h3>
                        <span className="panel-subtitle">Acompanhamento em tempo real da carteira de clientes</span>
                      </div>
                    </div>
                    <button
                      className="btn-panel-action"
                      onClick={() => setActiveTab('pedidos')}
                    >
                      Ver todos ({orders.length}) →
                    </button>
                  </div>

                  <div className="dash-orders-list">
                    {dashboardData.recentOrders.map((o) => {
                      const total = getOrderTotal(o);
                      const aberto = getOrderAberto(o);
                      const totalQtd = getOrderQty(o);
                      return (
                        <div key={o.id} className="dash-order-row-card">
                          <div className="order-row-left">
                            <div className="order-id-badge-clean">
                              #{o.id?.slice(-6) || o.id}
                            </div>
                            <div className="order-client-meta">
                              <div className="order-client-name">
                                <strong>{o.cliente?.nome || 'Cliente não identificado'}</strong>
                                {o.cliente?.endereco?.cidade && (
                                  <span className="client-city-tag">
                                    {o.cliente.endereco.cidade}
                                  </span>
                                )}
                              </div>
                              <div className="order-fragrances-sub">
                                <span className="order-date-tag">{formatDate(o.dataPedido)}</span>
                                <span className="dot-sep">•</span>
                                <span>{totalQtd} un</span>
                                {Array.isArray(o.itens) && o.itens.length > 0 && (
                                  <>
                                    <span className="dot-sep">•</span>
                                    <span className="items-names-trunc">
                                      {o.itens.map(i => i.nome || i.name).slice(0, 2).join(', ')}
                                      {o.itens.length > 2 ? ` +${o.itens.length - 2}` : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="order-row-right">
                            <div className="order-values-box">
                              <span className="order-total-val">{formatMoney(total)}</span>
                              {aberto > 0 ? (
                                <span className="order-aberto-pill">
                                  Aberto: {formatMoney(aberto)}
                                </span>
                              ) : (
                                <span className="order-paid-pill">✓ Quitado</span>
                              )}
                            </div>

                            <span className={`order-status-pill status-${o.status}`}>
                              {o.status}
                            </span>

                            <div className="order-row-actions">
                              <button
                                className="btn-action-icon wa"
                                title="Enviar mensagem WhatsApp para o cliente"
                                onClick={() => handleQuickWhatsApp(o)}
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button
                                className="btn-action-icon eye"
                                title="Visualizar detalhes do pedido"
                                onClick={() => {
                                  setActiveDetailOrder(o);
                                  setOrderDetailMode('view');
                                }}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                className="btn-action-icon edit"
                                title="Editar pedido e cliente"
                                onClick={() => {
                                  setActiveDetailOrder(o);
                                  setOrderDetailMode('edit');
                                }}
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {dashboardData.recentOrders.length === 0 && (
                      <div className="dash-empty-state">
                        <ShoppingBag size={32} opacity={0.3} />
                        <p>Nenhum pedido cadastrado ainda. Clique em "Criar Novo Pedido" acima!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Receivables List */}
                <div className="dash-section-panel" style={{ marginTop: '1.25rem' }}>
                  <div className="panel-header-clean">
                    <div className="panel-title-group">
                      <Coins size={18} className="panel-icon-gold" />
                      <div>
                        <h3>Contas a Receber & Cobranças Próximas</h3>
                        <span className="panel-subtitle">Clientes com saldo pendente ou parcial</span>
                      </div>
                    </div>
                    <button
                      className="btn-panel-action"
                      onClick={() => setActiveTab('contabilidade')}
                    >
                      Ir para Contabilidade →
                    </button>
                  </div>

                  <div className="dash-receivables-list">
                    {dashboardData.upcomingReceivables.map((o) => {
                      const aberto = getOrderAberto(o);
                      const isOverdue = o.dataVencimento && o.dataVencimento < new Date().toISOString().slice(0, 10);
                      return (
                        <div key={o.id} className="dash-receivable-item">
                          <div className="rec-info-col">
                            <strong>{o.cliente?.nome || 'Cliente'}</strong>
                            <span className="rec-sub">
                              Pedido #{o.id?.slice(-6) || o.id} • Tel: {o.cliente?.telefone || '-'}
                            </span>
                          </div>
                          <div className="rec-due-col">
                            <span className={`due-date-badge ${isOverdue ? 'overdue' : ''}`}>
                              {isOverdue ? '⚠️ Venceu ' : 'Vence '}
                              {formatDate(o.dataVencimento) || 'Não definido'}
                            </span>
                          </div>
                          <div className="rec-val-col">
                            <strong className="rec-val">{formatMoney(aberto)}</strong>
                          </div>
                          <div className="rec-actions-col">
                            <button
                              className="btn-action-icon wa"
                              title="Cobrança via WhatsApp"
                              onClick={() => handleQuickWhatsApp(o)}
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              className="btn-action-icon confirm"
                              title="Dar baixa como Quitado"
                              onClick={() => onTogglePaymentStatus && onTogglePaymentStatus(o.id)}
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {dashboardData.upcomingReceivables.length === 0 && (
                      <div className="dash-empty-state mini">
                        <CheckCircle2 size={24} color="#10b981" />
                        <p>Parabéns! Todas as contas a receber estão quitadas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: INVENTORY ALERTS & PORTFOLIO */}
              <div className="dash-col-secondary">
                {/* Critical Stock List */}
                <div className="dash-section-panel">
                  <div className="panel-header-clean">
                    <div className="panel-title-group">
                      <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                      <div>
                        <h3>Estoque Crítico (Reposição)</h3>
                        <span className="panel-subtitle">Modelos com estoque zerado ou ≤ 3 unidades</span>
                      </div>
                    </div>
                    <button
                      className="btn-panel-action"
                      onClick={() => setActiveTab('produtos')}
                    >
                      Repor no Estoque →
                    </button>
                  </div>

                  <div className="dash-critical-stock-list">
                    {dashboardData.criticalStock.slice(0, 6).map((p) => {
                      const qtd = Number(p.qtdEstoque || 0);
                      const isZero = qtd === 0;
                      const thumb = p.thumb || p.coverImage || p.images?.[0] || '';
                      const thumbSrc = thumb
                        ? (thumb.startsWith('data:') || thumb.startsWith('http') || thumb.startsWith('blob:')
                            ? thumb
                            : `/${encodeURI(thumb.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}`)
                        : null;
                      return (
                        <div key={p.sku} className="dash-stock-item">
                          <div className="stock-item-thumb-box">
                            {thumbSrc ? (
                              <img src={thumbSrc} alt={p.name} loading="lazy" />
                            ) : (
                              <div className="thumb-placeholder">{p.cod || 'SS'}</div>
                            )}
                          </div>
                          <div className="stock-item-info">
                            <strong>{p.cleanName || p.name}</strong>
                            <span className="stock-item-ref">
                              {p.isArabic ? '🇦🇪 Árabe' : '🇫🇷 Brand'} • Cód: {p.cod || p.sku}
                            </span>
                          </div>
                          <div className="stock-item-stat">
                            <span className={`stock-qty-pill ${isZero ? 'zero' : 'low'}`}>
                              {isZero ? '0 un (Zerado)' : `${qtd} un restante`}
                            </span>
                            <span className="stock-retail-price">
                              {formatMoney(p.precoVarejo)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {dashboardData.criticalStock.length === 0 && (
                      <div className="dash-empty-state mini">
                        <CheckCircle2 size={24} color="#10b981" />
                        <p>Estoque 100% abastecido. Nenhum produto crítico.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Catalog Breakdown by Category */}
                <div className="dash-section-panel" style={{ marginTop: '1.25rem' }}>
                  <div className="panel-header-clean">
                    <div className="panel-title-group">
                      <Layers size={18} className="panel-icon-gold" />
                      <div>
                        <h3>Composição do Catálogo & CMV</h3>
                        <span className="panel-subtitle">Distribuição por linhas e patrimônio em estoque</span>
                      </div>
                    </div>
                  </div>

                  <div className="dash-portfolio-cards">
                    <div className="portfolio-sub-card">
                      <div className="portfolio-card-head">
                        <div className="badge-category-tag arab">🇦🇪 Perfumes Árabes</div>
                        <strong className="portfolio-count">{dashboardData.arab.count} modelos</strong>
                      </div>
                      <div className="portfolio-stats-row">
                        <div>
                          <span className="p-lbl">Frascos em Estoque:</span>
                          <strong className="p-val">{dashboardData.arab.stock} un</strong>
                        </div>
                        <div>
                          <span className="p-lbl">Custo Imobilizado:</span>
                          <strong className="p-val gold">{formatMoney(dashboardData.arab.custo)}</strong>
                        </div>
                        <div>
                          <span className="p-lbl">Potencial de Venda:</span>
                          <strong className="p-val green">{formatMoney(dashboardData.arab.venda)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="portfolio-sub-card">
                      <div className="portfolio-card-head">
                        <div className="badge-category-tag brand">🇫🇷 Brand Collection</div>
                        <strong className="portfolio-count">{dashboardData.brand.count} modelos</strong>
                      </div>
                      <div className="portfolio-stats-row">
                        <div>
                          <span className="p-lbl">Frascos em Estoque:</span>
                          <strong className="p-val">{dashboardData.brand.stock} un</strong>
                        </div>
                        <div>
                          <span className="p-lbl">Custo Imobilizado:</span>
                          <strong className="p-val gold">{formatMoney(dashboardData.brand.custo)}</strong>
                        </div>
                        <div>
                          <span className="p-lbl">Potencial de Venda:</span>
                          <strong className="p-val green">{formatMoney(dashboardData.brand.venda)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fast Access Banners (Sales & Marketing) */}
                <div className="dash-section-panel" style={{ marginTop: '1.25rem' }}>
                  <div className="panel-header-clean">
                    <div className="panel-title-group">
                      <Sparkles size={18} style={{ color: '#f59e0b' }} />
                      <div>
                        <h3>Divulgação & Vendas Rápidas</h3>
                        <span className="panel-subtitle">Ferramentas de conversão de clientes</span>
                      </div>
                    </div>
                  </div>

                  <div className="dash-tools-shortcuts-grid">
                    <div
                      className="dash-tool-item"
                      onClick={() => setActiveTab('pdf')}
                    >
                      <div className="dash-tool-icon pdf">
                        <FileText size={20} />
                      </div>
                      <div className="dash-tool-text">
                        <strong>Catálogo PDF (16:9)</strong>
                        <span>Visualizador e gerador widescreen para envio a clientes</span>
                      </div>
                      <ArrowRight size={16} className="tool-arrow" />
                    </div>

                    <div
                      className="dash-tool-item"
                      onClick={() => setActiveTab('copyboard')}
                    >
                      <div className="dash-tool-icon copy">
                        <Megaphone size={20} />
                      </div>
                      <div className="dash-tool-text">
                        <strong>Central de Anúncios</strong>
                        <span>Copys persuasivas prontas com fotos e download ZIP</span>
                      </div>
                      <ArrowRight size={16} className="tool-arrow" />
                    </div>

                    <div
                      className="dash-tool-item"
                      onClick={() => setActiveTab('stories')}
                    >
                      <div className="dash-tool-icon stories">
                        <Smartphone size={20} />
                      </div>
                      <div className="dash-tool-text">
                        <strong>Stories 1080×1920</strong>
                        <span>51 artes com alta resolução prontas para status/story</span>
                      </div>
                      <ArrowRight size={16} className="tool-arrow" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB: PEDIDOS (EXACT THSM WORKFLOW) */}
        {activeTab === 'pedidos' && (
          <OrdersManager
            orders={orders}
            onOpenNewOrderModal={() => setShowAddOrderModal(true)}
            onOpenOrderDetail={(order, mode = 'view') => {
              setActiveDetailOrder(order);
              setOrderDetailMode(mode);
            }}
            onOpenAcerto={(order, mode) => handleOpenAcerto(order, mode)}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onUpdateOrderDue={(orderId, newDue) => {
              const order = orders.find((o) => o.id === orderId);
              if (order) {
                onSaveOrder({ ...order, dataVencimento: newDue });
                onToast && onToast(`Data de vencimento do pedido #${orderId} atualizada! 📅`);
              }
            }}
            onTogglePaymentStatus={onTogglePaymentStatus}
            onDeleteOrder={onDeleteOrder}
            onCloneOrder={handleCloneOrder}
            onToast={onToast}
          />
        )}

        {/* SUB-TAB: PRODUTOS & FORNECEDORES INTEGRADOS */}
        {activeTab === 'produtos' && (
          <ProductsAndSuppliersManager
            products={products}
            suppliers={suppliers}
            onUpdateProduct={onUpdateProduct}
            onBatchUpdate={onBatchUpdate}
            onResetToDefaults={onResetToDefaults}
            onSaveProduct={onSaveProduct}
            onDeleteProduct={onDeleteProduct}
            onSaveSupplier={onSaveSupplier}
            onDeleteSupplier={onDeleteSupplier}
            onToast={onToast}
          />
        )}

        {/* SUB-TAB: CONTABILIDADE & CONCILIAÇÃO */}
        {activeTab === 'contabilidade' && (
          <AccountingManager
            orders={orders}
            expenses={expenses}
            stockPurchases={stockPurchases}
            products={products}
            onTogglePaymentStatus={onTogglePaymentStatus}
            onSaveExpense={onSaveExpense}
            onDeleteExpense={onDeleteExpense}
            onToggleExpenseStatus={onToggleExpenseStatus}
            onSaveStockPurchase={onSaveStockPurchase}
            onDeleteStockPurchase={onDeleteStockPurchase}
            onOpenOrderDetail={(order) => setActiveDetailOrder(order)}
            onToast={onToast}
          />
        )}

        {/* SUB-TAB: COPYBOARD & CENTRAL DE ANÚNCIOS */}
        {activeTab === 'copyboard' && (
          <CopyboardManager
            products={products}
            onToast={onToast}
            onOpenProductModal={onOpenProductModal}
          />
        )}

        {/* SUB-TAB: STORIES 1080×1920 */}
        {activeTab === 'stories' && (
          <StoryGallery onToast={onToast} />
        )}

        {/* SUB-TAB: CATÁLOGO PDF WIDESCREEN 16:9 */}
        {activeTab === 'pdf' && (
          <PdfCatalogViewer onToast={onToast} />
        )}
      </main>

      {/* MODAL: NOVO PEDIDO */}
      {showAddOrderModal && (
        <AddOrderModal
          products={products}
          suppliers={suppliers}
          customers={existingCustomers}
          onClose={() => setShowAddOrderModal(false)}
          onSaveOrder={(order) => {
            onSaveOrder(order);
            setShowAddOrderModal(false);
          }}
          onToast={onToast}
        />
      )}

      {/* MODAL: DETALHES DO PEDIDO / EDIÇÃO COMPLETA */}
      {activeDetailOrder && (
        <OrderDetailModal
          order={activeDetailOrder}
          initialMode={orderDetailMode}
          products={products}
          suppliers={suppliers}
          onClose={() => setActiveDetailOrder(null)}
          onSaveOrder={(updated) => {
            onSaveOrder && onSaveOrder(updated);
            setActiveDetailOrder(null);
          }}
          onUpdateStatus={(newStatus) => {
            onUpdateOrderStatus(activeDetailOrder.id, newStatus);
            setActiveDetailOrder(null);
          }}
          onTogglePayment={() => {
            onTogglePaymentStatus(activeDetailOrder.id);
            setActiveDetailOrder((prev) => ({
              ...prev,
              financeiro: {
                ...prev.financeiro,
                statusPagamento: prev.financeiro?.statusPagamento === 'pago' ? 'pendente' : 'pago'
              }
            }));
          }}
          onToast={onToast}
        />
      )}

      {/* MODAL: ACERTO DO PEDIDO (CLONE DO THSM) */}
      {activeAcertoOrder && (
        <AcertoModal
          order={activeAcertoOrder}
          mode={acertoMode}
          onClose={() => setActiveAcertoOrder(null)}
          onSaveAcerto={handleSaveAcerto}
          onToast={onToast}
        />
      )}

      {/* MODAL: GESTÃO DE ESTOQUE POR FORNECEDOR */}
      {activeSupplierProduct && (
        <SupplierStockModal
          product={activeSupplierProduct}
          onClose={() => setActiveSupplierProduct(null)}
          onSaveProduct={(sku, updated) => {
            onUpdateProduct(sku, updated);
            setActiveSupplierProduct(null);
          }}
          onToast={onToast}
        />
      )}

      {/* MODAL: REAJUSTE EM LOTE */}
      {showBatchModal && (
        <div className="admin-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="batch-modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="batch-modal-header">
              <h3>Reajuste de Preços em Lote</h3>
              <button className="admin-modal-close" onClick={() => setShowBatchModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="batch-modal-body">
              <div className="form-group-clean">
                <label>Aplicar em Quais Produtos?</label>
                <select
                  value={batchScope}
                  onChange={(e) => setBatchScope(e.target.value)}
                  className="admin-form-select"
                >
                  <option value="all">Todos os Produtos ({products.length})</option>
                  <option value="arab">Apenas Perfumes Árabes</option>
                  <option value="brand">Apenas Brand Collection</option>
                </select>
              </div>

              <div className="form-group-clean">
                <label>Qual Preço Reajustar?</label>
                <select
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value)}
                  className="admin-form-select"
                >
                  <option value="varejo">Preço de Varejo</option>
                  <option value="atacado">Preço de Atacado</option>
                  <option value="custo">Preço de Custo / Compra</option>
                </select>
              </div>

              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label>Tipo de Reajuste</label>
                  <select
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="form-group-clean">
                  <label>Valor {batchType === 'percent' ? '(%)' : '(R$)'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
              </div>
            </div>
            <div className="batch-modal-footer">
              <button
                className="btn-cancel-clean"
                onClick={() => setShowBatchModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-save-clean"
                onClick={handleApplyBatchReajuste}
              >
                Aplicar Reajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
