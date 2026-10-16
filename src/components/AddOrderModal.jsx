import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Check,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Trash2,
  FileText,
  Building2,
  Users,
  Copy,
  Layers
} from 'lucide-react';

export default function AddOrderModal({
  products,
  suppliers = [],
  customers = [],
  onClose,
  onSaveOrder,
  onToast
}) {
  const [step, setStep] = useState(1); // 1: Cliente, 2: Itens e Preços, 3: Pagamento e Conclusão

  // Step 1: Customer Data
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState({
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    complemento: ''
  });

  // Step 2: Multi-Line Cart
  // Each line is an independent item with its own unit cost, unit selling price, and supplier!
  const [cartLines, setCartLines] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Step 3: Payment, Status & Terms
  const [statusInicial, setStatusInicial] = useState('pendente'); // 'pendente', 'confirmado', 'em-rota', 'entregue', 'acerto', 'concluido'
  const [tipoVenda, setTipoVenda] = useState('avista'); // 'avista', 'aprazo', 'misto'
  const [metodoPagamento, setMetodoPagamento] = useState('pix'); // 'pix', 'dinheiro', 'cartao', 'cartao_debito', 'boleto', 'a-prazo', 'misto'
  const [paymentSplits, setPaymentSplits] = useState({
    pix: '',
    dinheiro: '',
    cartaoCredito: '',
    cartaoDebito: '',
    boleto: ''
  });
  const [dataPedido, setDataPedido] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataVencimento, setDataVencimento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [observacoes, setObservacoes] = useState('');

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Auto-search CEP via ViaCEP
  const handleCepChange = async (cepVal) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    setEndereco((prev) => ({ ...prev, cep: cepVal }));

    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco((prev) => ({
            ...prev,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
          onToast && onToast('Endereço preenchido pelo CEP! 📍');
        }
      } catch (err) {
        console.warn('Erro ao consultar CEP:', err);
      }
    }
  };

  // Autocomplete customers
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return [];
    return customers.filter(
      (c) =>
        c.nome?.toLowerCase().includes(q) ||
        c.telefone?.includes(q) ||
        c.cpf?.includes(q)
    );
  }, [customers, customerSearch]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setNome(c.nome || '');
    setTelefone(c.telefone || '');
    setCpf(c.cpf || '');
    setEndereco(c.endereco || {
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      complemento: ''
    });
    setCustomerSearch('');
  };

  // Filter catalog
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) => {
      if (categoryFilter === 'arab' && !p.isArabic) return false;
      if (categoryFilter === 'brand' && p.isArabic) return false;
      if (!q) return true;
      const matchName = p.name?.toLowerCase().includes(q) || p.cleanName?.toLowerCase().includes(q);
      const matchCod = p.cod?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      const matchRef = p.ref?.toLowerCase().includes(q);
      return matchName || matchCod || matchRef;
    });
  }, [products, productSearch, categoryFilter]);

  // Cart operations
  const addLineToCart = (prod, defaultPriceType = 'varejo', forceNewLine = false) => {
    const custo = Number(prod.precoCompra || 37.0);
    const sale =
      defaultPriceType === 'atacado'
        ? Number(prod.precoAtacado || 50.0)
        : Number(prod.precoVarejo || 139.9);

    if (!forceNewLine) {
      // Check if an identical line exists with same sku, price, cost and supplier
      const existingIdx = cartLines.findIndex(
        (l) => l.sku === prod.sku && l.precoVenda === sale && l.precoCusto === custo && l.isEstoqueProprio
      );
      if (existingIdx !== -1) {
        setCartLines((prev) =>
          prev.map((l, i) => (i === existingIdx ? { ...l, qty: l.qty + 1 } : l))
        );
        return;
      }
    }

    const newLine = {
      lineId: `${prod.sku}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sku: prod.sku,
      cod: prod.cod || 'PERF',
      cleanName: prod.cleanName || prod.name,
      name: prod.name,
      ref: prod.ref || '',
      volume: prod.volume || '100ml',
      qty: 1,
      precoVenda: sale,
      precoCusto: custo,
      tipoPreco: defaultPriceType,
      isEstoqueProprio: true,
      fornecedorOrigem: 'Próprio'
    };

    setCartLines((prev) => [...prev, newLine]);
  };

  const updateLineQty = (lineId, delta) => {
    setCartLines((prev) =>
      prev
        .map((l) => {
          if (l.lineId !== lineId) return l;
          const nQty = l.qty + delta;
          return nQty > 0 ? { ...l, qty: nQty } : null;
        })
        .filter(Boolean)
    );
  };

  const updateLineField = (lineId, field, val) => {
    setCartLines((prev) =>
      prev.map((l) => {
        if (l.lineId !== lineId) return l;
        if (field === 'precoVenda') return { ...l, precoVenda: Math.max(0, parseFloat(val) || 0) };
        if (field === 'precoCusto') return { ...l, precoCusto: Math.max(0, parseFloat(val) || 0) };
        if (field === 'isEstoqueProprio') return { ...l, isEstoqueProprio: val === 'proprio' };
        if (field === 'fornecedorOrigem') return { ...l, fornecedorOrigem: val };
        if (field === 'fornecedorId') return { ...l, fornecedorId: val };
        return l;
      })
    );
  };

  const removeLine = (lineId) => {
    setCartLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const duplicateLineVariant = (line) => {
    const newLine = {
      ...line,
      lineId: `${line.sku}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      qty: 1
    };
    setCartLines((prev) => [...prev, newLine]);
    onToast && onToast(`+ Nova cota adicionada para ${line.cod}! Defina preço e custo.`);
  };

  // Cart Totals and Margins
  const cartSummary = useMemo(() => {
    let totalQtd = 0;
    let totalVenda = 0;
    let totalCusto = 0;

    cartLines.forEach((item) => {
      totalQtd += item.qty;
      totalVenda += item.precoVenda * item.qty;
      totalCusto += item.precoCusto * item.qty;
    });

    const lucroBruto = totalVenda - totalCusto;
    const margem = totalCusto > 0 ? (lucroBruto / totalCusto) * 100 : 0;

    return {
      totalQtd,
      totalVenda: Math.round(totalVenda * 100) / 100,
      totalCusto: Math.round(totalCusto * 100) / 100,
      lucroBruto: Math.round(lucroBruto * 100) / 100,
      margem
    };
  }, [cartLines]);

  // Split Payment Calculations
  const isMisto = metodoPagamento === 'misto' || tipoVenda === 'misto';

  const splitSummary = useMemo(() => {
    const pix = parseFloat(paymentSplits.pix) || 0;
    const dinheiro = parseFloat(paymentSplits.dinheiro) || 0;
    const cartaoCredito = parseFloat(paymentSplits.cartaoCredito) || 0;
    const cartaoDebito = parseFloat(paymentSplits.cartaoDebito) || 0;
    const boleto = parseFloat(paymentSplits.boleto) || 0;

    const totalPagoCalc = Math.round((pix + dinheiro + cartaoCredito + cartaoDebito + boleto) * 100) / 100;
    const valorEmAbertoCalc = Math.max(0, Math.round((cartSummary.totalVenda - totalPagoCalc) * 100) / 100);

    return {
      totalPago: totalPagoCalc,
      valorEmAberto: valorEmAbertoCalc
    };
  }, [paymentSplits, cartSummary.totalVenda]);

  // Validation
  const canAdvanceStep1 = nome.trim().length >= 2;
  const canAdvanceStep2 = cartLines.length > 0;

  // Final Submit
  const handleFinalSubmit = () => {
    if (!canAdvanceStep1) {
      alert('Por favor, informe o nome do cliente!');
      setStep(1);
      return;
    }
    if (!canAdvanceStep2) {
      alert('Selecione pelo menos um perfume para criar o pedido!');
      setStep(2);
      return;
    }

    const orderId = `PED-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const formattedItems = cartLines.map((item) => ({
      lineId: item.lineId,
      sku: item.sku,
      cod: item.cod,
      nome: item.cleanName || item.name,
      ref: item.ref,
      volume: item.volume,
      qtd: item.qty,
      precoVenda: Number(item.precoVenda),
      precoCusto: Number(item.precoCusto),
      isEstoqueProprio: item.isEstoqueProprio !== false,
      fornecedorOrigem: item.fornecedorOrigem || 'Próprio',
      subtotalVenda: Number(item.precoVenda) * item.qty,
      subtotalCusto: Number(item.precoCusto) * item.qty,
      lucroItem: (Number(item.precoVenda) - Number(item.precoCusto)) * item.qty,
      tipoPreco: item.tipoPreco
    }));

    let finalTotalPago = 0;
    let finalValorAberto = cartSummary.totalVenda;
    let finalStatusPagamento = 'pendente';

    if (isMisto) {
      finalTotalPago = splitSummary.totalPago;
      finalValorAberto = splitSummary.valorEmAberto;
      finalStatusPagamento = finalValorAberto === 0 ? 'pago' : 'pendente';
    } else if (statusInicial === 'concluido') {
      finalTotalPago = cartSummary.totalVenda;
      finalValorAberto = 0;
      finalStatusPagamento = 'pago';
    }

    const newOrder = {
      id: orderId,
      dataPedido: dataPedido || nowIso.slice(0, 10),
      dataVencimento: dataVencimento || '',
      status: statusInicial, // Chosen explicitly by the user!
      tipoVenda,
      formaPagamento: metodoPagamento,
      paymentSplits: isMisto ? paymentSplits : { [metodoPagamento]: finalTotalPago },
      cliente: {
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim(),
        endereco: { ...endereco }
      },
      itens: formattedItems,
      originalItems: formattedItems.map((i) => ({ ...i })),
      returnedItems: [],
      totais: {
        qtdItens: cartSummary.totalQtd,
        valorTotal: cartSummary.totalVenda,
        custoTotal: cartSummary.totalCusto,
        lucroBruto: cartSummary.lucroBruto,
        margemLucro: cartSummary.margem
      },
      totalCobrar: cartSummary.totalVenda,
      totalPago: finalTotalPago,
      valorEmAberto: finalValorAberto,
      financeiro: {
        statusPagamento: finalStatusPagamento,
        valorTotal: cartSummary.totalVenda,
        valorRecebido: finalTotalPago,
        valorEmAberto: finalValorAberto,
        pagoEm: finalStatusPagamento === 'pago' ? nowIso : null,
        splits: isMisto ? paymentSplits : { [metodoPagamento]: finalTotalPago }
      },
      observacoes: observacoes.trim(),
      criadoEm: nowIso,
      historicoStatus: [
        {
          status: statusInicial,
          data: nowIso,
          nota: `Pedido criado com status inicial: ${statusInicial.toUpperCase()}`
        }
      ]
    };

    onSaveOrder && onSaveOrder(newOrder);
    onToast && onToast(`Pedido #${orderId} criado com status ${statusInicial.toUpperCase()}! 🛍️✨`);
    onClose();
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="add-order-modal-clean" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-order-header-clean">
          <div className="header-badge-title">
            <div className="order-icon-badge">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3>Novo Pedido de Perfumes</h3>
              <p className="order-subtitle">Crie pedidos com preços flexíveis por unidade, fornecedores e pagamento misto</p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Steps Ribbon */}
        <div className="modal-steps-ribbon">
          <button
            type="button"
            className={`step-tab-btn ${step === 1 ? 'active' : ''}`}
            onClick={() => setStep(1)}
          >
            <span className="step-num">1</span>
            <span>Dados do Cliente</span>
          </button>
          <div className="step-divider-line" />
          <button
            type="button"
            className={`step-tab-btn ${step === 2 ? 'active' : ''}`}
            onClick={() => canAdvanceStep1 && setStep(2)}
          >
            <span className="step-num">2</span>
            <span>Itens, Custos & Fornecedores</span>
          </button>
          <div className="step-divider-line" />
          <button
            type="button"
            className={`step-tab-btn ${step === 3 ? 'active' : ''}`}
            onClick={() => canAdvanceStep1 && canAdvanceStep2 && setStep(3)}
          >
            <span className="step-num">3</span>
            <span>Pagamento, Status & Conclusão</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="add-order-body-clean">
          {/* STEP 1: CLIENTE */}
          {step === 1 && (
            <div className="step-content-clean">
              {/* Autocomplete Search */}
              <div className="form-group-clean">
                <label className="field-label-clean">
                  <User size={15} /> Buscar Cliente Cadastrado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Digite nome, telefone ou CPF do cliente para puxar dados..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="admin-form-input"
                />
                {filteredCustomers.length > 0 && (
                  <div
                    style={{
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: 8,
                      marginTop: 4,
                      maxHeight: 180,
                      overflowY: 'auto'
                    }}
                  >
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.telefone || c.nome}
                        onClick={() => selectCustomer(c)}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #27272a',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{c.nome}</strong>
                        <span style={{ color: '#a1a1aa', fontSize: '0.78rem' }}>{c.telefone} • {c.endereco?.cidade || 'BH'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Nome do Cliente *</label>
                  <input
                    type="text"
                    placeholder="Nome completo ou Razão Social"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    placeholder="31 99999-8888"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">CPF / CNPJ (Opcional)</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="admin-form-input"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">
                    <MapPin size={15} /> CEP (Preenchimento automático)
                  </label>
                  <input
                    type="text"
                    placeholder="30000-000"
                    value={endereco.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="form-clean-grid two">
                <div className="form-group-clean" style={{ flex: 2 }}>
                  <label className="field-label-clean">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Av. Afonso Pena"
                    value={endereco.rua}
                    onChange={(e) => setEndereco((prev) => ({ ...prev, rua: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>

                <div className="form-group-clean" style={{ flex: 1 }}>
                  <label className="field-label-clean">Número</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={endereco.numero}
                    onChange={(e) => setEndereco((prev) => ({ ...prev, numero: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="form-clean-grid three">
                <div className="form-group-clean">
                  <label className="field-label-clean">Bairro</label>
                  <input
                    type="text"
                    placeholder="Centro"
                    value={endereco.bairro}
                    onChange={(e) => setEndereco((prev) => ({ ...prev, bairro: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">Cidade</label>
                  <input
                    type="text"
                    value={endereco.cidade}
                    onChange={(e) => setEndereco((prev) => ({ ...prev, cidade: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">Estado (UF)</label>
                  <input
                    type="text"
                    value={endereco.estado}
                    onChange={(e) => setEndereco((prev) => ({ ...prev, estado: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUTOS, CUSTOS & PREÇOS FLEXÍVEIS */}
          {step === 2 && (
            <div className="step-content-clean prods-step-split">
              {/* Esquerda: Catálogo */}
              <div className="prods-picker-col-clean">
                <div className="picker-header-bar">
                  <div className="search-wrap-mini">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Buscar por nome, código ou inspiração..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="admin-form-input mini"
                    />
                  </div>

                  <div className="filter-chips-mini">
                    <button
                      type="button"
                      className={`chip-mini ${categoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      Todos ({products.length})
                    </button>
                    <button
                      type="button"
                      className={`chip-mini ${categoryFilter === 'arab' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('arab')}
                    >
                      Árabes
                    </button>
                    <button
                      type="button"
                      className={`chip-mini ${categoryFilter === 'brand' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('brand')}
                    >
                      Brand
                    </button>
                  </div>
                </div>

                <div className="prods-list-clean-scroll">
                  {filteredProducts.map((p) => {
                    const totalQtyInCart = cartLines
                      .filter((l) => l.sku === p.sku)
                      .reduce((sum, l) => sum + l.qty, 0);

                    return (
                      <div key={p.sku} className={`catalog-item-card-clean ${totalQtyInCart > 0 ? 'in-cart' : ''}`}>
                        <div className="item-meta-top">
                          <span className="code-pill">{p.cod}</span>
                          <strong className="item-name-clean">{p.cleanName || p.name}</strong>
                          <span className="item-ref-clean">Ref: {p.ref || '-'}</span>
                          {totalQtyInCart > 0 && (
                            <span style={{ background: '#10b981', color: '#000', fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                              {totalQtyInCart} un no pedido
                            </span>
                          )}
                        </div>

                        <div className="item-pricing-indicators">
                          <span className="price-hint">Atacado: R$ {Number(p.precoAtacado).toFixed(2)}</span>
                          <span className="price-hint">Varejo: R$ {Number(p.precoVarejo).toFixed(2)}</span>
                          <span className="price-hint cost">Custo: R$ {Number(p.precoCompra).toFixed(2)}</span>
                        </div>

                        <div className="item-picker-actions">
                          <div className="dual-add-btns">
                            <button
                              type="button"
                              className="btn-add-quick atc"
                              onClick={() => addLineToCart(p, 'atacado', false)}
                              title="Adicionar no Atacado"
                            >
                              + Atacado
                            </button>
                            <button
                              type="button"
                              className="btn-add-quick varj"
                              onClick={() => addLineToCart(p, 'varejo', false)}
                              title="Adicionar no Varejo"
                            >
                              + Varejo
                            </button>
                            <button
                              type="button"
                              className="btn-add-line-variant"
                              onClick={() => addLineToCart(p, 'varejo', true)}
                              title="Adicionar outra cota com valor/custo independente"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', margin: 0 }}
                            >
                              + Nova Cota
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Direita: Carrinho com Cotas e Preços Livres */}
              <div className="prods-cart-col-clean">
                <div className="cart-header-clean">
                  <div className="cart-title-clean">
                    <ShoppingBag size={18} color="#10b981" />
                    <strong>Itens no Pedido ({cartSummary.totalQtd} frascos)</strong>
                  </div>
                  <span className="cart-total-badge-clean">
                    Total: R$ {cartSummary.totalVenda.toFixed(2)}
                  </span>
                </div>

                {cartLines.length === 0 ? (
                  <div className="empty-cart-box">
                    <ShoppingBag size={32} opacity={0.3} />
                    <p>Nenhum produto selecionado para o pedido.</p>
                    <span>Selecione os perfumes ao lado no atacado, varejo ou adicione cotas com preços diferentes.</span>
                  </div>
                ) : (
                  <div className="cart-items-scroll-clean">
                    {cartLines.map((line, idx) => {
                      const unitProfit = line.precoVenda - line.precoCusto;
                      const unitMargin = line.precoCusto > 0 ? (unitProfit / line.precoCusto) * 100 : 0;
                      const subtotalVenda = line.precoVenda * line.qty;

                      return (
                        <div key={line.lineId} className="cart-item-card-editor">
                          <div className="cart-item-topbar">
                            <div className="item-title-col">
                              <span className="item-cod-mini">{line.cod}</span>
                              <strong className="item-name-bold">{line.cleanName || line.name}</strong>
                              <span style={{ fontSize: '0.68rem', color: '#71717a' }}>#{idx + 1}</span>
                            </div>
                            <button
                              type="button"
                              className="btn-trash-item-clean"
                              onClick={() => removeLine(line.lineId)}
                              title="Remover esta cota"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Origem e Fornecedor */}
                          <div className="supplier-origin-select-row">
                            <div className="origin-select-header">
                              <span className="origin-lbl">
                                {line.isEstoqueProprio !== false ? (
                                  <Building2 size={13} color="#10b981" />
                                ) : (
                                  <Users size={13} color="#60a5fa" />
                                )}
                                Origem:
                              </span>
                              <select
                                value={line.isEstoqueProprio !== false ? 'proprio' : 'externo'}
                                onChange={(e) => updateLineField(line.lineId, 'isEstoqueProprio', e.target.value)}
                                className="admin-form-select origin"
                              >
                                <option value="proprio">🏢 Estoque Próprio</option>
                                <option value="externo">🤝 Fornecedor Externo / Lojista</option>
                              </select>
                            </div>

                            {line.isEstoqueProprio === false && (
                              <div style={{ marginTop: '6px' }}>
                                <select
                                  value={line.fornecedorId || (suppliers.find((s) => s.nome === line.fornecedorOrigem)?.id) || 'custom'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'custom') {
                                      updateLineField(line.lineId, 'fornecedorOrigem', '');
                                      updateLineField(line.lineId, 'fornecedorId', 'custom');
                                    } else {
                                      const sup = suppliers.find((s) => s.id === val);
                                      if (sup) {
                                        updateLineField(line.lineId, 'fornecedorOrigem', sup.nome);
                                        updateLineField(line.lineId, 'fornecedorId', sup.id);
                                        // Auto-preencher custo caso este produto tenha cota específica neste fornecedor
                                        const prod = products.find((p) => p.sku === line.sku);
                                        if (prod && Array.isArray(prod.fornecedores)) {
                                          const cota = prod.fornecedores.find(
                                            (f) => f.fornecedorId === sup.id || f.nome?.toLowerCase() === sup.nome?.toLowerCase()
                                          );
                                          if (cota && cota.precoCusto) {
                                            updateLineField(line.lineId, 'precoCusto', Number(cota.precoCusto));
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  className="admin-form-select mini"
                                  style={{ marginBottom: '4px' }}
                                >
                                  <option value="">-- Selecione o Fornecedor Parceiro --</option>
                                  {suppliers.map((s) => {
                                    const prod = products.find((p) => p.sku === line.sku);
                                    const cota = prod?.fornecedores?.find(
                                      (f) => f.fornecedorId === s.id || f.nome?.toLowerCase() === s.nome?.toLowerCase()
                                    );
                                    return (
                                      <option key={s.id} value={s.id}>
                                        {s.nome} {cota ? `(Cota: ${cota.qtd}un - Custo R$${cota.precoCusto})` : `(${s.tipo})`}
                                      </option>
                                    );
                                  })}
                                  <option value="custom">✏️ Outro fornecedor avulso...</option>
                                </select>

                                {(!line.fornecedorId || line.fornecedorId === 'custom') && (
                                  <input
                                    type="text"
                                    placeholder="Digite o nome do fornecedor ou lojista parceiro..."
                                    value={line.fornecedorOrigem || ''}
                                    onChange={(e) => updateLineField(line.lineId, 'fornecedorOrigem', e.target.value)}
                                    className="admin-form-input mini"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Preços e Quantidade por Linha */}
                          <div className="cart-pricing-fields-grid">
                            <div className="field-col qty">
                              <label>Qtd</label>
                              <div className="stepper-mini-box">
                                <button type="button" onClick={() => updateLineQty(line.lineId, -1)}>-</button>
                                <span>{line.qty}</span>
                                <button type="button" onClick={() => updateLineQty(line.lineId, 1)}>+</button>
                              </div>
                            </div>

                            <div className="field-col cost">
                              <label>Custo Unit. (R$)</label>
                              <div className="input-money-clean cost">
                                <span>R$</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={line.precoCusto}
                                  onChange={(e) => updateLineField(line.lineId, 'precoCusto', e.target.value)}
                                  className="admin-form-input money"
                                />
                              </div>
                            </div>

                            <div className="field-col price">
                              <label>Venda Unit. (R$)</label>
                              <div className="input-money-clean price">
                                <span>R$</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={line.precoVenda}
                                  onChange={(e) => updateLineField(line.lineId, 'precoVenda', e.target.value)}
                                  className="admin-form-input money"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Botão de adicionar outra cota do mesmo perfume com preço diferente */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <button
                              type="button"
                              className="btn-add-line-variant"
                              onClick={() => duplicateLineVariant(line)}
                              title="Adiciona outra unidade deste mesmo perfume com outro valor/custo"
                            >
                              <Copy size={12} /> + Outra unidade com preço diferente
                            </button>

                            <span style={{ fontSize: '0.74rem', color: '#d4d4d8' }}>
                              Subtotal: <strong style={{ color: '#10b981' }}>R$ {subtotalVenda.toFixed(2)}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ribbon Summary */}
                <div className="cart-ribbon-summary">
                  <div className="metric-box">
                    <span>Faturamento Total</span>
                    <strong>R$ {cartSummary.totalVenda.toFixed(2)}</strong>
                  </div>
                  <div className="metric-box">
                    <span>Custo Total (CMV)</span>
                    <strong>R$ {cartSummary.totalCusto.toFixed(2)}</strong>
                  </div>
                  <div className="metric-box green">
                    <span>Lucro Bruto</span>
                    <strong>+{formatMoney(cartSummary.lucroBruto)} ({cartSummary.margem.toFixed(0)}%)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STATUS INICIAL, PAGAMENTO MISTO & CONDICIONAMENTO */}
          {step === 3 && (
            <div className="step-content-clean">
              <div className="form-clean-grid two">
                {/* Status Inicial do Pedido */}
                <div className="form-group-clean">
                  <label className="field-label-clean">
                    <Layers size={15} color="#10b981" /> Status Inicial do Pedido *
                  </label>
                  <select
                    value={statusInicial}
                    onChange={(e) => setStatusInicial(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="pendente">⏳ Pendente (Aguardando separação / confirmação)</option>
                    <option value="confirmado">📋 Confirmado (Separado)</option>
                    <option value="em-rota">🚚 Em Rota de Entrega</option>
                    <option value="entregue">📬 Entregue (Com o cliente)</option>
                    <option value="acerto">🤝 Em Acerto (Com acerto pendente)</option>
                    <option value="concluido">✅ Concluído (Entregue e 100% Quitado)</option>
                  </select>
                </div>

                {/* Forma de Pagamento */}
                <div className="form-group-clean">
                  <label className="field-label-clean">
                    <CreditCard size={15} color="#3b82f6" /> Condição / Forma de Pagamento
                  </label>
                  <select
                    value={metodoPagamento}
                    onChange={(e) => setMetodoPagamento(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="pix">PIX (Imediato)</option>
                    <option value="dinheiro">Dinheiro Físico</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="a-prazo">A Prazo / Fiado</option>
                    <option value="misto">🔀 Pagamento Misto / Dividido (PIX, Dinheiro, etc.)</option>
                  </select>
                </div>
              </div>

              {/* Se Pagamento Misto, exibe os inputs divididos */}
              {isMisto && (
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={14} color="#10b981" /> Divisão de Pagamento Misto
                  </span>
                  <p style={{ fontSize: '0.72rem', color: '#71717a', margin: '4px 0 8px 0' }}>
                    Informe quanto foi pago em cada método. O restante ficará registrado como Saldo em Aberto.
                  </p>

                  <div className="split-payment-inputs-grid">
                    <div className="split-pay-field">
                      <label>PIX (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={paymentSplits.pix}
                        onChange={(e) => setPaymentSplits((prev) => ({ ...prev, pix: e.target.value }))}
                        className="admin-form-input mini"
                      />
                    </div>

                    <div className="split-pay-field">
                      <label>Dinheiro (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={paymentSplits.dinheiro}
                        onChange={(e) => setPaymentSplits((prev) => ({ ...prev, dinheiro: e.target.value }))}
                        className="admin-form-input mini"
                      />
                    </div>

                    <div className="split-pay-field">
                      <label>Cartão Crédito (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={paymentSplits.cartaoCredito}
                        onChange={(e) => setPaymentSplits((prev) => ({ ...prev, cartaoCredito: e.target.value }))}
                        className="admin-form-input mini"
                      />
                    </div>

                    <div className="split-pay-field">
                      <label>Cartão Débito (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={paymentSplits.cartaoDebito}
                        onChange={(e) => setPaymentSplits((prev) => ({ ...prev, cartaoDebito: e.target.value }))}
                        className="admin-form-input mini"
                      />
                    </div>

                    <div className="split-pay-field">
                      <label>Boleto (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={paymentSplits.boleto}
                        onChange={(e) => setPaymentSplits((prev) => ({ ...prev, boleto: e.target.value }))}
                        className="admin-form-input mini"
                      />
                    </div>
                  </div>

                  {/* Status da quitação no misto */}
                  <div className={`payment-balance-pill ${splitSummary.valorEmAberto === 0 ? 'quitado' : 'em-aberto'}`}>
                    <span>Total Pago Agora: <strong>R$ {splitSummary.totalPago.toFixed(2)}</strong></span>
                    {splitSummary.valorEmAberto > 0 ? (
                      <span>⏳ Restante em Aberto: <strong>R$ {splitSummary.valorEmAberto.toFixed(2)}</strong></span>
                    ) : (
                      <span>✅ Totalmente Quitado!</span>
                    )}
                  </div>
                </div>
              )}

              {/* Datas de Pedido e Vencimento */}
              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">
                    <Calendar size={15} /> Data do Pedido
                  </label>
                  <input
                    type="date"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    className="admin-form-input"
                  />
                </div>

                <div className="form-group-clean">
                  <label className="field-label-clean">
                    <Calendar size={15} /> Data de Vencimento {splitSummary.valorEmAberto > 0 && <span style={{ color: '#fbbf24' }}>* Obrigatório</span>}
                  </label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Observações do Pedido</label>
                <input
                  type="text"
                  placeholder="Instruções de entrega, horário preferencial, acordos de pagamento..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="admin-form-input"
                />
              </div>

              {/* Card Resumo Pronto */}
              <div className="order-final-preview-card">
                <div className="preview-header">
                  <strong>Resumo do Pedido a ser Criado</strong>
                  <span className="preview-client">
                    Cliente: <strong>{nome}</strong> ({telefone || 'Sem telefone'})
                  </span>
                </div>
                <div className="preview-metrics-grid">
                  <div className="metric-item">
                    <span>Total Frascos:</span>
                    <strong>{cartSummary.totalQtd} un</strong>
                  </div>
                  <div className="metric-item">
                    <span>Valor da Venda:</span>
                    <strong style={{ color: '#10b981' }}>R$ {cartSummary.totalVenda.toFixed(2)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Custo (CMV):</span>
                    <strong style={{ color: '#f59e0b' }}>R$ {cartSummary.totalCusto.toFixed(2)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Status Inicial:</span>
                    <strong style={{ color: '#38bdf8', textTransform: 'uppercase' }}>{statusInicial}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="add-order-footer-clean">
          {step > 1 ? (
            <button
              type="button"
              className="btn-modal-prev"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
          )}

          <div className="footer-right-actions">
            {step < 3 ? (
              <button
                type="button"
                className="btn-modal-next"
                disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}
                onClick={() => setStep((s) => s + 1)}
              >
                Avançar <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-modal-submit"
                onClick={handleFinalSubmit}
              >
                <Check size={16} /> Salvar e Gerar Pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
