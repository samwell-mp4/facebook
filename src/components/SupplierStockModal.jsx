import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  Trash2,
  Save,
  Building2,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone
} from 'lucide-react';

export default function SupplierStockModal({
  product,
  suppliers = [],
  onClose,
  onSaveProduct,
  onToast
}) {
  if (!product) return null;

  // Estoque Próprio
  const [proprioQtd, setProprioQtd] = useState(
    product.estoqueProprio !== undefined ? product.estoqueProprio : (product.qtdEstoque || 0)
  );
  const [proprioCusto, setProprioCusto] = useState(
    product.precoCompra !== undefined ? product.precoCompra : 37.0
  );

  // Fornecedores / Lojistas Externos
  const [fornecedores, setFornecedores] = useState(
    Array.isArray(product.fornecedores) ? product.fornecedores : []
  );

  // Novo Fornecedor Form
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novaQtd, setNovaQtd] = useState(5);
  const [novoCusto, setNovoCusto] = useState(28.0);
  const [novoContato, setNovoContato] = useState('');

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleAddFornecedor = () => {
    if (!novoNome.trim()) {
      alert('Digite ou selecione o nome do Fornecedor ou Lojista!');
      return;
    }
    const matched = suppliers.find((s) => s.id === selectedSupplierId || s.nome?.toLowerCase() === novoNome.trim().toLowerCase());
    const novo = {
      id: `forn-${Date.now()}`,
      fornecedorId: matched?.id || selectedSupplierId || `forn-${Date.now()}`,
      nome: novoNome.trim(),
      qtd: Number(novaQtd) || 0,
      precoCusto: Number(novoCusto) || 0,
      contato: novoContato.trim() || matched?.contato || matched?.whatsapp || '',
      dataEntrada: new Date().toISOString().slice(0, 10)
    };

    setFornecedores((prev) => [...prev, novo]);
    setSelectedSupplierId('');
    setNovoNome('');
    setNovaQtd(5);
    setNovoCusto(28.0);
    setNovoContato('');
    onToast && onToast(`Fornecedor "${novo.nome}" adicionado à cota! 🤝`);
  };

  const handleRemoveFornecedor = (id) => {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateFornecedor = (id, field, value) => {
    setFornecedores((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            [field]: field === 'qtd' || field === 'precoCusto' ? Number(value) : value
          };
        }
        return f;
      })
    );
  };

  const handleSave = () => {
    const totalEstoqueExterno = fornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
    const totalEstoqueGeral = (Number(proprioQtd) || 0) + totalEstoqueExterno;

    const updated = {
      ...product,
      estoqueProprio: Number(proprioQtd) || 0,
      precoCompra: Number(proprioCusto) || 0,
      fornecedores,
      qtdEstoque: totalEstoqueGeral
    };

    onSaveProduct && onSaveProduct(product.sku, updated);
    onToast && onToast(`Estoque e fornecedores de ${product.cleanName || product.name} salvos com sucesso! 📦✨`);
    onClose();
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="supplier-modal-clean" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="supplier-modal-header">
          <div className="supplier-header-title">
            <div className="supplier-icon-badge">
              <Package size={20} />
            </div>
            <div>
              <h3>Gestão de Estoque por Fornecedor & Lojista</h3>
              <p className="supplier-subtitle">
                Perfume: <strong>{product.cleanName || product.name}</strong> ({product.cod || product.sku})
              </p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="supplier-modal-body">
          {/* Section 1: Meu Estoque Próprio */}
          <div className="stock-origin-card proprio">
            <div className="origin-card-header">
              <div className="origin-badge-icon proprio">
                <Building2 size={16} />
              </div>
              <div>
                <strong>Meu Estoque Próprio (Físico)</strong>
                <span className="origin-desc">Itens comprados pela Nota Fiscal oficial</span>
              </div>
            </div>

            <div className="form-clean-grid two">
              <div className="form-group-clean">
                <label className="field-label-clean">Quantidade em Estoque</label>
                <div className="input-stepper-wrap">
                  <input
                    type="number"
                    min="0"
                    value={proprioQtd}
                    onChange={(e) => setProprioQtd(Math.max(0, parseInt(e.target.value) || 0))}
                    className="admin-form-input"
                    placeholder="0"
                  />
                  <span className="stepper-unit">unidades</span>
                </div>
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Custo Médio Unitário</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix-badge">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={proprioCusto}
                    onChange={(e) => setProprioCusto(parseFloat(e.target.value) || 0)}
                    className="admin-form-input"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            <div className="stock-impact-hint">
              <CheckCircle2 size={13} color="#10b981" />
              <span>Vendas marcadas como "Estoque Próprio" abatem diretamente desse saldo físico.</span>
            </div>
          </div>

          {/* Section 2: Fornecedores / Lojistas Externos */}
          <div className="stock-origin-card externo">
            <div className="origin-card-header">
              <div className="origin-badge-icon externo">
                <Users size={16} />
              </div>
              <div>
                <strong>Fornecedores Parceiros / Lojistas Externos</strong>
                <span className="origin-desc">
                  Estoque de terceiros (não desconta do seu estoque físico ao vender)
                </span>
              </div>
            </div>

            {/* List of registered external suppliers */}
            {fornecedores.length > 0 ? (
              <div className="suppliers-table-wrap">
                <table className="suppliers-clean-table">
                  <thead>
                    <tr>
                      <th>Fornecedor / Lojista</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Qtd</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Custo (R$)</th>
                      <th>Contato</th>
                      <th style={{ width: '40px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedores.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <input
                            type="text"
                            value={f.nome}
                            onChange={(e) => handleUpdateFornecedor(f.id, 'nome', e.target.value)}
                            className="table-input-clean"
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={f.qtd}
                            onChange={(e) => handleUpdateFornecedor(f.id, 'qtd', e.target.value)}
                            className="table-input-clean center"
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={f.precoCusto}
                            onChange={(e) =>
                              handleUpdateFornecedor(f.id, 'precoCusto', e.target.value)
                            }
                            className="table-input-clean right"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="WhatsApp"
                            value={f.contato || ''}
                            onChange={(e) => handleUpdateFornecedor(f.id, 'contato', e.target.value)}
                            className="table-input-clean"
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-trash-supplier"
                            onClick={() => handleRemoveFornecedor(f.id)}
                            title="Remover fornecedor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-suppliers-box">
                <AlertCircle size={16} />
                <span>Nenhum fornecedor ou lojista parceiro cadastrado para este perfume ainda.</span>
              </div>
            )}

            {/* Add New Supplier Row Form */}
            <div className="add-supplier-form-card">
              <span className="add-supplier-title">+ Adicionar Cota de Fornecedor / Lojista</span>
              
              {suppliers.length > 0 && (
                <div className="form-group-clean">
                  <label className="field-label-clean">Fornecedor Cadastrado (Opcional):</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      setSelectedSupplierId(e.target.value);
                      const s = suppliers.find((x) => x.id === e.target.value);
                      if (s) {
                        setNovoNome(s.nome);
                        setNovoContato(s.contato || s.whatsapp || '');
                      }
                    }}
                    className="admin-form-select"
                  >
                    <option value="">-- Escolher da lista ou preencher abaixo --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Razão Social / Nome *</label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora SP"
                    value={novoNome}
                    onChange={(e) => {
                      setNovoNome(e.target.value);
                      if (selectedSupplierId) setSelectedSupplierId('');
                    }}
                    className="admin-form-input"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">WhatsApp / Contato</label>
                  <input
                    type="text"
                    placeholder="(31) 99999-8888"
                    value={novoContato}
                    onChange={(e) => setNovoContato(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Quantidade de Frascos *</label>
                  <div className="input-stepper-wrap">
                    <input
                      type="number"
                      placeholder="5"
                      min="1"
                      value={novaQtd}
                      onChange={(e) => setNovaQtd(parseInt(e.target.value) || 0)}
                      className="admin-form-input"
                    />
                    <span className="stepper-unit">frascos</span>
                  </div>
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">Custo Unitário da Cota *</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix-badge">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="28,00"
                      value={novoCusto}
                      onChange={(e) => setNovoCusto(parseFloat(e.target.value) || 0)}
                      className="admin-form-input"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-add-fornec-full"
                onClick={handleAddFornecedor}
              >
                <Plus size={16} /> Incluir Cota ao Perfume
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="supplier-modal-footer">
          <button className="btn-cancel-clean" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save-clean" onClick={handleSave}>
            <Save size={16} /> Salvar Estoques e Fornecedores
          </button>
        </div>
      </div>
    </div>
  );
}
