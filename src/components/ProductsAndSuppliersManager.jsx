import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Users,
  Search,
  Plus,
  Sliders,
  FileSpreadsheet,
  RotateCcw,
  Edit,
  Trash2,
  Handshake,
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Phone,
  MessageCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Images
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AddEditProductModal from './AddEditProductModal';
import AddEditSupplierModal from './AddEditSupplierModal';
import SupplierProductsModal from './SupplierProductsModal';
import SupplierStockModal from './SupplierStockModal';
import ProductCarouselModal from './ProductCarouselModal';
import Pagination from './Pagination';

export default function ProductsAndSuppliersManager({
  products = [],
  suppliers = [],
  onUpdateProduct,
  onBatchUpdate,
  onResetToDefaults,
  onSaveProduct,
  onDeleteProduct,
  onSaveSupplier,
  onDeleteSupplier,
  onToast
}) {
  // Sub-tab selection: 'produtos' or 'fornecedores'
  const [subTab, setSubTab] = useState('produtos');

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeSupplierStockProduct, setActiveSupplierStockProduct] = useState(null);
  const [activeCarouselProduct, setActiveCarouselProduct] = useState(null);

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [activeSupplierProductsModal, setActiveSupplierProductsModal] = useState(null);

  const [showBatchModal, setShowBatchModal] = useState(false);

  // Batch modal fields
  const [batchScope, setBatchScope] = useState('all');
  const [batchTarget, setBatchTarget] = useState('varejo');
  const [batchType, setBatchType] = useState('percent');
  const [batchValue, setBatchValue] = useState(10);
  const [roundDecimals, setRoundDecimals] = useState(true);

  // Filters for 'produtos'
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('all'); // 'all', 'arab', 'brand'
  const [prodStockFilter, setProdStockFilter] = useState('all'); // 'all', 'low', 'zero', 'supplier'
  const [prodSortBy, setProdSortBy] = useState('name'); // 'name', 'code', 'stock', 'cost', 'retail'
  const [prodCurrentPage, setProdCurrentPage] = useState(1);
  const [prodPageSize, setProdPageSize] = useState(15);

  useEffect(() => {
    setProdCurrentPage(1);
  }, [prodSearch, prodCategory, prodStockFilter, prodSortBy]);

  // Filters for 'fornecedores'
  const [supSearch, setSupSearch] = useState('');
  const [supTypeFilter, setSupTypeFilter] = useState('all'); // 'all', 'Distribuidora', 'Importadora', 'Lojista Parceiro'

  // Format currency
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Helper to calculate total stock of a product
  const getProductTotalStock = (p) => {
    const proprio = p.estoqueProprio !== undefined ? Number(p.estoqueProprio) : Number(p.qtdEstoque || 0);
    const fornQtd = Array.isArray(p.fornecedores)
      ? p.fornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0)
      : 0;
    return proprio + fornQtd;
  };

  // Helper to calculate supplier stats
  const getSupplierStats = (supplier) => {
    let linkedCount = 0;
    let totalPieces = 0;
    let totalCost = 0;

    products.forEach((p) => {
      if (Array.isArray(p.fornecedores)) {
        const found = p.fornecedores.find(
          (f) => f.fornecedorId === supplier.id || f.nome?.toLowerCase() === supplier.nome?.toLowerCase()
        );
        if (found) {
          linkedCount += 1;
          const q = Number(found.qtd || 0);
          const c = Number(found.precoCusto || 0);
          totalPieces += q;
          totalCost += q * c;
        }
      }
    });

    return { linkedCount, totalPieces, totalCost };
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (prodCategory === 'arab' && !p.isArabic) return false;
      if (prodCategory === 'brand' && p.isArabic) return false;

      // Stock filter
      const proprio = p.estoqueProprio !== undefined ? Number(p.estoqueProprio) : Number(p.qtdEstoque || 0);
      const fornQtd = Array.isArray(p.fornecedores)
        ? p.fornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0)
        : 0;
      const total = proprio + fornQtd;

      if (prodStockFilter === 'low' && total >= 5) return false;
      if (prodStockFilter === 'zero' && total > 0) return false;
      if (prodStockFilter === 'supplier' && fornQtd === 0) return false;

      // Search query
      if (prodSearch.trim()) {
        const q = prodSearch.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesClean = (p.cleanName || '').toLowerCase().includes(q);
        const matchesRef = (p.ref || '').toLowerCase().includes(q);
        const matchesCod = (p.cod || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        const matchesForn = Array.isArray(p.fornecedores) && p.fornecedores.some((f) => (f.nome || '').toLowerCase().includes(q));
        if (!matchesName && !matchesClean && !matchesRef && !matchesCod && !matchesSku && !matchesForn) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (prodSortBy === 'code') {
        return (a.cod || a.sku || '').localeCompare(b.cod || b.sku || '');
      }
      if (prodSortBy === 'stock') {
        return getProductTotalStock(b) - getProductTotalStock(a);
      }
      if (prodSortBy === 'cost') {
        return (Number(b.precoCompra) || 0) - (Number(a.precoCompra) || 0);
      }
      if (prodSortBy === 'retail') {
        return (Number(b.precoVarejo) || 0) - (Number(a.precoVarejo) || 0);
      }
      // default: name
      return (a.cleanName || a.name || '').localeCompare(b.cleanName || b.name || '');
    });
  }, [products, prodCategory, prodStockFilter, prodSearch, prodSortBy]);

  // Overall Catalog KPIs
  const catalogKpis = useMemo(() => {
    let totalProprio = 0;
    let totalFornecedor = 0;
    let totalCustoProprio = 0;
    let totalCustoFornecedor = 0;
    let totalPotencialVenda = 0;

    products.forEach((p) => {
      const pr = p.estoqueProprio !== undefined ? Number(p.estoqueProprio) : Number(p.qtdEstoque || 0);
      const custo = Number(p.precoCompra || 0);
      const varejo = Number(p.precoVarejo || 0);

      totalProprio += pr;
      totalCustoProprio += pr * custo;

      let pFornQtd = 0;
      if (Array.isArray(p.fornecedores)) {
        p.fornecedores.forEach((f) => {
          const q = Number(f.qtd || 0);
          const c = Number(f.precoCusto || custo);
          pFornQtd += q;
          totalFornecedor += q;
          totalCustoFornecedor += q * c;
        });
      }

      totalPotencialVenda += (pr + pFornQtd) * varejo;
    });

    return {
      totalItens: products.length,
      totalProprio,
      totalFornecedor,
      totalGeralFrascos: totalProprio + totalFornecedor,
      totalCustoEstoque: totalCustoProprio + totalCustoFornecedor,
      totalPotencialVenda
    };
  }, [products]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (supTypeFilter !== 'all' && s.tipo !== supTypeFilter) return false;
      if (supSearch.trim()) {
        const q = supSearch.toLowerCase().trim();
        const matchesNome = (s.nome || '').toLowerCase().includes(q);
        const matchesDoc = (s.documento || '').toLowerCase().includes(q);
        const matchesCidade = (s.cidade || '').toLowerCase().includes(q);
        const matchesContato = (s.contato || '').toLowerCase().includes(q);
        if (!matchesNome && !matchesDoc && !matchesCidade && !matchesContato) {
          return false;
        }
      }
      return true;
    });
  }, [suppliers, supTypeFilter, supSearch]);

  // Overall Suppliers KPIs
  const supplierKpis = useMemo(() => {
    let totalExternalPieces = 0;
    let totalExternalCost = 0;
    let activeWithStock = 0;

    suppliers.forEach((s) => {
      const stats = getSupplierStats(s);
      totalExternalPieces += stats.totalPieces;
      totalExternalCost += stats.totalCost;
      if (stats.totalPieces > 0) activeWithStock += 1;
    });

    return {
      totalSuppliers: suppliers.length,
      activeWithStock,
      totalExternalPieces,
      totalExternalCost
    };
  }, [suppliers, products]);

  // Handle Export Excel
  const handleExportCatalogExcel = () => {
    const rows = products.map((p) => {
      const proprio = p.estoqueProprio !== undefined ? Number(p.estoqueProprio) : Number(p.qtdEstoque || 0);
      const fornQtd = Array.isArray(p.fornecedores) ? p.fornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0) : 0;
      const fornNomes = Array.isArray(p.fornecedores) ? p.fornecedores.map((f) => `${f.nome} (${f.qtd}un - R$${f.precoCusto || p.precoCompra})`).join('; ') : '';

      return {
        'Código': p.cod || p.sku,
        'SKU': p.sku,
        'Perfume': p.cleanName || p.name,
        'Linha': p.isArabic ? 'Árabe' : 'Brand Collection',
        'Inspiração Olfativa': p.ref || '',
        'Gênero': p.gender || '',
        'Estoque Próprio (un)': proprio,
        'Estoque Fornecedores (un)': fornQtd,
        'Estoque Total (un)': proprio + fornQtd,
        'Fornecedores Vinculados': fornNomes,
        'Custo Compra Padrão (R$)': Number(p.precoCompra || 0),
        'Preço Atacado (R$)': Number(p.precoAtacado || 0),
        'Preço Varejo (R$)': Number(p.precoVarejo || 0),
        'Lucro Varejo (R$)': (Number(p.precoVarejo || 0) - Number(p.precoCompra || 0)).toFixed(2),
        'Margem Varejo (%)': Number(p.precoCompra) > 0 ? (((Number(p.precoVarejo) - Number(p.precoCompra)) / Number(p.precoCompra)) * 100).toFixed(1) + '%' : '0%'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo Snack Store');
    XLSX.writeFile(wb, `SnackStoreBH_CatalogoFornecedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onToast && onToast('Catálogo completo exportado para Excel com sucesso! 📊📥');
  };

  // Handle Apply Batch Update
  const handleApplyBatch = () => {
    const factor = batchType === 'percent' ? 1 + batchValue / 100 : 0;
    const diff = batchType === 'fixed' ? batchValue : 0;

    const updated = products.map((item) => {
      let apply = false;
      if (batchScope === 'all') apply = true;
      if (batchScope === 'arab' && item.isArabic) apply = true;
      if (batchScope === 'brand' && !item.isArabic) apply = true;

      if (!apply) return item;

      let newCusto = Number(item.precoCompra) || 0;
      let newAtc = Number(item.precoAtacado) || 0;
      let newVarj = Number(item.precoVarejo) || 0;

      if (batchTarget === 'varejo' || batchTarget === 'all') {
        newVarj = batchType === 'percent' ? newVarj * factor : newVarj + diff;
        if (roundDecimals) newVarj = Math.round(newVarj * 2) / 2;
      }
      if (batchTarget === 'atacado' || batchTarget === 'all') {
        newAtc = batchType === 'percent' ? newAtc * factor : newAtc + diff;
        if (roundDecimals) newAtc = Math.round(newAtc * 2) / 2;
      }
      if (batchTarget === 'custo') {
        newCusto = batchType === 'percent' ? newCusto * factor : newCusto + diff;
        if (roundDecimals) newCusto = Math.round(newCusto * 2) / 2;
      }

      return {
        ...item,
        precoCompra: Math.max(0, newCusto),
        precoAtacado: Math.max(0, newAtc),
        precoVarejo: Math.max(0, newVarj)
      };
    });

    onBatchUpdate && onBatchUpdate(updated);
    setShowBatchModal(false);
    onToast && onToast(`Reajuste em lote aplicado com sucesso! 🚀`);
  };

  // Delete product handler
  const handleDeleteProductConfirm = (prod) => {
    if (window.confirm(`Tem certeza que deseja excluir o perfume "${prod.cleanName || prod.name}" (${prod.cod || prod.sku}) do catálogo?`)) {
      onDeleteProduct && onDeleteProduct(prod.sku);
    }
  };

  // Delete supplier handler
  const handleDeleteSupplierConfirm = (sup) => {
    const stats = getSupplierStats(sup);
    let warning = `Tem certeza que deseja excluir o fornecedor "${sup.nome}"?`;
    if (stats.linkedCount > 0) {
      warning += `\n\nATENÇÃO: Existem ${stats.linkedCount} perfume(s) com ${stats.totalPieces} frascos vinculados a este fornecedor. Ao excluir, essas cotas serão desvinculadas.`;
    }

    if (window.confirm(warning)) {
      onDeleteSupplier && onDeleteSupplier(sup.id);
    }
  };

  return (
    <div className="admin-tab-pane">
      {/* SUBTAB SWITCHER HEADER */}
      <div className="pane-header-row">
        <div>
          <div className="subtab-switcher-clean">
            <button
              className={`btn-subtab-clean ${subTab === 'produtos' ? 'active' : ''}`}
              onClick={() => setSubTab('produtos')}
            >
              <Package size={17} />
              <span>Catálogo de Perfumes & Estoques</span>
              <span className="subtab-count-badge">{products.length}</span>
            </button>

            <button
              className={`btn-subtab-clean ${subTab === 'fornecedores' ? 'active' : ''}`}
              onClick={() => setSubTab('fornecedores')}
            >
              <Users size={17} />
              <span>Gestão de Fornecedores & Cotas</span>
              <span className="subtab-count-badge blue">{suppliers.length}</span>
            </button>
          </div>
          <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {subTab === 'produtos'
              ? 'Visualize custos de aquisição, preços de atacado/varejo, margens e cotas alocadas por parceiro.'
              : 'Gerencie distribuidores oficiais, importadoras e lojistas parceiros consignados e seus perfumes.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="pane-header-actions">
          {subTab === 'produtos' ? (
            <>
              <button
                className="btn-platform-primary"
                onClick={() => {
                  setEditingProduct(null);
                  setShowAddProductModal(true);
                }}
              >
                <Plus size={16} /> Novo Produto
              </button>
              <button
                className="btn-platform-secondary"
                onClick={() => setShowBatchModal(true)}
              >
                <Sliders size={15} /> Reajuste em Lote
              </button>
              <button
                className="btn-platform-secondary"
                onClick={handleExportCatalogExcel}
              >
                <FileSpreadsheet size={15} /> Exportar Excel
              </button>
              <button
                className="btn-platform-secondary"
                title="Restaurar tabela de preços original da nota de compra"
                onClick={() => {
                  if (window.confirm('Deseja restaurar todos os custos e preços para o padrão original da nota fiscal?')) {
                    onResetToDefaults && onResetToDefaults();
                  }
                }}
              >
                <RotateCcw size={15} /> Restaurar Padrões
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-platform-primary"
                onClick={() => {
                  setEditingSupplier(null);
                  setShowAddSupplierModal(true);
                }}
              >
                <Plus size={16} /> Novo Fornecedor
              </button>
              <button
                className="btn-platform-secondary"
                onClick={handleExportCatalogExcel}
              >
                <FileSpreadsheet size={15} /> Exportar Relatório
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: PRODUTOS, ESTOQUES & PREÇOS                                       */}
      {/* ========================================================================= */}
      {subTab === 'produtos' && (
        <div className="tab-produtos-content">
          {/* Top Quick KPIs Strip */}
          <div className="metrics-clean-grid" style={{ marginBottom: '18px' }}>
            <div className="metric-clean-card">
              <span className="card-lbl">Total de Fragrâncias</span>
              <strong className="card-val">{catalogKpis.totalItens} itens</strong>
              <span className="card-sub">
                {products.filter((p) => p.isArabic).length} Árabes • {products.filter((p) => !p.isArabic).length} Brand
              </span>
            </div>

            <div className="metric-clean-card">
              <span className="card-lbl">Estoque Geral (Frascos)</span>
              <strong className="card-val" style={{ color: '#10b981' }}>
                {catalogKpis.totalGeralFrascos} un
              </strong>
              <span className="card-sub">
                🏢 {catalogKpis.totalProprio} un Próprio • 🤝 {catalogKpis.totalFornecedor} un Fornecedores
              </span>
            </div>

            <div className="metric-clean-card">
              <span className="card-lbl">Capital em Estoque (Custo)</span>
              <strong className="card-val" style={{ color: '#60a5fa' }}>
                {formatMoney(catalogKpis.totalCustoEstoque)}
              </strong>
              <span className="card-sub">Patrimônio investido em mercadorias</span>
            </div>

            <div className="metric-clean-card">
              <span className="card-lbl">Potencial de Venda (Varejo)</span>
              <strong className="card-val" style={{ color: '#a78bfa' }}>
                {formatMoney(catalogKpis.totalPotencialVenda)}
              </strong>
              <span className="card-sub">
                Lucro potencial: {formatMoney(catalogKpis.totalPotencialVenda - catalogKpis.totalCustoEstoque)}
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="prod-filter-bar-clean" style={{ flexWrap: 'wrap', gap: '10px' }}>
            {/* Search Box */}
            <div className="search-box-clean" style={{ flex: '1 1 260px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Pesquisar perfume, código, inspiração ou fornecedor..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
              {prodSearch && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => setProdSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="category-chips-clean">
              <button
                className={`cat-chip-btn ${prodCategory === 'all' ? 'active' : ''}`}
                onClick={() => setProdCategory('all')}
              >
                Todos ({products.length})
              </button>
              <button
                className={`cat-chip-btn ${prodCategory === 'arab' ? 'active' : ''}`}
                onClick={() => setProdCategory('arab')}
              >
                Árabes ({products.filter((p) => p.isArabic).length})
              </button>
              <button
                className={`cat-chip-btn ${prodCategory === 'brand' ? 'active' : ''}`}
                onClick={() => setProdCategory('brand')}
              >
                Brand ({products.filter((p) => !p.isArabic).length})
              </button>
            </div>

            {/* Stock Level Chips */}
            <div className="category-chips-clean">
              <button
                className={`cat-chip-btn ${prodStockFilter === 'all' ? 'active' : ''}`}
                onClick={() => setProdStockFilter('all')}
              >
                Todo Estoque
              </button>
              <button
                className={`cat-chip-btn ${prodStockFilter === 'low' ? 'active' : ''}`}
                onClick={() => setProdStockFilter('low')}
                title="Estoque total menor que 5 frascos"
              >
                ⚠️ Baixo (&lt; 5)
              </button>
              <button
                className={`cat-chip-btn ${prodStockFilter === 'zero' ? 'active' : ''}`}
                onClick={() => setProdStockFilter('zero')}
                title="Frascos zerados"
              >
                🔴 Zerado (0)
              </button>
              <button
                className={`cat-chip-btn ${prodStockFilter === 'supplier' ? 'active' : ''}`}
                onClick={() => setProdStockFilter('supplier')}
                title="Perfumes com cotas em fornecedores"
              >
                🤝 Em Parceiros
              </button>
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ordenar:</span>
              <select
                value={prodSortBy}
                onChange={(e) => setProdSortBy(e.target.value)}
                className="admin-form-select"
                style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
              >
                <option value="name">Nome (A-Z)</option>
                <option value="code">Código / SKU</option>
                <option value="stock">Maior Estoque</option>
                <option value="cost">Maior Custo</option>
                <option value="retail">Maior Preço Varejo</option>
              </select>
            </div>
          </div>

          {/* Products Table with Quick Action Buttons */}
          <div className="prod-table-container">
            <div className="table-mobile-hint">
              <span>⇄ Deslize horizontalmente para ver estoques, preços e ações</span>
            </div>
            <table className="orders-platform-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Foto & Código</th>
                  <th>Perfume & Inspiração</th>
                  <th style={{ width: '220px' }}>Estoque & Fornecedores</th>
                  <th style={{ width: '100px' }}>Custo Compra</th>
                  <th style={{ width: '100px' }}>Preço Atacado</th>
                  <th style={{ width: '100px' }}>Preço Varejo</th>
                  <th style={{ width: '130px' }}>Margem Varejo</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Nenhum perfume encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredProducts
                    .slice((prodCurrentPage - 1) * prodPageSize, prodCurrentPage * prodPageSize)
                    .map((p) => {
                    const custo = Number(p.precoCompra || 0);
                    const atacado = Number(p.precoAtacado || 0);
                    const varejo = Number(p.precoVarejo || 0);
                    const margemVarejo = custo > 0 ? (((varejo - custo) / custo) * 100).toFixed(0) : 0;
                    const lucroVarejoVal = (varejo - custo).toFixed(2);

                    const proprioQtd = p.estoqueProprio !== undefined ? Number(p.estoqueProprio) : Number(p.qtdEstoque || 0);
                    const fornecedores = Array.isArray(p.fornecedores) ? p.fornecedores : [];
                    const fornTotalQtd = fornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
                    const totalGeral = proprioQtd + fornTotalQtd;

                    const rawCover = p.coverImage || (Array.isArray(p.images) && p.images[0]) || '';
                    const coverSrc = rawCover
                      ? (rawCover.startsWith('data:') || rawCover.startsWith('http') || rawCover.startsWith('blob:')
                          ? rawCover
                          : `/${encodeURI(rawCover.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}`)
                      : '';

                    return (
                      <tr key={p.sku}>
                        <td>
                          <div className="product-thumb-code-cell">
                            <div
                              className="prod-table-thumb-wrap"
                              onClick={() => setActiveCarouselProduct(p)}
                              title="Clique para abrir o carrossel de fotos deste perfume"
                            >
                              {coverSrc ? (
                                <img
                                  src={coverSrc}
                                  alt={p.cleanName || p.name}
                                  className="prod-table-thumb-img"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Images size={16} color="#71717a" />
                              )}
                              <div className="thumb-hover-overlay">
                                <Images size={12} color="#fff" />
                              </div>
                            </div>
                            <span className="code-pill">{p.cod || p.sku}</span>
                          </div>
                        </td>
                        <td>
                          <div className="client-cell-info">
                            <strong className="client-name-bold">{p.cleanName || p.name}</strong>
                            <span className="client-phone-sub">
                              {p.isArabic ? '✨ Árabe' : '💎 Brand'} • Ref: {p.ref || '-'} {p.volume ? `(${p.volume})` : ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="stock-breakdown-cell">
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span
                                className={`stock-proprio-tag ${proprioQtd <= 0 ? 'zero' : proprioQtd < 3 ? 'low' : ''}`}
                                title="Estoque Próprio Disponível"
                              >
                                🏢 Próprio: <strong>{proprioQtd} un</strong>
                              </span>
                              {fornTotalQtd > 0 && (
                                <span
                                  className="stock-fornec-tag"
                                  title={`${fornecedores.length} fornecedor(es) parceiro(s) vinculado(s)`}
                                  onClick={() => setActiveSupplierStockProduct(p)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  🤝 Parceiros: <strong>{fornTotalQtd} un</strong>
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Total em Estoque: <strong style={{ color: totalGeral > 0 ? '#10b981' : '#ef4444' }}>{totalGeral} frascos</strong>
                            </span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            value={custo}
                            onChange={(e) =>
                              onUpdateProduct(p.sku, { precoCompra: parseFloat(e.target.value) || 0 })
                            }
                            className="inline-price-input cost"
                            title="Preço de Custo de Compra (Altere inline)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            value={atacado}
                            onChange={(e) =>
                              onUpdateProduct(p.sku, { precoAtacado: parseFloat(e.target.value) || 0 })
                            }
                            className="inline-price-input"
                            title="Preço de Atacado da Snack Store"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            value={varejo}
                            onChange={(e) =>
                              onUpdateProduct(p.sku, { precoVarejo: parseFloat(e.target.value) || 0 })
                            }
                            className="inline-price-input varj"
                            title="Preço Sugerido / Praticado no Varejo"
                          />
                        </td>
                        <td>
                          <span className="profit-micro-tag" title={`Lucro de R$ ${lucroVarejoVal} por frasco`}>
                            +{margemVarejo}% (R$ {lucroVarejoVal})
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {/* Gerenciar Fornecedores / Cotas */}
                            <button
                              type="button"
                              className="btn-action-icon acerto"
                              title="Vincular a Fornecedores / Gerenciar Cotas de Estoque"
                              onClick={() => setActiveSupplierStockProduct(p)}
                            >
                              <Handshake size={14} />
                            </button>

                            {/* Editar Produto Completo */}
                            <button
                              type="button"
                              className="btn-action-icon edit"
                              title="Editar Dados Completos do Perfume"
                              onClick={() => {
                                setEditingProduct(p);
                                setShowAddProductModal(true);
                              }}
                            >
                              <Edit size={14} />
                            </button>

                            {/* Excluir Produto */}
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              title="Excluir Perfume do Catálogo"
                              onClick={() => handleDeleteProductConfirm(p)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={prodCurrentPage}
              totalItems={filteredProducts.length}
              pageSize={prodPageSize}
              onPageChange={setProdCurrentPage}
              onPageSizeChange={setProdPageSize}
              pageSizeOptions={[10, 15, 25, 50, 100]}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: FORNECEDORES & LOJISTAS PARCEIROS                                   */}
      {/* ========================================================================= */}
      {subTab === 'fornecedores' && (
        <div className="tab-fornecedores-content">
          {/* Top Quick KPIs Strip Fornecedores */}
          <div className="metrics-clean-grid" style={{ marginBottom: '18px' }}>
            <div className="metric-clean-card">
              <span className="card-lbl">Total de Fornecedores</span>
              <strong className="card-val">{supplierKpis.totalSuppliers} cadastrados</strong>
              <span className="card-sub">Distribuidores, importadoras e lojistas</span>
            </div>

            <div className="metric-clean-card">
              <span className="card-lbl">Parceiros com Estoque Ativo</span>
              <strong className="card-val" style={{ color: '#10b981' }}>
                {supplierKpis.activeWithStock} parceiros
              </strong>
              <span className="card-sub">Possuem frascos alocados no sistema</span>
            </div>

            <div className="metric-clean-card">
              <span className="card-lbl">Frascos sob Fornecedores</span>
              <strong className="card-val" style={{ color: '#3b82f6' }}>
                {supplierKpis.totalExternalPieces} un
              </strong>
              <span className="card-sub">Mercadoria alocada externamente</span>
            </div>

            <div className="metric-clean-card">
              <span className="card-lbl">Custo Total Vinculado</span>
              <strong className="card-val" style={{ color: '#f59e0b' }}>
                {formatMoney(supplierKpis.totalExternalCost)}
              </strong>
              <span className="card-sub">Valor em mercadorias a preço de custo</span>
            </div>
          </div>

          {/* Filters Bar Fornecedores */}
          <div className="prod-filter-bar-clean" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="search-box-clean" style={{ flex: '1 1 280px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Pesquisar fornecedor por nome, cidade, telefone ou CNPJ/CPF..."
                value={supSearch}
                onChange={(e) => setSupSearch(e.target.value)}
              />
              {supSearch && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => setSupSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="category-chips-clean">
              <button
                className={`cat-chip-btn ${supTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSupTypeFilter('all')}
              >
                Todos ({suppliers.length})
              </button>
              <button
                className={`cat-chip-btn ${supTypeFilter === 'Distribuidora' ? 'active' : ''}`}
                onClick={() => setSupTypeFilter('Distribuidora')}
              >
                🏢 Distribuidores
              </button>
              <button
                className={`cat-chip-btn ${supTypeFilter === 'Importadora' ? 'active' : ''}`}
                onClick={() => setSupTypeFilter('Importadora')}
              >
                🚢 Importadoras
              </button>
              <button
                className={`cat-chip-btn ${supTypeFilter === 'Lojista Parceiro' ? 'active' : ''}`}
                onClick={() => setSupTypeFilter('Lojista Parceiro')}
              >
                🤝 Lojistas Parceiros
              </button>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="prod-table-container">
            <div className="table-mobile-hint">
              <span>⇄ Deslize horizontalmente para ver telefones, CNPJ, perfumes vinculados e ações</span>
            </div>
            <table className="orders-platform-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>ID</th>
                  <th>Fornecedor / Razão Social</th>
                  <th style={{ width: '140px' }}>Tipo de Parceiro</th>
                  <th style={{ width: '160px' }}>Contato / WhatsApp</th>
                  <th style={{ width: '150px' }}>Localização / CNPJ</th>
                  <th style={{ width: '180px' }}>Perfumes & Frascos Vinculados</th>
                  <th style={{ width: '120px' }}>Custo Total</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Nenhum fornecedor encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => {
                    const stats = getSupplierStats(sup);
                    const cleanPhone = (sup.whatsapp || sup.contato || '').replace(/\D/g, '');

                    return (
                      <tr key={sup.id}>
                        <td>
                          <span className="code-pill blue">{sup.id}</span>
                        </td>
                        <td>
                          <div className="client-cell-info">
                            <strong className="client-name-bold">{sup.nome}</strong>
                            {sup.observacao && (
                              <span className="client-phone-sub" title={sup.observacao}>
                                {sup.observacao.slice(0, 45)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className="status-pill-badge"
                            style={{
                              background:
                                sup.tipo === 'Importadora'
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : sup.tipo === 'Lojista Parceiro'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                              color:
                                sup.tipo === 'Importadora'
                                  ? '#c084fc'
                                  : sup.tipo === 'Lojista Parceiro'
                                  ? '#fbbf24'
                                  : '#60a5fa',
                              border: 'none',
                              fontSize: '11px',
                              padding: '4px 8px'
                            }}
                          >
                            {sup.tipo}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', color: '#fff' }}>{sup.contato || 'Sem telefone'}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/55${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: '11px',
                                  color: '#10b981',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  textDecoration: 'none'
                                }}
                              >
                                <MessageCircle size={12} /> Conversar no WhatsApp
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                            <span>{sup.cidade ? `${sup.cidade} - ${sup.estado || 'MG'}` : 'Belo Horizonte - MG'}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                              {sup.documento || 'Sem doc'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', color: stats.linkedCount > 0 ? '#10b981' : 'var(--text-muted)' }}>
                              <strong>{stats.linkedCount} perfume(s)</strong> vinculados
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {stats.totalPieces} frascos em cotas
                            </span>
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: stats.totalCost > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                            {formatMoney(stats.totalCost)}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {/* Ver e Vincular Produtos do Fornecedor */}
                            <button
                              type="button"
                              className="btn-action-icon acerto"
                              title="Ver / Gerenciar Perfumes Vinculados a este Fornecedor"
                              onClick={() => setActiveSupplierProductsModal(sup)}
                            >
                              <Package size={14} />
                            </button>

                            {/* Editar Dados do Fornecedor */}
                            <button
                              type="button"
                              className="btn-action-icon edit"
                              title="Editar Dados do Fornecedor"
                              onClick={() => {
                                setEditingSupplier(sup);
                                setShowAddSupplierModal(true);
                              }}
                            >
                              <Edit size={14} />
                            </button>

                            {/* Excluir Fornecedor */}
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              title="Excluir Fornecedor"
                              onClick={() => handleDeleteSupplierConfirm(sup)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS RELACIONADOS                                                       */}
      {/* ========================================================================= */}

      {/* MODAL: ADICIONAR / EDITAR PRODUTO */}
      {showAddProductModal && (
        <AddEditProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddProductModal(false);
            setEditingProduct(null);
          }}
          onSaveProduct={(savedProd) => {
            onSaveProduct && onSaveProduct(savedProd);
            setShowAddProductModal(false);
            setEditingProduct(null);
          }}
          onToast={onToast}
        />
      )}

      {/* MODAL: ADICIONAR / EDITAR FORNECEDOR */}
      {showAddSupplierModal && (
        <AddEditSupplierModal
          supplier={editingSupplier}
          onClose={() => {
            setShowAddSupplierModal(false);
            setEditingSupplier(null);
          }}
          onSaveSupplier={(savedSup) => {
            onSaveSupplier && onSaveSupplier(savedSup);
            setShowAddSupplierModal(false);
            setEditingSupplier(null);
          }}
          onToast={onToast}
        />
      )}

      {/* MODAL: GERENCIAR PRODUTOS DE UM FORNECEDOR ESPECÍFICO */}
      {activeSupplierProductsModal && (
        <SupplierProductsModal
          supplier={activeSupplierProductsModal}
          products={products}
          onClose={() => setActiveSupplierProductsModal(null)}
          onUpdateProduct={onUpdateProduct}
          onToast={onToast}
        />
      )}

      {/* MODAL: GERENCIAR COTAS E FORNECEDORES DE UM PRODUTO ESPECÍFICO */}
      {activeSupplierStockProduct && (
        <SupplierStockModal
          product={activeSupplierStockProduct}
          suppliers={suppliers}
          onClose={() => setActiveSupplierStockProduct(null)}
          onUpdateProduct={onUpdateProduct}
          onToast={onToast}
        />
      )}

      {/* MODAL: REAJUSTE EM LOTE */}
      {showBatchModal && (
        <div className="admin-overlay" onClick={() => setShowBatchModal(false)}>
          <div
            className="admin-modal-clean-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-clean-header">
              <div className="header-icon-title">
                <div className="header-badge-icon">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3>Reajuste de Preços em Lote</h3>
                  <p className="modal-subtitle">Atualize custos e margens de vários perfumes de uma vez</p>
                </div>
              </div>
              <button
                className="admin-modal-close"
                onClick={() => setShowBatchModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-clean-body">
              <div className="form-group-clean">
                <label className="field-label-clean">Aplicar em quais perfumes:</label>
                <select
                  value={batchScope}
                  onChange={(e) => setBatchScope(e.target.value)}
                  className="admin-form-select"
                >
                  <option value="all">Todos os perfumes ({products.length} itens)</option>
                  <option value="arab">Apenas Linha Perfumaria Árabe</option>
                  <option value="brand">Apenas Linha Brand Collection 25ml</option>
                </select>
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Campo a reajustar:</label>
                <select
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value)}
                  className="admin-form-select"
                >
                  <option value="varejo">Preço Sugerido de Varejo</option>
                  <option value="atacado">Preço de Atacado da Snack Store</option>
                  <option value="custo">Custo Padrão de Compra</option>
                  <option value="all">Preços de Varejo & Atacado Juntos</option>
                </select>
              </div>

              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Tipo de Ajuste:</label>
                  <select
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo em Reais (R$)</option>
                  </select>
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">
                    {batchType === 'percent' ? 'Porcentagem (+ ou -)' : 'Valor (R$)'}:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={batchValue}
                    onChange={(e) => setBatchValue(parseFloat(e.target.value) || 0)}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0' }}>
                  <input
                    type="checkbox"
                    checked={roundDecimals}
                    onChange={(e) => setRoundDecimals(e.target.checked)}
                  />
                  Arredondar para múltiplos de R$ 0,50
                </label>
              </div>
            </div>

            <div className="modal-clean-footer">
              <button
                type="button"
                className="btn-platform-secondary"
                onClick={() => setShowBatchModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-platform-primary"
                onClick={handleApplyBatch}
              >
                Aplicar Reajuste
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: CARROSSEL DE FOTOS DO PERFUME */}
      {activeCarouselProduct && (
        <ProductCarouselModal
          product={activeCarouselProduct}
          onClose={() => setActiveCarouselProduct(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
