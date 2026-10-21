import React, { useState, useMemo, useEffect } from 'react';
import Pagination from './Pagination';
import {
  Plus,
  Search,
  Filter,
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  MessageCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  User,
  Calendar,
  X,
  Edit,
  Handshake,
  RotateCcw,
  MapPin,
  Copy,
  Check,
  Undo
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'todos', label: 'Todos os Pedidos' },
  { id: 'pendente', label: '⏳ Pendentes', countKey: 'pendente' },
  { id: 'confirmado', label: '📋 Confirmados', countKey: 'confirmado' },
  { id: 'em-rota', label: '🚚 Em Rota', countKey: 'em-rota' },
  { id: 'entregue', label: '📬 Entregues', countKey: 'entregue' },
  { id: 'acerto', label: '🤝 Acerto', countKey: 'acerto' },
  { id: 'concluido', label: '✅ Concluídos', countKey: 'concluido' },
  { id: 'cancelado', label: '❌ Cancelados', countKey: 'cancelado' }
];

export default function OrdersManager({
  orders,
  onOpenNewOrderModal,
  onOpenOrderDetail,
  onOpenAcerto,
  onUpdateOrderStatus,
  onUpdateOrderDue,
  onTogglePaymentStatus,
  onDeleteOrder,
  onCloneOrder,
  onToast
}) {
  const [activeStatus, setActiveStatus] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'pago', 'pendente'
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery, paymentFilter]);

  // Formatter
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const parseSafeDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }
    const str = String(val).trim();
    if (!str || str === 'Invalid Date' || str === 'null' || str === 'undefined') return null;

    // Formato ISO: YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0);
    }

    // Formato brasileiro: DD/MM/YYYY
    const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) {
      return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]), 12, 0, 0);
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const toIsoDateInput = (val) => {
    const d = parseSafeDate(val);
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDate = (str) => {
    const d = parseSafeDate(str);
    if (!d) return '-';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Summary KPIs
  const stats = useMemo(() => {
    let totalVenda = 0;
    let totalCusto = 0;
    let totalLucro = 0;
    let countPendente = 0;
    let countPago = 0;

    orders.forEach((o) => {
      if (o.status !== 'cancelado') {
        const v = o.totais?.valorTotal || o.total || 0;
        const c = o.totais?.custoTotal || o.totalCusto || 0;
        totalVenda += v;
        totalCusto += c;
        totalLucro += v - c;

        if (o.financeiro?.statusPagamento === 'pago') {
          countPago++;
        } else {
          countPendente++;
        }
      }
    });

    const countsByStatus = {};
    orders.forEach((o) => {
      countsByStatus[o.status] = (countsByStatus[o.status] || 0) + 1;
    });

    const margemGlobal = totalCusto > 0 ? (totalLucro / totalCusto) * 100 : 0;

    return {
      totalPedidos: orders.length,
      totalVenda,
      totalCusto,
      totalLucro,
      margemGlobal,
      countPendente,
      countPago,
      countsByStatus
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return orders.filter((o) => {
      // Status filter
      if (activeStatus !== 'todos' && o.status !== activeStatus) return false;

      // Payment status filter
      if (paymentFilter === 'pago' && o.financeiro?.statusPagamento !== 'pago') return false;
      if (paymentFilter === 'pendente' && o.financeiro?.statusPagamento === 'pago') return false;

      if (!q) return true;

      // Search in id, client name, phone, items
      const matchId = o.id?.toLowerCase().includes(q);
      const matchClient = o.cliente?.nome?.toLowerCase().includes(q);
      const matchPhone = o.cliente?.telefone?.includes(q);
      const matchCity = o.cliente?.endereco?.cidade?.toLowerCase().includes(q);
      const matchItems = (o.itens || []).some(
        (i) => i.nome?.toLowerCase().includes(q) || i.cod?.toLowerCase().includes(q)
      );

      return matchId || matchClient || matchPhone || matchCity || matchItems;
    });
  }, [orders, activeStatus, searchQuery, paymentFilter]);

  // Selection toggle
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  // WhatsApp sender
  const sendWhatsApp = (order) => {
    const phone = order.cliente?.telefone?.replace(/\D/g, '') || '';
    const cliente = order.cliente?.nome || 'Cliente';
    const itemsText = (order.itens || [])
      .map((i) => `• ${i.qtd}x ${i.cod} (${i.nome}) - R$ ${(i.precoVenda || 0).toFixed(2)}`)
      .join('\n');

    const total = order.totais?.valorTotal || order.total || 0;
    const msg = [
      `Olá ${cliente}, tudo bem? Aqui é da *Snack Store BH*! 🛍️`,
      `Segue o resumo do seu pedido *#${order.id}*:`,
      ``,
      itemsText,
      ``,
      `💰 *Total:* R$ ${total.toFixed(2)}`,
      `📦 *Status:* ${order.status.toUpperCase()}`,
      order.dataVencimento ? `📅 *Vencimento:* ${formatDate(order.dataVencimento)}` : '',
      ``,
      `Chave PIX: *contato@snackstorebh.com.br*`,
      `Qualquer dúvida estamos à disposição!`
    ].filter(Boolean).join('\n');

    if (phone.length >= 10) {
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } else {
      navigator.clipboard?.writeText(msg);
      onToast && onToast('Mensagem copiada para a área de transferência! (Telefone incompleto)');
    }
  };

  // Google Maps URL
  const getMapsUrl = (order) => {
    const e = order.cliente?.endereco || {};
    const parts = [e.rua, e.numero, e.bairro, e.cidade, e.estado, e.cep].filter(Boolean);
    if (parts.length === 0) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(', '))}`;
  };

  return (
    <div className="orders-clean-platform">
      {/* Platform Header & Toolbar */}
      <div className="platform-header-row">
        <div>
          <h2 className="platform-title">Gestão de Pedidos</h2>
          <p className="platform-subtitle">
            Acompanhe o fluxo comercial do pré-pedido até a entrega, acerto e quitação contábil.
          </p>
        </div>

        <div className="platform-header-actions">
          <button className="btn-platform-primary" onClick={onOpenNewOrderModal}>
            <Plus size={16} />
            <span>Criar Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (ChatGPT / Modern SaaS Style) */}
      <div className="metrics-clean-grid">
        <div className="metric-clean-card">
          <span className="card-lbl">Total de Pedidos</span>
          <strong className="card-val">{stats.totalPedidos}</strong>
          <small className="card-hint">Cadastrados no sistema</small>
        </div>

        <div className="metric-clean-card">
          <span className="card-lbl">Faturamento Total</span>
          <strong className="card-val gold">{formatMoney(stats.totalVenda)}</strong>
          <small className="card-hint">Receita bruta prevista</small>
        </div>

        <div className="metric-clean-card">
          <span className="card-lbl">Custo CMV dos Pedidos</span>
          <strong className="card-val muted">{formatMoney(stats.totalCusto)}</strong>
          <small className="card-hint">Custo real dos produtos</small>
        </div>

        <div className="metric-clean-card">
          <span className="card-lbl">Lucro Previsto</span>
          <strong className="card-val green">+{formatMoney(stats.totalLucro)}</strong>
          <small className="card-hint">Margem média {stats.margemGlobal.toFixed(0)}%</small>
        </div>
      </div>

      {/* Status Pipeline Tabs */}
      <div className="orders-pipeline-pills">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'todos' ? orders.length : stats.countsByStatus[tab.id] || 0;
          return (
            <button
              key={tab.id}
              className={`pipeline-pill-btn ${activeStatus === tab.id ? 'active' : ''}`}
              onClick={() => setActiveStatus(tab.id)}
            >
              <span>{tab.label}</span>
              {count > 0 && <span className="pill-badge-num">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="orders-search-filter-bar">
        <div className="search-box-clean">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone, cidade, ID ou perfume..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="filter-select-wrap">
          <Filter size={14} />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-pay-select"
          >
            <option value="all">Todos Pagamentos</option>
            <option value="pago">Apenas Pagos</option>
            <option value="pendente">Apenas Pendentes</option>
          </select>
        </div>
      </div>

      {/* Clean Orders List / Table (Exact THSM Workflow) */}
      <div className="orders-table-container">
        <div className="table-mobile-hint">
          <span>⇄ Deslize horizontalmente para ver valores, vencimentos, status e ações</span>
        </div>
        <table className="orders-platform-table">
          <thead>
            <tr>
              <th style={{ width: '38px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredOrders.length}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Cliente / Contato</th>
              <th>Cidade / Região</th>
              <th>Data</th>
              <th>Vencimento</th>
              <th>Itens</th>
              <th>Valor Total</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((o) => {
              const isSelected = selectedIds.has(o.id);
              const total = Number(
                o.totais?.valorTotal ??
                o.totalCobrar ??
                o.total ??
                o.financeiro?.valorTotal ??
                o.financeiro?.totalVenda ??
                (Array.isArray(o.itens) ? o.itens.reduce((s, i) => s + (Number(i.precoVenda || i.preco || 0) * Number(i.qtd || i.qty || 1)), 0) : 0)
              );
              const custo = Number(
                o.totais?.custoTotal ??
                o.totalCusto ??
                o.financeiro?.totalCusto ??
                o.financeiro?.valorCusto ??
                0
              );
              const lucro = total - custo;
              const totalQtd = Number(
                o.totais?.qtdItens ??
                (o.itens || []).reduce((s, i) => s + Number(i.qtd || i.qty || 0), 0)
              );
              const pagoVal = o.totalPago !== undefined && o.totalPago !== null
                ? Number(o.totalPago)
                : (o.financeiro?.valorRecebido !== undefined && o.financeiro?.valorRecebido !== null
                    ? Number(o.financeiro.valorRecebido)
                    : (o.financeiro?.statusPagamento === 'pago' ? total : 0));
              const abertoVal = o.valorEmAberto !== undefined && o.valorEmAberto !== null
                ? Number(o.valorEmAberto)
                : (o.financeiro?.valorEmAberto !== undefined && o.financeiro?.valorEmAberto !== null
                    ? Number(o.financeiro.valorEmAberto)
                    : Math.max(0, Math.round((total - pagoVal) * 100) / 100));
              const isPago = abertoVal === 0 && (total > 0 || o.financeiro?.statusPagamento === 'pago');
              const isParcial = pagoVal > 0 && abertoVal > 0;
              const mapsUrl = getMapsUrl(o);

              return (
                <tr key={o.id} className={isSelected ? 'row-selected' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(o.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>

                  {/* Cliente */}
                  <td>
                    <div className="client-cell-info">
                      <strong className="client-name-bold">{o.cliente?.nome || 'Cliente'}</strong>
                      <span className="client-phone-sub">{o.cliente?.telefone || '-'}</span>
                    </div>
                  </td>

                  {/* Cidade */}
                  <td>
                    <span className="city-label">
                      {[o.cliente?.endereco?.cidade, o.cliente?.endereco?.estado].filter(Boolean).join('/') || 'BH / MG'}
                    </span>
                  </td>

                  {/* Data */}
                  <td>
                    <span className="date-label">{formatDate(o.dataPedido || o.date)}</span>
                  </td>

                  {/* Vencimento (Inline Date Edit) */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={toIsoDateInput(o.dataVencimento)}
                      onChange={(e) => onUpdateOrderDue && onUpdateOrderDue(o.id, e.target.value)}
                      className="inline-date-input"
                    />
                  </td>

                  {/* Itens */}
                  <td>
                    <span className="items-qty-tag">{totalQtd} un</span>
                  </td>

                  {/* Valor Total */}
                  <td>
                    <div className="price-cell-box">
                      <strong className="price-val">{formatMoney(total)}</strong>
                      {abertoVal > 0 ? (
                        <span style={{ color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700 }}>
                          Aberto: {formatMoney(abertoVal)}
                        </span>
                      ) : custo > 0 ? (
                        <span className="profit-micro-tag">
                          +{formatMoney(lucro)}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Pagamento */}
                  <td>
                    <button
                      className={`status-pay-badge ${isPago ? 'pago' : isParcial ? 'parcial' : 'pendente'}`}
                      onClick={() => onTogglePaymentStatus && onTogglePaymentStatus(o.id)}
                      title="Clique para alternar status financeiro"
                    >
                      {isPago ? '✓ Quitado' : isParcial ? `🟡 Parcial (${formatMoney(pagoVal)})` : '⏳ A Receber'}
                    </button>
                  </td>

                  {/* Status Etapa */}
                  <td>
                    <span className={`order-status-pill status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>

                  {/* AÇÕES (DISPONÍVEL EM TODOS OS STATUS) */}
                  <td>
                    <div className="table-actions-row">
                      {/* WhatsApp */}
                      <button
                        className="btn-action-icon wa"
                        title="Enviar WhatsApp"
                        onClick={() => sendWhatsApp(o)}
                      >
                        <MessageCircle size={14} />
                      </button>

                      {/* Ver Detalhes */}
                      <button
                        className="btn-action-icon eye"
                        title="Ver Detalhes do Pedido"
                        onClick={() => onOpenOrderDetail(o, 'view')}
                      >
                        <Eye size={14} />
                      </button>

                      {/* Editar Pedido e Cliente (DISPONÍVEL EM TODOS OS STATUS) */}
                      <button
                        className="btn-action-icon edit"
                        title="Editar dados do cliente, itens e valores deste pedido"
                        onClick={() => onOpenOrderDetail(o, 'edit')}
                      >
                        <Edit size={14} />
                      </button>

                      {/* SE PENDENTE: Em Rota */}
                      {o.status === 'pendente' && (
                        <button
                          className="btn-action-icon deliver"
                          title="Em Rota (Próxima Etapa)"
                          onClick={() => onUpdateOrderStatus(o.id, 'em-rota')}
                        >
                          <Truck size={14} />
                        </button>
                      )}

                      {/* SE CONFIRMADO: Em Rota */}
                      {o.status === 'confirmado' && (
                        <button
                          className="btn-action-icon deliver"
                          title="Enviar para Em Rota"
                          onClick={() => onUpdateOrderStatus(o.id, 'em-rota')}
                        >
                          <Truck size={14} />
                        </button>
                      )}

                      {/* SE EM ROTA: Entregue */}
                      {o.status === 'em-rota' && (
                        <button
                          className="btn-action-icon confirm"
                          title="Marcar como Entregue (Próxima Etapa)"
                          onClick={() => onUpdateOrderStatus(o.id, 'entregue')}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}

                      {/* SE ENTREGUE: Voltar para Em Rota + Fazer Acerto */}
                      {o.status === 'entregue' && (
                        <>
                          <button
                            className="btn-action-icon undo"
                            title="Voltar para Em Rota"
                            onClick={() => onUpdateOrderStatus(o.id, 'em-rota')}
                          >
                            <Undo size={14} />
                          </button>
                          <button
                            className="btn-action-icon acerto"
                            title="Fazer Acerto (Avançar etapa)"
                            onClick={() => onOpenAcerto(o, 'acerto')}
                          >
                            <Handshake size={14} />
                          </button>
                        </>
                      )}

                      {/* SE ACERTO: Voltar para Entregues + Editar Acerto + Finalizar Pedido */}
                      {o.status === 'acerto' && (
                        <>
                          <button
                            className="btn-action-icon undo"
                            title="Voltar para Entregues"
                            onClick={() => onUpdateOrderStatus(o.id, 'entregue')}
                          >
                            <Undo size={14} />
                          </button>
                          <button
                            className="btn-action-icon edit-acerto"
                            title="Editar Acerto"
                            onClick={() => onOpenAcerto(o, 'acerto')}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-action-icon finalize"
                            title="Finalizar Pedido"
                            onClick={() => onOpenAcerto(o, 'finalizar')}
                          >
                            <Check size={14} />
                          </button>
                        </>
                      )}

                      {/* SE CONCLUÍDO: Voltar para Acertos */}
                      {o.status === 'concluido' && (
                        <button
                          className="btn-action-icon undo"
                          title="Voltar este pedido para Acertos (reverte pagamentos e devoluções)"
                          onClick={() => onUpdateOrderStatus(o.id, 'acerto')}
                        >
                          <Undo size={14} />
                        </button>
                      )}

                      {/* Google Maps */}
                      {mapsUrl && (
                        <button
                          className="btn-action-icon map"
                          title="Abrir endereço no Google Maps"
                          onClick={() => window.open(mapsUrl, '_blank')}
                        >
                          <MapPin size={14} />
                        </button>
                      )}

                      {/* Clonar Pedido */}
                      <button
                        className="btn-action-icon clone"
                        title="Clonar Pedido"
                        onClick={() => onCloneOrder && onCloneOrder(o)}
                      >
                        <Copy size={14} />
                      </button>

                      {/* Excluir Pedido */}
                      <button
                        className="btn-action-icon delete"
                        title="Excluir Pedido"
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir o pedido #${o.id}?`)) {
                            onDeleteOrder(o.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-table-cell">
                  <div className="empty-state-wrap">
                    <ShoppingBag size={28} opacity={0.3} />
                    <p>Nenhum pedido encontrado nesta etapa ou com os filtros selecionados.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      )}
    </div>
  );
}
