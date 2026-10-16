import React, { useState } from 'react';
import {
  X,
  Users,
  Building2,
  Phone,
  MapPin,
  FileText,
  Save
} from 'lucide-react';

export default function AddEditSupplierModal({
  supplier = null, // null for new, supplier object for edit
  onClose,
  onSaveSupplier,
  onToast
}) {
  const isEditing = Boolean(supplier);

  const [nome, setNome] = useState(supplier?.nome || '');
  const [tipo, setTipo] = useState(supplier?.tipo || 'Distribuidora');
  const [contato, setContato] = useState(supplier?.contato || '');
  const [documento, setDocumento] = useState(supplier?.documento || '');
  const [cidade, setCidade] = useState(supplier?.cidade || 'Belo Horizonte');
  const [estado, setEstado] = useState(supplier?.estado || 'MG');
  const [observacao, setObservacao] = useState(supplier?.observacao || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe o nome ou razão social do fornecedor!');
      return;
    }

    const cleanWa = contato.replace(/\D/g, '');

    const payload = {
      ...(supplier || {}),
      id: supplier?.id || `FORN-${Date.now().toString().slice(-4)}`,
      nome: nome.trim(),
      tipo,
      contato: contato.trim(),
      whatsapp: cleanWa,
      documento: documento.trim(),
      cidade: cidade.trim(),
      estado: estado.trim().toUpperCase(),
      observacao: observacao.trim(),
      criadoEm: supplier?.criadoEm || new Date().toISOString()
    };

    onSaveSupplier && onSaveSupplier(payload);
    onClose();
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal-clean-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-clean-header">
          <div className="header-icon-title">
            <div className="header-badge-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <h3>{isEditing ? 'Editar Fornecedor / Lojista' : 'Cadastrar Novo Fornecedor'}</h3>
              <p className="modal-subtitle">
                {isEditing ? `ID: ${supplier.id}` : 'Cadastre um novo parceiro para alocação de estoques e custos'}
              </p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="modal-clean-body">
          <div className="form-clean-grid two">
            <div className="form-group-clean">
              <label className="field-label-clean">Nome / Razão Social *</label>
              <input
                type="text"
                placeholder="Ex: Importadora SP Fragrâncias Luxo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="admin-form-input"
                required
              />
            </div>

            <div className="form-group-clean">
              <label className="field-label-clean">Tipo de Parceiro *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="admin-form-select"
              >
                <option value="Distribuidora">🏢 Distribuidora Oficial / Atacado</option>
                <option value="Importadora">🚢 Importadora Direta</option>
                <option value="Lojista Parceiro">🤝 Lojista Parceiro (Consignado / Barbearia)</option>
                <option value="Fabricante">🏭 Fabricante / Envasadora</option>
                <option value="Outro">Outro Fornecedor</option>
              </select>
            </div>
          </div>

          <div className="form-clean-grid two">
            <div className="form-group-clean">
              <label className="field-label-clean">
                <Phone size={14} /> Telefone / WhatsApp *
              </label>
              <input
                type="text"
                placeholder="Ex: (31) 98765-4321"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="admin-form-input"
                required
              />
            </div>

            <div className="form-group-clean">
              <label className="field-label-clean">CNPJ ou CPF (Opcional)</label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="form-clean-grid two">
            <div className="form-group-clean">
              <label className="field-label-clean">
                <MapPin size={14} /> Cidade
              </label>
              <input
                type="text"
                placeholder="Ex: Belo Horizonte"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="admin-form-input"
              />
            </div>

            <div className="form-group-clean">
              <label className="field-label-clean">Estado (UF)</label>
              <input
                type="text"
                maxLength={2}
                placeholder="MG"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="admin-form-input"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="form-group-clean">
            <label className="field-label-clean">
              <FileText size={14} /> Observações & Condições de Pagamento / Envio
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Frete grátis acima de 20 un, pagamento faturado no boleto 14 dias..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="admin-form-input"
            />
          </div>

          {/* Footer Submit */}
          <div className="modal-clean-footer">
            <button type="button" className="btn-platform-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-platform-primary">
              <Save size={16} /> {isEditing ? 'Salvar Fornecedor' : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
