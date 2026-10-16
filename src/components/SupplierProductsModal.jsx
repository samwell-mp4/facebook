import React, { useState, useMemo } from 'react';
import {
  X,
  Package,
  Plus,
  Trash2,
  Save,
  Building2,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  Link2,
  Images
} from 'lucide-react';
import ProductCarouselModal from './ProductCarouselModal';

export default function SupplierProductsModal({
  supplier,
  products = [],
  onClose,
  onUpdateProduct,
  onToast
}) {
  if (!supplier) return null;

  // Find all products that currently have this supplier linked in their 'fornecedores' array
  const linkedProducts = useMemo(() => {
    return products.filter((p) => {
      if (!Array.isArray(p.fornecedores)) return false;
      return p.fornecedores.some(
        (f) => f.fornecedorId === supplier.id || f.nome?.toLowerCase() === supplier.nome?.toLowerCase()
      );
    });
  }, [products, supplier]);

  // Catalog products that are NOT yet linked to this supplier
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProductSku, setSelectedProductSku] = useState('');
  const [newCotaQtd, setNewCotaQtd] = useState(5);
  const [newCotaCusto, setNewCotaCusto] = useState(28.0);
  const [activeCarouselProduct, setActiveCarouselProduct] = useState(null);

  const availableToLink = useMemo(() => {
    return products.filter((p) => {
      const isAlreadyLinked = Array.isArray(p.fornecedores) && p.fornecedores.some(
        (f) => f.fornecedorId === supplier.id || f.nome?.toLowerCase() === supplier.nome?.toLowerCase()
      );
      if (isAlreadyLinked) return false;
      if (!catalogSearch) return true;
      const q = catalogSearch.toLowerCase().trim();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.cleanName?.toLowerCase().includes(q) ||
        p.cod?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    });
  }, [products, supplier, catalogSearch]);

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Totals for this supplier
  const supplierTotals = useMemo(() => {
    let totalFrascos = 0;
    let totalCusto = 0;

    linkedProducts.forEach((p) => {
      const fornEntry = p.fornecedores.find(
        (f) => f.fornecedorId === supplier.id || f.nome?.toLowerCase() === supplier.nome?.toLowerCase()
      );
      if (fornEntry) {
        const q = Number(fornEntry.qtd || 0);
        const c = Number(fornEntry.precoCusto || 0);
        totalFrascos += q;
        totalCusto += q * c;
      }
    });

    return {
      perfumesCount: linkedProducts.length,
      totalFrascos,
      totalCusto
    };
  }, [linkedProducts, supplier]);

  // Update a linked product's stock or cost for this supplier
  const handleUpdateCota = (productSku, field, value) => {
    const prod = products.find((p) => p.sku === productSku);
    if (!prod) return;

    const nextFornecedores = (prod.fornecedores || []).map((f) => {
      if (f.fornecedorId === supplier.id || f.nome?.toLowerCase() === supplier.nome?.toLowerCase()) {
        return {
          ...f,
          fornecedorId: supplier.id,
          nome: supplier.nome,
          [field]: field === 'qtd' || field === 'precoCusto' ? Math.max(0, parseFloat(value) || 0) : value
        };
      }
      return f;
    });

    const totalExt = nextFornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
    const proprio = Number(prod.estoqueProprio !== undefined ? prod.estoqueProprio : prod.qtdEstoque) || 0;

    onUpdateProduct(prod.sku, {
      fornecedores: nextFornecedores,
      qtdEstoque: proprio + totalExt
    });

    onToast && onToast(`Cota de ${prod.cleanName || prod.name} atualizada! 📦✅`);
  };

  // Remove / Unlink product from this supplier
  const handleUnlink = (productSku) => {
    const prod = products.find((p) => p.sku === productSku);
    if (!prod) return;

    if (!window.confirm(`Desvincular "${prod.cleanName || prod.name}" deste fornecedor?`)) return;

    const nextFornecedores = (prod.fornecedores || []).filter(
      (f) => f.fornecedorId !== supplier.id && f.nome?.toLowerCase() !== supplier.nome?.toLowerCase()
    );

    const totalExt = nextFornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
    const proprio = Number(prod.estoqueProprio !== undefined ? prod.estoqueProprio : prod.qtdEstoque) || 0;

    onUpdateProduct(prod.sku, {
      fornecedores: nextFornecedores,
      qtdEstoque: proprio + totalExt
    });

    onToast && onToast(`Perfume "${prod.cleanName || prod.name}" desvinculado! 🗑️`);
  };

  // Link a new product to this supplier
  const handleLinkProduct = () => {
    if (!selectedProductSku) {
      alert('Selecione um perfume do catálogo para vincular!');
      return;
    }
    const prod = products.find((p) => p.sku === selectedProductSku);
    if (!prod) return;

    const novo = {
      id: `cota-${Date.now()}`,
      fornecedorId: supplier.id,
      nome: supplier.nome,
      qtd: Math.max(0, parseInt(newCotaQtd) || 0),
      precoCusto: Math.max(0, parseFloat(newCotaCusto) || 0),
      contato: supplier.contato || '',
      dataEntrada: new Date().toISOString().slice(0, 10)
    };

    const nextFornecedores = [...(prod.fornecedores || []), novo];
    const totalExt = nextFornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
    const proprio = Number(prod.estoqueProprio !== undefined ? prod.estoqueProprio : prod.qtdEstoque) || 0;

    onUpdateProduct(prod.sku, {
      fornecedores: nextFornecedores,
      qtdEstoque: proprio + totalExt
    });

    setSelectedProductSku('');
    setNewCotaQtd(5);
    setNewCotaCusto(28.0);
    onToast && onToast(`+ ${prod.cod} vinculado ao fornecedor ${supplier.nome}! 🤝✨`);
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="supplier-modal-clean big" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="supplier-modal-header">
          <div className="supplier-header-title">
            <div className="supplier-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
              <Package size={20} />
            </div>
            <div>
              <h3>Produtos & Cotas Vinculadas ao Fornecedor</h3>
              <p className="supplier-subtitle">
                Fornecedor: <strong>{supplier.nome}</strong> • {supplier.tipo} {supplier.contato && `(${supplier.contato})`}
              </p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="supplier-kpis-strip">
          <div className="sup-kpi-item">
            <span>Modelos Vinculados:</span>
            <strong>{supplierTotals.perfumesCount} perfumes</strong>
          </div>
          <div className="sup-kpi-item">
            <span>Frascos em Estoque:</span>
            <strong style={{ color: '#10b981' }}>{supplierTotals.totalFrascos} frascos</strong>
          </div>
          <div className="sup-kpi-item">
            <span>Patrimônio Alocado (Custo):</span>
            <strong style={{ color: '#38bdf8' }}>{formatMoney(supplierTotals.totalCusto)}</strong>
          </div>
        </div>

        {/* Body Content */}
        <div className="supplier-modal-body">
          {/* Add / Link New Product Form Box */}
          <div className="link-product-box">
            <div className="box-title-row">
              <span className="box-title">
                <Link2 size={15} color="#10b981" /> Vincular Novo Perfume a este Fornecedor
              </span>
            </div>

            <div className="link-form-grid">
              <div className="form-group-clean">
                <label>Selecione o Perfume do Catálogo</label>
                <select
                  value={selectedProductSku}
                  onChange={(e) => {
                    setSelectedProductSku(e.target.value);
                    const sel = products.find((p) => p.sku === e.target.value);
                    if (sel) {
                      setNewCotaCusto(Number(sel.precoCompra || 37));
                    }
                  }}
                  className="admin-form-select"
                >
                  <option value="">-- Escolha um perfume do catálogo ({availableToLink.length} disponíveis) --</option>
                  {availableToLink.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.cod} - {p.cleanName || p.name} (Próprio: {p.estoqueProprio !== undefined ? p.estoqueProprio : p.qtdEstoque} un)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-clean mini">
                <label>Quantidade (un)</label>
                <input
                  type="number"
                  min="1"
                  value={newCotaQtd}
                  onChange={(e) => setNewCotaQtd(e.target.value)}
                  className="admin-form-input"
                  style={{ textAlign: 'center' }}
                />
              </div>

              <div className="form-group-clean mini">
                <label>Custo Unit. (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCotaCusto}
                  onChange={(e) => setNewCotaCusto(e.target.value)}
                  className="admin-form-input"
                  style={{ color: '#f59e0b', fontWeight: 700, textAlign: 'right' }}
                />
              </div>

              <div className="form-group-clean action">
                <button
                  type="button"
                  className="btn-platform-primary"
                  onClick={handleLinkProduct}
                  disabled={!selectedProductSku}
                  style={{ height: '38px', marginTop: 'auto' }}
                >
                  <Plus size={15} /> Vincular Cota
                </button>
              </div>
            </div>
          </div>

          {/* Table of Linked Products */}
          <div className="linked-products-section">
            <span className="section-label-sub">
              Perfumes Vinculados a {supplier.nome} ({linkedProducts.length})
            </span>

            {linkedProducts.length === 0 ? (
              <div className="empty-linked-wrap">
                <AlertCircle size={28} opacity={0.4} />
                <p>Nenhum produto está vinculado a este fornecedor ainda.</p>
                <small>Utilize o formulário acima para adicionar cotas e custos específicos deste parceiro.</small>
              </div>
            ) : (
              <div className="linked-table-wrap">
                <table className="orders-platform-table">
                  <thead>
                    <tr>
                      <th style={{ width: 125 }}>Foto & Código</th>
                      <th>Perfume / Inspiração</th>
                      <th style={{ width: 120 }}>Estoque (un)</th>
                      <th style={{ width: 140 }}>Custo Unit. (R$)</th>
                      <th style={{ width: 140 }}>Subtotal Custo</th>
                      <th style={{ textAlign: 'center', width: 80 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProducts.map((p) => {
                      const fornEntry = p.fornecedores.find(
                        (f) => f.fornecedorId === supplier.id || f.nome?.toLowerCase() === supplier.nome?.toLowerCase()
                      );
                      const qtd = Number(fornEntry?.qtd || 0);
                      const custo = Number(fornEntry?.precoCusto || 0);
                      const subtotal = qtd * custo;

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
                              <span className="client-phone-sub">Ref: {p.ref || '-'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="inline-stepper-box">
                              <input
                                type="number"
                                min="0"
                                value={qtd}
                                onChange={(e) => handleUpdateCota(p.sku, 'qtd', e.target.value)}
                                className="inline-mini-input"
                              />
                              <span className="unit-label">un</span>
                            </div>
                          </td>
                          <td>
                            <div className="inline-cost-box">
                              <span className="prefix">R$</span>
                              <input
                                type="number"
                                step="0.5"
                                value={custo}
                                onChange={(e) => handleUpdateCota(p.sku, 'precoCusto', e.target.value)}
                                className="inline-mini-input cost"
                              />
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: '#38bdf8' }}>{formatMoney(subtotal)}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              onClick={() => handleUnlink(p.sku)}
                              title="Desvincular produto deste fornecedor"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-clean-footer">
          <button type="button" className="btn-platform-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {/* Carrossel de fotos ao clicar na miniatura */}
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
