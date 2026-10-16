import React, { useState, useMemo } from 'react';
import {
  X,
  Handshake,
  CheckCircle2,
  Undo2,
  Copy,
  DollarSign,
  Percent,
  CreditCard,
  Banknote,
  RotateCcw,
  Tag,
  AlertCircle,
  Calendar,
  Check,
  Truck
} from 'lucide-react';

const PAG_METHODS = {
  pix: { label: 'PIX', icon: 'fa-bolt' },
  dinheiro: { label: 'Dinheiro', icon: 'fa-money-bill-1' },
  cartao: { label: 'Cartão', icon: 'fa-credit-card' },
  boleto: { label: 'Boleto', icon: 'fa-file-invoice' },
  misto: { label: 'Pagamento Misto', icon: 'fa-arrows-split-up-and-left' },
  'pix+dinheiro': { label: 'PIX + Dinheiro', icon: 'fa-arrows-split-up-and-left' },
  'pix+cartao': { label: 'PIX + Cartão', icon: 'fa-arrows-split-up-and-left' },
  'dinheiro+cartao': { label: 'Dinheiro + Cartão', icon: 'fa-arrows-split-up-and-left' }
};

export default function AcertoModal({
  order,
  mode = 'acerto', // 'acerto' or 'finalizar'
  onClose,
  onSaveAcerto,
  onToast
}) {
  if (!order) return null;

  const baseItems = order.originalItems && order.originalItems.length > 0
    ? order.originalItems
    : (order.itens || order.items || []);

  // Preços e custos editáveis por item
  const [deliveryItemPrices, setDeliveryItemPrices] = useState(() => {
    const init = {};
    baseItems.forEach((i, idx) => {
      const key = i.sku || i.id || idx;
      init[key] = i.precoVenda !== undefined ? String(i.precoVenda) : String(i.preco || 0);
    });
    return init;
  });

  const [deliveryItemCosts, setDeliveryItemCosts] = useState(() => {
    const init = {};
    baseItems.forEach((i, idx) => {
      const key = i.sku || i.id || idx;
      init[key] = i.precoCusto !== undefined ? String(i.precoCusto) : String(i.custo || 0);
    });
    return init;
  });

  // Quantidades devolvidas (não vendidas)
  const [returnQuantities, setReturnQuantities] = useState(() => {
    const init = {};
    if (order.returnedItems && Array.isArray(order.returnedItems)) {
      order.returnedItems.forEach((ri, idx) => {
        const key = ri.sku || ri.id || idx;
        init[key] = ri.returnedQty || ri.qty || 0;
      });
    }
    return init;
  });

  // Desconto
  const [deliveryDiscountType, setDeliveryDiscountType] = useState(
    order.descontoPercent ? 'percent' : 'reais'
  );
  const [deliveryDiscount, setDeliveryDiscount] = useState(
    order.descontoPercent ? String(order.descontoPercent) : (order.desconto ? String(order.desconto) : '')
  );

  // Pagamento
  const [deliveryPayment, setDeliveryPayment] = useState(() => {
    const pm = order.paymentMethod || order.formaPagamento || 'pix';
    if (pm === 'a-prazo' || pm === 'aprazo') return 'misto';
    return pm;
  });

  const [deliverySplits, setDeliverySplits] = useState(() => {
    const splits = order.paymentSplits || order.financeiro?.splits || {};
    return {
      pix: splits.pix !== undefined && splits.pix !== null && splits.pix !== '' ? String(splits.pix) : '',
      dinheiro: splits.dinheiro !== undefined && splits.dinheiro !== null && splits.dinheiro !== '' ? String(splits.dinheiro) : '',
      cartao: splits.cartao !== undefined && splits.cartao !== null && splits.cartao !== '' ? String(splits.cartao) : (splits.cartaoCredito ? String(splits.cartaoCredito) : ''),
      boleto: splits.boleto !== undefined && splits.boleto !== null && splits.boleto !== '' ? String(splits.boleto) : ''
    };
  });

  const [deliveryPaid, setDeliveryPaid] = useState(() => {
    if (order.totalPago !== undefined && order.totalPago !== null && order.totalPago !== '') return String(order.totalPago);
    if (order.financeiro?.valorRecebido !== undefined && order.financeiro?.valorRecebido !== null && order.financeiro?.valorRecebido !== '') return String(order.financeiro.valorRecebido);
    return '';
  });

  const [dataInicio, setDataInicio] = useState(order.dataInicio || order.dataPedido || new Date().toISOString().slice(0, 10));
  const [dataVencimento, setDataVencimento] = useState(order.dataVencimento || order.vencimento || '');

  // Formatador
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Cálculos automáticos do acerto
  const summary = useMemo(() => {
    let totalOriginal = 0;
    let totalDevolvido = 0;
    let totalCustoMantido = 0;

    baseItems.forEach((i, idx) => {
      const key = i.sku || i.id || idx;
      const maxQty = Number(i.qtd || i.qty || 0);
      const retQty = Math.max(0, Math.min(maxQty, Number(returnQuantities[key]) || 0));
      const keptQty = maxQty - retQty;

      const pUnit = Number(String(deliveryItemPrices[key] || 0).replace(',', '.')) || 0;
      const cUnit = Number(String(deliveryItemCosts[key] || 0).replace(',', '.')) || 0;

      totalOriginal += pUnit * maxQty;
      totalDevolvido += pUnit * retQty;
      totalCustoMantido += cUnit * keptQty;
    });

    const subtotalMantido = Math.max(0, totalOriginal - totalDevolvido);
    const discNum = Number(String(deliveryDiscount || 0).replace(',', '.')) || 0;
    const desconto = deliveryDiscountType === 'percent'
      ? (Math.min(100, Math.max(0, discNum)) / 100) * subtotalMantido
      : Math.max(0, Math.min(discNum, subtotalMantido));

    const totalCobrar = Math.max(0, Math.round((subtotalMantido - desconto) * 100) / 100);

    const isSplit = deliveryPayment === 'misto' || deliveryPayment.includes('+');
    const activeSplitKeys = deliveryPayment === 'misto'
      ? ['pix', 'dinheiro', 'cartao', 'boleto']
      : deliveryPayment.split('+');

    let totalPagoCalc = 0;
    if (isSplit) {
      totalPagoCalc = activeSplitKeys.reduce((sum, m) => {
        return sum + (Number(String(deliverySplits[m] || 0).replace(',', '.')) || 0);
      }, 0);
    } else {
      totalPagoCalc = Number(String(deliveryPaid || 0).replace(',', '.')) || 0;
    }

    const totalPago = Math.round(totalPagoCalc * 100) / 100;
    const valorEmAberto = Math.max(0, Math.round((totalCobrar - totalPago) * 100) / 100);
    const lucroEstimado = Math.max(0, totalCobrar - totalCustoMantido);

    return {
      totalOriginal,
      totalDevolvido,
      subtotalMantido,
      desconto,
      totalCobrar,
      totalPago,
      valorEmAberto,
      totalCustoMantido,
      lucroEstimado,
      isSplit,
      activeSplitKeys
    };
  }, [baseItems, returnQuantities, deliveryItemPrices, deliveryItemCosts, deliveryDiscount, deliveryDiscountType, deliveryPayment, deliverySplits, deliveryPaid]);

  const handleSalvar = (finalize = false) => {
    const returnedItems = [];
    const remainingItems = [];

    baseItems.forEach((i, idx) => {
      const key = i.sku || i.id || idx;
      const maxQty = Number(i.qtd || i.qty || 0);
      const retQty = Math.max(0, Math.min(maxQty, Number(returnQuantities[key]) || 0));
      const keptQty = maxQty - retQty;

      const pUnit = Number(String(deliveryItemPrices[key] || 0).replace(',', '.')) || 0;
      const cUnit = Number(String(deliveryItemCosts[key] || 0).replace(',', '.')) || 0;

      if (retQty > 0) {
        returnedItems.push({
          ...i,
          precoVenda: pUnit,
          precoCusto: cUnit,
          returnedQty: retQty,
          motivo: 'Devolvido no Acerto'
        });
      }
      if (keptQty > 0) {
        remainingItems.push({
          ...i,
          precoVenda: pUnit,
          precoCusto: cUnit,
          qtd: keptQty,
          subtotalVenda: pUnit * keptQty,
          subtotalCusto: cUnit * keptQty
        });
      }
    });

    const activeSplits = {};
    if (summary.isSplit) {
      summary.activeSplitKeys.forEach((m) => {
        const val = Number(String(deliverySplits[m] || 0).replace(',', '.'));
        if (val > 0) activeSplits[m] = val;
      });
    } else {
      activeSplits[deliveryPayment] = summary.totalPago;
    }

    const payload = {
      orderId: order.id,
      finalize,
      baseItems,
      remainingItems,
      returnedItems,
      totalOriginal: summary.totalOriginal,
      totalDevolvido: summary.totalDevolvido,
      subtotalMantido: summary.subtotalMantido,
      desconto: summary.desconto,
      descontoPercent: deliveryDiscountType === 'percent' ? Number(deliveryDiscount) : null,
      totalAcerto: summary.totalCobrar,
      totalCobrar: summary.totalCobrar,
      totalPago: summary.totalPago,
      valorEmAberto: summary.valorEmAberto,
      totalCusto: summary.totalCustoMantido,
      paymentMethod: deliveryPayment,
      paymentSplits: activeSplits,
      dataInicio,
      dataVencimento: summary.valorEmAberto > 0 ? (dataVencimento || hojeEm30Dias()) : dataVencimento,
      status: finalize ? 'concluido' : 'acerto'
    };

    onSaveAcerto && onSaveAcerto(payload);
    onClose();
  };

  const hojeEm30Dias = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };

  const copyWhatsAppAcerto = () => {
    const cliente = order.cliente?.nome || 'Cliente';
    const splitDetails = summary.isSplit
      ? summary.activeSplitKeys
          .filter((k) => Number(String(deliverySplits[k] || 0).replace(',', '.')) > 0)
          .map((k) => `${PAG_METHODS[k]?.label || k}: ${formatMoney(Number(String(deliverySplits[k]).replace(',', '.')))}`)
          .join(' + ')
      : `${PAG_METHODS[deliveryPayment]?.label || deliveryPayment}: ${formatMoney(summary.totalPago)}`;

    const lines = [
      `✅ *ACERTO DE PEDIDO - SNACK STORE BH* ✅`,
      `Olá ${cliente}, segue o resumo detalhado do seu acerto:`,
      ``,
      `📦 *Total Original:* ${formatMoney(summary.totalOriginal)}`,
      summary.totalDevolvido > 0 ? `↩️ *Total Devolvido:* ${formatMoney(summary.totalDevolvido)}` : null,
      summary.desconto > 0 ? `🏷️ *Desconto Concedido:* - ${formatMoney(summary.desconto)}` : null,
      `💰 *TOTAL DA COMANDA:* ${formatMoney(summary.totalCobrar)}`,
      `💵 *Valor Pago:* ${formatMoney(summary.totalPago)}${splitDetails ? ` (${splitDetails})` : ''}`,
      summary.valorEmAberto > 0
        ? `⏳ *Saldo Restante em Aberto:* ${formatMoney(summary.valorEmAberto)} (Vencimento: ${dataVencimento ? new Date(dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : 'A combinar'})`
        : `🎉 *Status:* TOTALMENTE QUITADO!`,
      ``,
      `🔑 Chave PIX: *contato@snackstorebh.com.br*`,
      `Agradecemos pela parceria! 🤝`
    ].filter(Boolean).join('\n');

    navigator.clipboard?.writeText(lines);
    onToast && onToast('Mensagem de WhatsApp do Acerto copiada! 📋📲');
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="acerto-modal-clean" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="acerto-modal-header">
          <div className="acerto-header-title">
            <div className={`acerto-mode-icon ${mode === 'finalizar' ? 'final' : 'acerto'}`}>
              {mode === 'finalizar' ? <CheckCircle2 size={18} /> : <Handshake size={18} />}
            </div>
            <div>
              <h3>
                {mode === 'finalizar' ? 'Finalizar Pedido' : 'Acerto do Pedido'} #{order.id?.slice(-6)}
              </h3>
              <p className="acerto-subtitle">
                Cliente: <strong>{order.cliente?.nome || 'Não identificado'}</strong>
              </p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="acerto-notice-banner">
          <div className="notice-left">
            <AlertCircle size={15} />
            <span>
              Informe as quantidades <strong>devolvidas</strong>. O sistema cobra apenas os itens mantidos e deduz o CMV exato na contabilidade.
            </span>
          </div>
          <button className="btn-acerto-copy-wa" onClick={copyWhatsAppAcerto} title="Copiar mensagem para WhatsApp">
            <Copy size={13} /> Copiar Acerto
          </button>
        </div>

        {/* Modal Body */}
        <div className="acerto-modal-body">
          {/* List of Items with return inputs */}
          <div className="acerto-items-section">
            <span className="section-label-sub">Itens do Pedido ({baseItems.length})</span>
            <div className="acerto-items-list">
              {baseItems.map((i, idx) => {
                const key = i.sku || i.id || idx;
                const maxQty = Number(i.qtd || i.qty || 0);
                const retVal = returnQuantities[key] !== undefined ? returnQuantities[key] : '';
                const currentPrice = deliveryItemPrices[key] !== undefined ? deliveryItemPrices[key] : (i.precoVenda || i.preco || 0);
                const currentCost = deliveryItemCosts[key] !== undefined ? deliveryItemCosts[key] : (i.precoCusto || i.custo || 0);

                const retNum = Math.max(0, Math.min(maxQty, Number(retVal) || 0));
                const keptNum = maxQty - retNum;

                return (
                  <div key={key} className={`acerto-item-row ${retNum === maxQty ? 'fully-returned' : ''}`}>
                    <div className="item-row-top">
                      <div className="item-info-col">
                        <span className="item-code-tag">{i.cod || i.codigo || 'PERF'}</span>
                        <strong className="item-clean-name">{i.cleanName || i.nome || i.name}</strong>
                        <span className="item-orig-qty">({maxQty} un originais)</span>
                      </div>
                      <div className="item-kept-badge">
                        Mantidos: <strong style={{ color: keptNum > 0 ? '#10b981' : '#71717a' }}>{keptNum} un</strong>
                      </div>
                    </div>

                    {/* Preço de Venda & Custo Editáveis */}
                    <div className="acerto-pricing-strip">
                      <div className="price-input-chip">
                        <span className="chip-label">Preço Venda</span>
                        <div className="input-prefix-wrap mini">
                          <span className="input-prefix-badge">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentPrice}
                            onChange={(e) =>
                              setDeliveryItemPrices((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            className="admin-form-input"
                          />
                        </div>
                      </div>

                      <div className="price-input-chip cost">
                        <span className="chip-label">Custo Unit.</span>
                        <div className="input-prefix-wrap mini">
                          <span className="input-prefix-badge">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentCost}
                            onChange={(e) =>
                              setDeliveryItemCosts((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            className="admin-form-input"
                          />
                        </div>
                      </div>

                      <div className="fornecedor-item-pill">
                        {i.isEstoqueProprio !== false ? (
                          <span className="pill-proprio">🏢 Próprio</span>
                        ) : (
                          <span className="pill-fornec">🤝 {i.fornecedorOrigem || 'Fornecedor'}</span>
                        )}
                      </div>
                    </div>

                    {/* Devolução */}
                    <div className="acerto-devolution-strip">
                      <div className="devolution-group">
                        <span className="devolver-label">Devolver:</span>
                        <input
                          type="number"
                          min="0"
                          max={maxQty}
                          placeholder="0"
                          value={retVal}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setReturnQuantities((prev) => {
                                const n = { ...prev };
                                delete n[key];
                                return n;
                              });
                              return;
                            }
                            const num = Math.max(0, Math.min(Number(raw), maxQty));
                            setReturnQuantities((prev) => ({ ...prev, [key]: num }));
                          }}
                          className="acerto-return-input"
                        />
                      </div>

                      <div className="quick-return-actions">
                        <button
                          type="button"
                          className="btn-quick-ret"
                          onClick={() => setReturnQuantities((prev) => ({ ...prev, [key]: maxQty }))}
                        >
                          Devolver Todos ({maxQty})
                        </button>
                        <button
                          type="button"
                          className="btn-quick-ret ghost"
                          onClick={() =>
                            setReturnQuantities((prev) => {
                              const n = { ...prev };
                              delete n[key];
                              return n;
                            })
                          }
                        >
                          Zerar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo Financeiro do Acerto */}
          <div className="acerto-summary-box">
            <div className="summary-row">
              <span className="sum-label">Total Original</span>
              <span className="sum-value">{formatMoney(summary.totalOriginal)}</span>
            </div>
            {summary.totalDevolvido > 0 && (
              <div className="summary-row red">
                <span className="sum-label">
                  <RotateCcw size={12} /> Total Devolvido
                </span>
                <span className="sum-value">- {formatMoney(summary.totalDevolvido)}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="sum-label">Subtotal Mantido (Vendido)</span>
              <span className="sum-value bold">{formatMoney(summary.subtotalMantido)}</span>
            </div>

            {/* Desconto */}
            <div className="acerto-discount-ctrl">
              <div className="discount-header">
                <span className="disc-title">
                  <Percent size={13} /> Desconto
                </span>
                <div className="disc-preset-chips">
                  {['30', '20', '10', '0'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={`chip-pct ${deliveryDiscountType === 'percent' && String(deliveryDiscount) === pct ? 'active' : ''}`}
                      onClick={() => {
                        setDeliveryDiscountType('percent');
                        setDeliveryDiscount(pct);
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="discount-input-row">
                <div className="disc-type-buttons">
                  <button
                    type="button"
                    className={`btn-disc-mode ${deliveryDiscountType === 'reais' ? 'active' : ''}`}
                    onClick={() => {
                      setDeliveryDiscountType('reais');
                      setDeliveryDiscount('');
                    }}
                  >
                    R$ Real
                  </button>
                  <button
                    type="button"
                    className={`btn-disc-mode ${deliveryDiscountType === 'percent' ? 'active' : ''}`}
                    onClick={() => {
                      setDeliveryDiscountType('percent');
                      setDeliveryDiscount('10');
                    }}
                  >
                    % Porcentagem
                  </button>
                </div>

                <div className="disc-input-wrap">
                  <div className="input-prefix-wrap">
                    <span className="input-prefix-badge">
                      {deliveryDiscountType === 'percent' ? '%' : 'R$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={deliveryDiscount}
                      onChange={(e) => setDeliveryDiscount(e.target.value)}
                      className="admin-form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total a Cobrar */}
            <div className="summary-total-bar">
              <span className="final-label">Total a Cobrar (Comanda)</span>
              <span className="final-amount">{formatMoney(summary.totalCobrar)}</span>
            </div>

            {/* Forma de Pagamento e Valores */}
            <div className="acerto-payment-section">
              <span className="section-label-sub">Forma de Pagamento</span>
              <div className="payment-chips-wrap">
                {Object.entries(PAG_METHODS).map(([id, conf]) => (
                  <button
                    key={id}
                    type="button"
                    className={`pay-chip ${deliveryPayment === id ? 'active' : ''}`}
                    onClick={() => {
                      setDeliveryPayment(id);
                      if (!id.includes('+') && id !== 'misto') {
                        if (summary.totalCobrar > 0 && (!deliveryPaid || deliveryPaid === '0')) {
                          setDeliveryPaid(String(summary.totalCobrar));
                        }
                      }
                    }}
                  >
                    {conf.label}
                  </button>
                ))}
              </div>

              {/* Pagamento Único */}
              {!summary.isSplit ? (
                <div className="single-pay-input-box">
                  <div className="pay-input-label">
                    <span>Quanto o cliente pagou ({PAG_METHODS[deliveryPayment]?.label}):</span>
                  </div>
                  <div className="pay-input-row">
                    <div className="input-prefix-wrap">
                      <span className="input-prefix-badge">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={summary.totalCobrar.toFixed(2)}
                        value={deliveryPaid}
                        onChange={(e) => setDeliveryPaid(e.target.value)}
                        className="admin-form-input"
                      />
                    </div>
                    <div className="pay-shortcuts-grid">
                      <button
                        type="button"
                        className="btn-pay-shortcut"
                        onClick={() => setDeliveryPaid(String(summary.totalCobrar))}
                      >
                        Pagar Total
                      </button>
                      <button
                        type="button"
                        className="btn-pay-shortcut half"
                        onClick={() => setDeliveryPaid(String((summary.totalCobrar / 2).toFixed(2)))}
                      >
                        50% Agora
                      </button>
                      <button
                        type="button"
                        className="btn-pay-shortcut open"
                        onClick={() => setDeliveryPaid('0')}
                      >
                        Em Aberto
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Pagamento Dividido (Split) */
                <div className="split-pay-box">
                  <p className="split-desc">Informe quanto foi pago em cada forma (o saldo não quitado ficará em aberto):</p>
                  <div className="split-fields-col">
                    {summary.activeSplitKeys.map((m) => {
                      const thisVal = deliverySplits[m] || '';
                      const otherSplitsSum = summary.activeSplitKeys
                        .filter((x) => x !== m)
                        .reduce(
                          (s, x) => s + (Number(String(deliverySplits[x] || 0).replace(',', '.')) || 0),
                          0
                        );
                      const remainingForThis = Math.max(
                        0,
                        Math.round((summary.totalCobrar - otherSplitsSum) * 100) / 100
                      );

                      return (
                        <div key={m} className="split-item-row">
                          <span className="split-item-label">{PAG_METHODS[m]?.label || m.toUpperCase()}:</span>
                          <div className="split-item-inputs">
                            <div className="input-prefix-wrap" style={{ flex: '1 1 120px' }}>
                              <span className="input-prefix-badge">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={thisVal}
                                onChange={(e) =>
                                  setDeliverySplits((prev) => ({ ...prev, [m]: e.target.value }))
                                }
                                className="admin-form-input"
                              />
                            </div>
                            <div className="split-actions-row">
                              <button
                                type="button"
                                className="btn-split-rest"
                                onClick={() =>
                                  setDeliverySplits((prev) => ({ ...prev, [m]: String(remainingForThis) }))
                                }
                              >
                                Restante ({formatMoney(remainingForThis)})
                              </button>
                              {thisVal ? (
                                <button
                                  type="button"
                                  className="btn-split-rest ghost"
                                  onClick={() =>
                                    setDeliverySplits((prev) => ({ ...prev, [m]: '' }))
                                  }
                                >
                                  Zerar
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status de Quitação e Vencimento */}
              <div className={`acerto-status-pill ${summary.valorEmAberto > 0 ? 'em-aberto' : 'quitado'}`}>
                {summary.valorEmAberto > 0 ? (
                  <>
                    <span>⏳ EM ABERTO: <strong>{formatMoney(summary.valorEmAberto)}</strong></span>
                    <div className="venc-inline">
                      <span>Vencimento:</span>
                      <input
                        type="date"
                        value={dataVencimento}
                        onChange={(e) => setDataVencimento(e.target.value)}
                        className="venc-input"
                      />
                    </div>
                  </>
                ) : (
                  <span>✅ PEDIDO 100% QUITADO NO ACERTO!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="acerto-modal-footer">
          <button className="btn-acerto-cancel" onClick={onClose}>
            Cancelar
          </button>

          <div className="acerto-submit-group">
            <button
              className="btn-acerto-save"
              onClick={() => handleSalvar(false)}
              title="Salva o acerto e mantém o pedido na etapa de Acerto"
            >
              Salvar Acerto
            </button>
            <button
              className="btn-acerto-finish"
              onClick={() => handleSalvar(true)}
              title="Finaliza o pedido e marca como concluído com conciliação contábil"
            >
              <Check size={16} /> Finalizar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
