import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  MessageCircle,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Edit,
  Save,
  Plus,
  Trash2,
  Building2,
  Users,
  Search,
  Handshake,
  RotateCcw
} from 'lucide-react';

const STATUS_MAP = {
  pendente: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock },
  confirmado: { label: 'Confirmado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Package },
  'em-rota': { label: 'Em Rota', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', icon: Truck },
  entregue: { label: 'Entregue', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', icon: CheckCircle2 },
  acerto: { label: 'Acerto', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', icon: Handshake },
  concluido: { label: 'Concluído', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: ShieldCheck },
  cancelado: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertCircle }
};

function toIsoDateInput(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str || str === 'Invalid Date' || str === 'null' || str === 'undefined') return '';
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

function formatDisplayDate(val) {
  const iso = toIsoDateInput(val);
  if (!iso) return '-';
  const parts = iso.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function OrderDetailModal({
  order,
  initialMode = 'view', // 'view' or 'edit'
  products = [],
  suppliers = [],
  onClose,
  onSaveOrder,
  onUpdateStatus,
  onTogglePayment,
  onToast
}) {
  if (!order) return null;

  const [isEditing, setIsEditing] = useState(initialMode === 'edit');

  // Customer Editable State
  const [nome, setNome] = useState(order.cliente?.nome || '');
  const [telefone, setTelefone] = useState(order.cliente?.telefone || '');
  const [cpf, setCpf] = useState(order.cliente?.cpf || '');
  const [endereco, setEndereco] = useState({
    cep: order.cliente?.endereco?.cep || '',
    rua: order.cliente?.endereco?.rua || '',
    numero: order.cliente?.endereco?.numero || '',
    bairro: order.cliente?.endereco?.bairro || '',
    cidade: order.cliente?.endereco?.cidade || 'Belo Horizonte',
    estado: order.cliente?.endereco?.estado || 'MG',
    complemento: order.cliente?.endereco?.complemento || ''
  });

  // Order Details Editable State
  const [status, setStatus] = useState(order.status || 'pendente');
  const [dataPedido, setDataPedido] = useState(() => {
    return toIsoDateInput(order.dataPedido) || toIsoDateInput(order.createdAt) || new Date().toISOString().slice(0, 10);
  });
  const [dataVencimento, setDataVencimento] = useState(() => {
    return toIsoDateInput(order.dataVencimento);
  });
  const [formaPagamento, setFormaPagamento] = useState(order.formaPagamento || order.paymentMethod || 'pix');
  const [observacoes, setObservacoes] = useState(order.observacoes || '');

  // Items Editable State
  const [items, setItems] = useState(() => {
    return (order.itens || order.items || []).map((it, idx) => ({
      lineId: it.lineId || `${it.sku || it.id || idx}_${Date.now()}_${idx}`,
      sku: it.sku || it.id,
      cod: it.cod || it.codigo || 'PERF',
      nome: it.nome || it.cleanName || it.name || 'Perfume',
      ref: it.ref || '',
      volume: it.volume || '100ml',
      qtd: Number(it.qtd || it.qty || 1),
      precoVenda: Number(it.precoVenda !== undefined ? it.precoVenda : (it.preco || 0)),
      precoCusto: Number(it.precoCusto !== undefined ? it.precoCusto : (it.custo || 0)),
      isEstoqueProprio: it.isEstoqueProprio !== false,
      fornecedorOrigem: it.fornecedorOrigem || 'Próprio'
    }));
  });

  // Adding product search in Edit mode
  const [addSearch, setAddSearch] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  const filteredCatalog = useMemo(() => {
    const q = addSearch.toLowerCase().trim();
    if (!q) return [];
    return products.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q) || p.cleanName?.toLowerCase().includes(q);
      const matchCod = p.cod?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      const matchRef = p.ref?.toLowerCase().includes(q);
      return matchName || matchCod || matchRef;
    }).slice(0, 6);
  }, [products, addSearch]);

  const handleAddItemFromCatalog = (prod, priceType = 'varejo') => {
    const sale = priceType === 'atacado' ? Number(prod.precoAtacado || 50) : Number(prod.precoVarejo || 139.9);
    const cost = Number(prod.precoCompra || 37);

    setItems((prev) => [
      ...prev,
      {
        lineId: `${prod.sku}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sku: prod.sku,
        cod: prod.cod,
        nome: prod.cleanName || prod.name,
        ref: prod.ref || '',
        volume: prod.volume || '100ml',
        qtd: 1,
        precoVenda: sale,
        precoCusto: cost,
        isEstoqueProprio: true,
        fornecedorOrigem: 'Próprio'
      }
    ]);
    setAddSearch('');
    setShowAddDropdown(false);
    onToast && onToast(`+ ${prod.cod} adicionado ao pedido! 🛍️`);
  };

  const handleUpdateItem = (lineId, field, val) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.lineId !== lineId) return it;
        if (field === 'qtd') return { ...it, qtd: Math.max(1, parseInt(val) || 1) };
        if (field === 'precoVenda') return { ...it, precoVenda: Math.max(0, parseFloat(val) || 0) };
        if (field === 'precoCusto') return { ...it, precoCusto: Math.max(0, parseFloat(val) || 0) };
        if (field === 'fornecedorOrigem') return { ...it, fornecedorOrigem: val };
        if (field === 'isEstoqueProprio') return { ...it, isEstoqueProprio: val };
        return it;
      })
    );
  };

  const handleRemoveItem = (lineId) => {
    if (items.length <= 1) {
      alert('O pedido deve conter pelo menos 1 perfume!');
      return;
    }
    setItems((prev) => prev.filter((it) => it.lineId !== lineId));
  };

  // Recalculated Summary Totals
  const totals = useMemo(() => {
    let totalVenda = 0;
    let totalCusto = 0;
    let totalQtd = 0;

    items.forEach((it) => {
      totalVenda += it.precoVenda * it.qtd;
      totalCusto += it.precoCusto * it.qtd;
      totalQtd += it.qtd;
    });

    const lucroBruto = totalVenda - totalCusto;
    const margem = totalCusto > 0 ? (lucroBruto / totalCusto) * 100 : 0;

    return {
      totalVenda,
      totalCusto,
      totalQtd,
      lucroBruto,
      margem
    };
  }, [items]);

  const statusConfig = STATUS_MAP[status] || STATUS_MAP.pendente;
  const StatusIcon = statusConfig.icon;
  const isPago = order.financeiro?.statusPagamento === 'pago';

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Save changes
  const handleSaveAll = () => {
    if (!nome.trim()) {
      alert('Por favor, informe o nome do cliente!');
      return;
    }
    if (items.length === 0) {
      alert('O pedido precisa ter ao menos 1 item!');
      return;
    }

    const cleanDataPedido = toIsoDateInput(dataPedido) || toIsoDateInput(order.dataPedido) || new Date().toISOString().slice(0, 10);
    const cleanDataVencimento = toIsoDateInput(dataVencimento) || null;

    const totalCobrar = Math.round(totals.totalVenda * 100) / 100;
    const isNowPago = isPago || order.financeiro?.statusPagamento === 'pago';
    const totalPago = isNowPago ? totalCobrar : Number(order.totalPago ?? order.financeiro?.valorRecebido ?? 0);
    const valorEmAberto = isNowPago ? 0 : Math.max(0, Math.round((totalCobrar - totalPago) * 100) / 100);

    const updated = {
      ...order,
      status,
      dataPedido: cleanDataPedido,
      dataVencimento: cleanDataVencimento,
      formaPagamento,
      observacoes: observacoes.trim(),
      totalCobrar,
      totalPago,
      valorEmAberto,
      cliente: {
        ...order.cliente,
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim(),
        endereco: { ...endereco }
      },
      itens: items.map((it) => ({
        ...it,
        subtotalVenda: it.precoVenda * it.qtd,
        subtotalCusto: it.precoCusto * it.qtd,
        lucroItem: (it.precoVenda - it.precoCusto) * it.qtd
      })),
      totais: {
        ...order.totais,
        qtdItens: totals.totalQtd,
        valorTotal: totalCobrar,
        custoTotal: totals.totalCusto,
        lucroBruto: totals.lucroBruto,
        margemLucro: totals.margem
      },
      financeiro: {
        ...order.financeiro,
        valorTotal: totalCobrar,
        valorCusto: totals.totalCusto,
        lucroBruto: totals.lucroBruto,
        margemLucro: totals.margem,
        valorRecebido: totalPago,
        valorPago: totalPago,
        valorEmAberto: valorEmAberto,
        statusPagamento: valorEmAberto === 0 ? 'pago' : (totalPago > 0 ? 'parcial' : 'pendente')
      }
    };

    onSaveOrder && onSaveOrder(updated);
    setIsEditing(false);
    onToast && onToast(`Pedido #${order.id} e dados do cliente atualizados com sucesso! ✏️✅`);
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    let msg = `💎 *SNACK STORE BH — DETALHES DO PEDIDO #${order.id}* 💎\n`;
    msg += `👤 *Cliente:* ${nome}\n`;
    msg += `📅 *Data:* ${formatDisplayDate(dataPedido)}\n`;
    msg += `🚚 *Status:* ${statusConfig.label}\n\n`;
    msg += `📦 *ITENS DO PEDIDO:*\n`;

    items.forEach((it) => {
      msg += `• *${it.qtd}x ${it.cod} - ${it.nome}*\n`;
      msg += `  Preço: ${formatMoney(it.precoVenda)} cada (Total: ${formatMoney(it.precoVenda * it.qtd)})\n`;
    });

    msg += `\n💰 *VALOR TOTAL: ${formatMoney(totals.totalVenda)}*\n`;
    msg += `💳 *Forma de Pagamento:* ${formaPagamento.toUpperCase()}\n`;
    msg += `📌 *Status do Pagamento:* ${isPago ? 'PAGO / QUITADO ✅' : 'PENDENTE DE PAGAMENTO ⏳'}\n\n`;
    msg += `🔑 *Chave Pix:* contato@snackstorebh.com.br\n`;
    msg += `Obrigado pela preferência! Qualquer dúvida estamos à disposição. ✨`;

    const phoneDigits = telefone.replace(/\D/g, '');
    const encoded = encodeURIComponent(msg);

    if (phoneDigits) {
      const fullPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      navigator.clipboard?.writeText(msg);
      onToast && onToast('Mensagem do pedido copiada para a área de transferência! 💬✅');
    }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="order-detail-modal-clean" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="order-detail-header-clean">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: statusConfig.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statusConfig.color
              }}
            >
              <StatusIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {isEditing ? 'Editar Pedido' : 'Detalhes do Pedido'} #{order.id?.slice(-6) || order.id}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                Cliente: <strong style={{ color: '#d4d4d8' }}>{nome || 'Não identificado'}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`btn-platform-secondary ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing((prev) => !prev)}
              title={isEditing ? 'Voltar para modo visualização' : 'Editar cliente e itens deste pedido'}
            >
              <Edit size={14} />
              <span>{isEditing ? 'Modo Visualização' : 'Editar Pedido'}</span>
            </button>

            <button className="admin-modal-close" onClick={onClose} title="Fechar">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="order-detail-body-clean">
          {/* Top Banner: Status & Payment Controls */}
          <div className="order-status-banner-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa' }}>
                Etapa do Pedido:
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  onUpdateStatus && onUpdateStatus(e.target.value);
                }}
                className="admin-form-select"
                style={{ height: 32, fontSize: '0.78rem', width: 170 }}
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="confirmado">📋 Confirmado</option>
                <option value="em-rota">🚚 Em Rota</option>
                <option value="entregue">📬 Entregue</option>
                <option value="acerto">🤝 Acerto</option>
                <option value="concluido">✅ Concluído</option>
                <option value="cancelado">❌ Cancelado</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa' }}>
                Status Financeiro:
              </label>
              <button
                type="button"
                className={`status-pay-badge ${isPago ? 'pago' : 'pendente'}`}
                onClick={() => onTogglePayment && onTogglePayment()}
                title="Clique para alternar status financeiro"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                {isPago ? '✓ Pago / Quitado' : '⏳ Pagamento Pendente'}
              </button>
            </div>
          </div>

          {/* Customer & Delivery Information Card */}
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#10b981" />
              <strong style={{ fontSize: '0.86rem', color: '#fff' }}>
                {isEditing ? 'Editar Dados do Cliente' : 'Dados do Cliente & Entrega'}
              </strong>
            </div>

            {isEditing ? (
              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="admin-form-input mini"
                    placeholder="Nome completo"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="admin-form-input mini"
                    placeholder="31 99999-9999"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="admin-form-input mini"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">CEP</label>
                  <input
                    type="text"
                    value={endereco.cep}
                    onChange={(e) => setEndereco((prev) => ({ ...prev, cep: e.target.value }))}
                    className="admin-form-input mini"
                    placeholder="30000-000"
                  />
                </div>

                <div className="form-group-clean full-width">
                  <label className="field-label-clean">Endereço (Rua, Número, Bairro, Cidade/UF)</label>
                  <div className="address-inputs-grid">
                    <input
                      type="text"
                      placeholder="Rua / Logradouro"
                      value={endereco.rua}
                      onChange={(e) => setEndereco((prev) => ({ ...prev, rua: e.target.value }))}
                      className="admin-form-input mini"
                    />
                    <input
                      type="text"
                      placeholder="Nº"
                      value={endereco.numero}
                      onChange={(e) => setEndereco((prev) => ({ ...prev, numero: e.target.value }))}
                      className="admin-form-input mini"
                    />
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={endereco.bairro}
                      onChange={(e) => setEndereco((prev) => ({ ...prev, bairro: e.target.value }))}
                      className="admin-form-input mini"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-clean-grid two" style={{ fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#71717a' }}>Cliente:</span>{' '}
                  <strong style={{ color: '#fff' }}>{nome}</strong>
                  <br />
                  <span style={{ color: '#71717a' }}>Telefone:</span>{' '}
                  <span style={{ color: '#38bdf8' }}>{telefone || 'Não informado'}</span>
                  {cpf && (
                    <>
                      <br />
                      <span style={{ color: '#71717a' }}>CPF:</span> {cpf}
                    </>
                  )}
                </div>

                <div>
                  <span style={{ color: '#71717a' }}>Entrega:</span>{' '}
                  <span>
                    {[endereco.rua, endereco.numero, endereco.bairro].filter(Boolean).join(', ') || 'A combinar'}
                  </span>
                  <br />
                  <span style={{ color: '#71717a' }}>Cidade:</span>{' '}
                  <span>
                    {[endereco.cidade, endereco.estado].filter(Boolean).join('/') || 'Belo Horizonte/MG'}{' '}
                    {endereco.cep ? `(CEP: ${endereco.cep})` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order Details (Dates & Payment) */}
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="#3b82f6" />
              <strong style={{ fontSize: '0.86rem', color: '#fff' }}>Condições & Vencimento</strong>
            </div>

            <div className="form-clean-grid three">
              <div className="form-group-clean">
                <label className="field-label-clean">Data do Pedido</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    className="admin-form-input mini"
                  />
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#fff' }}>
                    {formatDisplayDate(dataPedido)}
                  </span>
                )}
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Data de Vencimento</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="admin-form-input mini"
                  />
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
                    {dataVencimento ? formatDisplayDate(dataVencimento) : 'À vista / A combinar'}
                  </span>
                )}
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Forma de Pagamento</label>
                {isEditing ? (
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="admin-form-select mini"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="misto">Misto</option>
                    <option value="a-prazo">A Prazo</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#fff', textTransform: 'uppercase', fontWeight: 700 }}>
                    {formaPagamento}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} color="#f59e0b" />
                <strong style={{ fontSize: '0.86rem', color: '#fff' }}>
                  Perfumes no Pedido ({totals.totalQtd} frascos)
                </strong>
              </div>

              {isEditing && (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Search size={13} color="#71717a" />
                    <input
                      type="text"
                      placeholder="Adicionar perfume..."
                      value={addSearch}
                      onChange={(e) => {
                        setAddSearch(e.target.value);
                        setShowAddDropdown(true);
                      }}
                      onFocus={() => setShowAddDropdown(true)}
                      className="admin-form-input mini"
                      style={{ width: 200 }}
                    />
                  </div>

                  {showAddDropdown && filteredCatalog.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 100,
                        background: '#121215',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                        width: 320,
                        maxHeight: 250,
                        overflowY: 'auto',
                        marginTop: 4,
                        padding: 4
                      }}
                    >
                      {filteredCatalog.map((p) => (
                        <div
                          key={p.sku}
                          style={{
                            padding: '6px 8px',
                            borderBottom: '1px solid #27272a',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.78rem'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#fff' }}>{p.cleanName || p.name}</strong>
                            <small style={{ display: 'block', color: '#71717a' }}>{p.cod} • Ref: {p.ref}</small>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn-add-quick atc"
                              onClick={() => handleAddItemFromCatalog(p, 'atacado')}
                              title="Adicionar no Atacado"
                            >
                              + Atc
                            </button>
                            <button
                              type="button"
                              className="btn-add-quick varj"
                              onClick={() => handleAddItemFromCatalog(p, 'varejo')}
                              title="Adicionar no Varejo"
                            >
                              + Var
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="order-items-edit-table">
                <thead>
                  <tr>
                    <th>Perfume</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Qtd</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Venda Unit.</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Custo Unit.</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Subtotal</th>
                    <th>Origem / Fornecedor</th>
                    {isEditing && <th style={{ width: 40, textAlign: 'center' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const subtotal = it.precoVenda * it.qtd;
                    const lucroItem = (it.precoVenda - it.precoCusto) * it.qtd;

                    return (
                      <tr key={it.lineId}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#fff', fontSize: '0.82rem' }}>
                              {it.nome}
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#71717a' }}>
                              {it.cod} {it.ref ? `• ${it.ref}` : ''}
                            </span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={it.qtd}
                              onChange={(e) => handleUpdateItem(it.lineId, 'qtd', e.target.value)}
                              style={{ width: 60, textAlign: 'center' }}
                            />
                          ) : (
                            <span className="items-qty-tag">{it.qtd} un</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              value={it.precoVenda}
                              onChange={(e) => handleUpdateItem(it.lineId, 'precoVenda', e.target.value)}
                              style={{ width: 85, textAlign: 'right', color: '#10b981', fontWeight: 700 }}
                            />
                          ) : (
                            <strong style={{ color: '#10b981' }}>{formatMoney(it.precoVenda)}</strong>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              value={it.precoCusto}
                              onChange={(e) => handleUpdateItem(it.lineId, 'precoCusto', e.target.value)}
                              style={{ width: 85, textAlign: 'right', color: '#f59e0b' }}
                            />
                          ) : (
                            <span style={{ color: '#f59e0b' }}>{formatMoney(it.precoCusto)}</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#fff' }}>{formatMoney(subtotal)}</strong>
                          <small style={{ display: 'block', color: lucroItem >= 0 ? '#34d399' : '#f43f5e', fontSize: '0.68rem' }}>
                            +{formatMoney(lucroItem)}
                          </small>
                        </td>

                        <td>
                          {isEditing ? (
                            <select
                              value={it.fornecedorOrigem || 'Próprio'}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateItem(it.lineId, 'fornecedorOrigem', val);
                                if (val === 'Próprio') {
                                  handleUpdateItem(it.lineId, 'isEstoqueProprio', true);
                                } else {
                                  handleUpdateItem(it.lineId, 'isEstoqueProprio', false);
                                  // Auto-fill cost if perfume has a linked quota with this supplier
                                  const prod = products.find((p) => p.sku === it.sku);
                                  if (prod && Array.isArray(prod.fornecedores)) {
                                    const cota = prod.fornecedores.find(
                                      (f) => f.nome?.toLowerCase() === val.toLowerCase()
                                    );
                                    if (cota && cota.precoCusto) {
                                      handleUpdateItem(it.lineId, 'precoCusto', Number(cota.precoCusto));
                                    }
                                  }
                                }
                              }}
                              style={{ width: 150, padding: '4px 6px', fontSize: '0.74rem' }}
                            >
                              <option value="Próprio">🏢 Próprio</option>
                              {suppliers.map((s) => {
                                const prod = products.find((p) => p.sku === it.sku);
                                const cota = prod?.fornecedores?.find(
                                  (f) => f.fornecedorId === s.id || f.nome?.toLowerCase() === s.nome?.toLowerCase()
                                );
                                return (
                                  <option key={s.id} value={s.nome}>
                                    🤝 {s.nome} {cota ? `(R$ ${cota.precoCusto})` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: it.fornecedorOrigem && it.fornecedorOrigem !== 'Próprio' ? '#60a5fa' : '#a1a1aa' }}>
                              {it.fornecedorOrigem || 'Próprio'}
                            </span>
                          )}
                        </td>

                        {isEditing && (
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(it.lineId)}
                              style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                              title="Remover item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Ribbon */}
            <div className="cart-ribbon-summary" style={{ marginTop: '0.5rem' }}>
              <div className="metric-box">
                <span>Total a Cobrar</span>
                <strong style={{ color: '#10b981' }}>{formatMoney(totals.totalVenda)}</strong>
              </div>
              <div className="metric-box">
                <span>Custo CMV Real</span>
                <strong style={{ color: '#f59e0b' }}>{formatMoney(totals.totalCusto)}</strong>
              </div>
              <div className="metric-box green">
                <span>Lucro Previsto</span>
                <strong>+{formatMoney(totals.lucroBruto)} ({totals.margem.toFixed(0)}%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="order-detail-footer-clean">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-platform-secondary" onClick={handleShareWhatsApp}>
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button className="btn-platform-secondary" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn-platform-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar Edição
                </button>
                <button
                  type="button"
                  className="btn-platform-primary"
                  onClick={handleSaveAll}
                >
                  <Save size={15} /> Salvar Alterações
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-platform-primary"
                onClick={() => setIsEditing(true)}
              >
                <Edit size={15} /> Editar Dados / Itens
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
