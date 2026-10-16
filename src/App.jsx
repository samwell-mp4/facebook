import React, { useState, useMemo } from 'react';
import { CATALOG_DATA } from './data/catalogData';
import { INITIAL_ORDERS } from './data/initialOrders';
import { INITIAL_SUPPLIERS } from './data/initialSuppliers';
import AdminCenter from './components/AdminCenter';
import ProductModal from './components/ProductModal';
import Toast from './components/Toast';

const STORAGE_KEY = 'snack_store_admin_products_v2';
const ORDERS_STORAGE_KEY = 'snack_store_admin_orders_v2';
const SUPPLIERS_STORAGE_KEY = 'snack_store_suppliers_v1';

export default function App() {
  // Load products with localStorage persistence
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar dados do localStorage:', e);
    }
    return CATALOG_DATA;
  });

  // Load orders with localStorage persistence
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o) => {
            const total = Number(o.totais?.valorTotal ?? o.totalCobrar ?? o.total ?? o.financeiro?.valorTotal ?? o.financeiro?.totalVenda ?? 0);
            const custo = Number(o.totais?.custoTotal ?? o.totalCusto ?? o.financeiro?.totalCusto ?? o.financeiro?.valorCusto ?? 0);
            const qtdItens = Number(o.totais?.qtdItens ?? (o.itens || []).reduce((acc, it) => acc + Number(it.qtd || it.qty || 1), 0));
            const pago = o.totalPago !== undefined && o.totalPago !== null
              ? Number(o.totalPago)
              : (o.financeiro?.valorRecebido !== undefined && o.financeiro?.valorRecebido !== null
                  ? Number(o.financeiro.valorRecebido)
                  : (o.financeiro?.statusPagamento === 'pago' ? total : 0));
            const aberto = o.valorEmAberto !== undefined && o.valorEmAberto !== null
              ? Number(o.valorEmAberto)
              : (o.financeiro?.valorEmAberto !== undefined && o.financeiro?.valorEmAberto !== null
                  ? Number(o.financeiro.valorEmAberto)
                  : Math.max(0, Math.round((total - pago) * 100) / 100));

            return {
              ...o,
              totais: {
                valorTotal: total,
                custoTotal: custo,
                lucroBruto: total - custo,
                margemLucro: custo > 0 ? ((total - custo) / custo) * 100 : 0,
                qtdItens
              },
              totalCobrar: o.totalCobrar !== undefined ? Number(o.totalCobrar) : total,
              totalPago: pago,
              valorEmAberto: aberto,
              financeiro: {
                ...o.financeiro,
                valorTotal: total,
                valorRecebido: pago,
                valorEmAberto: aberto,
                statusPagamento: aberto === 0 ? 'pago' : 'pendente'
              }
            };
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar pedidos salvos:', e);
    }
    return INITIAL_ORDERS;
  });

  const EXPENSES_STORAGE_KEY = 'snack_store_expenses_v1';
  const PURCHASES_STORAGE_KEY = 'snack_store_stock_purchases_v1';

  const INITIAL_EXPENSES = [
    {
      id: 'DESP-001',
      descricao: 'Embalagens e Sacolas Personalizadas Snack Store',
      categoria: 'Embalagens',
      valor: 180.0,
      data: '2026-10-10',
      dataVencimento: '2026-10-10',
      formaPagamento: 'pix',
      status: 'pago',
      observacao: 'Lote com 200 sacolas premium'
    },
    {
      id: 'DESP-002',
      descricao: 'Frete e Logística de Entrega (Motoboy BH)',
      categoria: 'Frete',
      valor: 75.0,
      data: '2026-10-12',
      dataVencimento: '2026-10-12',
      formaPagamento: 'dinheiro',
      status: 'pago',
      observacao: 'Entregas rotas centro e pampulha'
    },
    {
      id: 'DESP-003',
      descricao: 'Tráfego Pago & Anúncios (Meta Ads / Instagram)',
      categoria: 'Marketing',
      valor: 150.0,
      data: '2026-10-13',
      dataVencimento: '2026-10-15',
      formaPagamento: 'cartao',
      status: 'pendente',
      observacao: 'Campanha de atração perfumes árabes'
    }
  ];

  const INITIAL_PURCHASES = [
    {
      id: 'COMPRA-001',
      fornecedor: 'Distribuidora Oficial (Nota Fiscal de Compra)',
      nf: 'NF-e 102941',
      data: '2026-10-12',
      qtdFrascos: 140,
      valorTotal: 4484.07,
      status: 'pago',
      formaPagamento: 'boleto',
      observacao: 'Lote inicial com 52 fragrâncias árabes e brand'
    }
  ];

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXPENSES;
  });

  const [stockPurchases, setStockPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem(PURCHASES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PURCHASES;
  });

  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar fornecedores do localStorage:', e);
    }
    return INITIAL_SUPPLIERS;
  });

  const [activeTab, setActiveTab] = useState('admin'); // Default to newly requested Admin Center
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Copy to clipboard with Toast
  const handleCopy = (text, label = 'Copiado para a área de transferência! ✅') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage(label);
      setTimeout(() => setToastMessage(null), 2500);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMessage(label);
      setTimeout(() => setToastMessage(null), 2500);
    });
  };

  const handleToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Update a single product's financial/stock fields and auto-save
  const handleUpdateProduct = (sku, updatedFields) => {
    setProducts((prev) => {
      const next = prev.map((item) => {
        if (item.sku === sku) {
          const merged = { ...item, ...updatedFields };

          const custo = Number(merged.precoCompra) || 0;
          const atc = Number(merged.precoAtacado) || 0;
          const varj = Number(merged.precoVarejo) || 0;

          const lucroAtacado = atc - custo;
          const margemAtacado = custo > 0 ? (lucroAtacado / custo) * 100 : 0;
          const lucroVarejo = varj - custo;
          const margemVarejo = custo > 0 ? (lucroVarejo / custo) * 100 : 0;
          const lucroRevendedor = varj - atc;
          const margemRevendedor = atc > 0 ? (lucroRevendedor / atc) * 100 : 0;

          const fmt = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          let updatedDesc = merged.fullDescription || '';
          const refRegex = /- Tabela Referência Catálogo:[^\r\n]+[\r\n]+- Margem Revendedor:[^\r\n]+/i;
          const oldRefRegex = /- Tabela Referência Catálogo:[^\r\n]+[\r\n]+- Estimativa de Retorno:[^\r\n]+/i;
          const newRefText = `- Tabela Referência Catálogo: Atacado R$ ${fmt(atc)} | Varejo R$ ${fmt(varj)}\r\n- Margem Revendedor: Lucro R$ ${fmt(lucroRevendedor)} (+${margemRevendedor.toFixed(0)}%)`;

          if (refRegex.test(updatedDesc)) {
            updatedDesc = updatedDesc.replace(refRegex, newRefText);
          } else if (oldRefRegex.test(updatedDesc)) {
            updatedDesc = updatedDesc.replace(oldRefRegex, newRefText);
          }

          return {
            ...merged,
            lucroAtacado: Number(lucroAtacado.toFixed(2)),
            margemAtacado: Number(margemAtacado.toFixed(1)),
            lucroVarejo: Number(lucroVarejo.toFixed(2)),
            margemVarejo: Number(margemVarejo.toFixed(1)),
            lucroRevendedor: Number(lucroRevendedor.toFixed(2)),
            margemRevendedor: Number(margemRevendedor.toFixed(1)),
            atacadoFormatado: `R$ ${fmt(atc)}`,
            varejoFormatado: `R$ ${fmt(varj)}`,
            custoFormatado: `R$ ${fmt(custo)}`,
            fullDescription: updatedDesc
          };
        }
        return item;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Erro ao salvar no localStorage:', err);
      }
      return next;
    });
  };

  // Batch update of products
  const handleBatchUpdate = (newProductsList) => {
    setProducts(newProductsList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProductsList));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  };

  // Reset to original note values
  const handleResetToDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setProducts(CATALOG_DATA);
    handleToast('Preços e custos restaurados para o padrão original da nota fiscal! 🔄');
  };

  // =============================================
  // ORDER ACTIONS & ACCOUNTING RECONCILIATION
  // =============================================
  const handleSaveOrder = (newOrder) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === newOrder.id);
      const next = exists
        ? prev.map((o) => (o.id === newOrder.id ? newOrder : o))
        : [newOrder, ...prev];
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });

    // Se for novo pedido, atualizar o estoque físico dos itens de Estoque Próprio:
    if (Array.isArray(newOrder.itens)) {
      setProducts((prev) => {
        const nextProds = prev.map((p) => {
          const itemInOrder = newOrder.itens.find((it) => it.sku === p.sku);
          if (itemInOrder && itemInOrder.isEstoqueProprio !== false) {
            const currentProprio = p.estoqueProprio !== undefined ? p.estoqueProprio : (p.qtdEstoque || 0);
            const newProprio = Math.max(0, currentProprio - (itemInOrder.qtd || 1));
            return {
              ...p,
              estoqueProprio: newProprio,
              qtdEstoque: Math.max(0, (p.qtdEstoque || 0) - (itemInOrder.qtd || 1))
            };
          }
          return p;
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProds));
        } catch (err) {
          console.error(err);
        }
        return nextProds;
      });
    }

    handleToast(`Pedido #${newOrder.id} salvo com sucesso! 📦✅`);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderId) {
          const isFinalizado = newStatus === 'concluido';
          const nextHist = [
            ...(o.historicoStatus || []),
            {
              status: newStatus,
              data: new Date().toISOString(),
              nota: `Status alterado para ${newStatus.toUpperCase()}`
            }
          ];

          const aberto = o.valorEmAberto !== undefined
            ? Number(o.valorEmAberto)
            : (o.financeiro?.valorEmAberto !== undefined ? Number(o.financeiro.valorEmAberto) : 0);

          return {
            ...o,
            status: newStatus,
            historicoStatus: nextHist,
            financeiro: {
              ...o.financeiro,
              statusPagamento: isFinalizado
                ? (aberto === 0 ? 'pago' : 'pendente')
                : o.financeiro?.statusPagamento,
              pagoEm: isFinalizado && aberto === 0 ? (o.financeiro?.pagoEm || new Date().toISOString()) : o.financeiro?.pagoEm
            }
          };
        }
        return o;
      });
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast(`Pedido #${orderId} atualizado para "${newStatus.toUpperCase()}"! 🔄`);
  };

  const handleTogglePaymentStatus = (orderId) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderId) {
          const isPago = o.financeiro?.statusPagamento === 'pago';
          const nextPago = !isPago;
          return {
            ...o,
            financeiro: {
              ...o.financeiro,
              statusPagamento: nextPago ? 'pago' : 'pendente',
              pagoEm: nextPago ? new Date().toISOString() : null
            }
          };
        }
        return o;
      });
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast(`Status financeiro do pedido #${orderId} atualizado no caixa! 💰`);
  };

  const handleDeleteOrder = (orderId) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast(`Pedido #${orderId} excluído com sucesso! 🗑️`);
  };

  // =============================================
  // EXPENSES & STOCK PURCHASES HANDLERS
  // =============================================
  const handleSaveExpense = (expense) => {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id);
      const next = exists
        ? prev.map((e) => (e.id === expense.id ? expense : e))
        : [expense, ...prev];
      try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast(`Despesa "${expense.descricao}" salva com sucesso! 💸`);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast('Despesa removida! 🗑️');
  };

  const handleToggleExpenseStatus = (id) => {
    setExpenses((prev) => {
      const next = prev.map((e) => {
        if (e.id === id) {
          const isPago = e.status === 'pago';
          return {
            ...e,
            status: isPago ? 'pendente' : 'pago'
          };
        }
        return e;
      });
      try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast('Status da despesa atualizado! 🔄');
  };

  const handleSaveStockPurchase = (purchase) => {
    setStockPurchases((prev) => {
      const exists = prev.some((p) => p.id === purchase.id);
      const next = exists
        ? prev.map((p) => (p.id === purchase.id ? purchase : p))
        : [purchase, ...prev];
      try {
        localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast(`Compra de estoque #${purchase.id} salva com sucesso! 📦`);
  };

  const handleDeleteStockPurchase = (id) => {
    setStockPurchases((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    handleToast('Registro de compra removido! 🗑️');
  };

  // =============================================
  // SUPPLIER & CATALOG PRODUCT HANDLERS
  // =============================================
  const handleSaveSupplier = (supplier) => {
    setSuppliers((prev) => {
      const exists = prev.some((s) => s.id === supplier.id);
      const next = exists
        ? prev.map((s) => (s.id === supplier.id ? supplier : s))
        : [...prev, supplier];
      try {
        localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    // Sincronizar nome e contato do fornecedor nos produtos vinculados
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!Array.isArray(p.fornecedores)) return p;
        const hasIt = p.fornecedores.some((f) => f.fornecedorId === supplier.id);
        if (!hasIt) return p;
        return {
          ...p,
          fornecedores: p.fornecedores.map((f) =>
            f.fornecedorId === supplier.id ? { ...f, nome: supplier.nome, contato: supplier.contato } : f
          )
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    handleToast(`Fornecedor "${supplier.nome}" salvo com sucesso! 🤝✅`);
  };

  const handleDeleteSupplier = (supplierId) => {
    setSuppliers((prev) => {
      const next = prev.filter((s) => s.id !== supplierId);
      try {
        localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    // Desvincular de todos os perfumes e atualizar o estoque
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!Array.isArray(p.fornecedores)) return p;
        const filtered = p.fornecedores.filter((f) => f.fornecedorId !== supplierId);
        if (filtered.length === p.fornecedores.length) return p;
        const proprio = p.estoqueProprio !== undefined ? Number(p.estoqueProprio) : Number(p.qtdEstoque || 0);
        const nextTotal = proprio + filtered.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
        return {
          ...p,
          fornecedores: filtered,
          qtdEstoque: nextTotal
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    handleToast('Fornecedor removido e cotas de estoque atualizadas! 🗑️');
  };

  const handleSaveProduct = (productData) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.sku === productData.sku);
      let next;
      if (exists) {
        next = prev.map((p) => (p.sku === productData.sku ? { ...p, ...productData } : p));
      } else {
        next = [productData, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    handleToast(`Perfume "${productData.cleanName || productData.name}" salvo com sucesso! 📦✨`);
  };

  const handleDeleteProduct = (productSku) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.sku !== productSku);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    handleToast('Perfume excluído do catálogo! 🗑️');
  };

  // Filter & Search for copyboard
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((item) => {
      if (activeFilter === 'arab' && !item.isArabic) return false;
      if (activeFilter === 'brand' && item.isArabic) return false;
      if (activeFilter === 'fem' && item.genderWord !== 'Feminino') return false;
      if (activeFilter === 'masc' && item.genderWord !== 'Masculino') return false;
      if (activeFilter === 'uni' && item.genderWord !== 'Unissex') return false;

      if (!q) return true;

      const searchable = [
        item.name,
        item.cleanName,
        item.sku,
        item.cod,
        item.ref,
        item.familia,
        item.saida,
        item.corpo,
        item.fundo,
        item.genderWord,
        item.titleShort,
        item.titleLong,
        item.tagsString
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(q);
    });
  }, [products, searchQuery, activeFilter]);

  // Statistics
  const arabicCount = useMemo(() => products.filter((p) => p.isArabic).length, [products]);
  const brandCount = useMemo(() => products.filter((p) => !p.isArabic).length, [products]);
  const totalPhotos = useMemo(
    () => products.reduce((acc, p) => acc + (p.imageCount || p.images?.length || 0), 0),
    [products]
  );

  // Render unified modern SaaS Admin Platform full screen
  return (
    <div className="admin-fullscreen-container">
      <AdminCenter
        products={products}
        orders={orders}
        expenses={expenses}
        stockPurchases={stockPurchases}
        suppliers={suppliers}
        onUpdateProduct={handleUpdateProduct}
        onBatchUpdate={handleBatchUpdate}
        onResetToDefaults={handleResetToDefaults}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onSaveSupplier={handleSaveSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        onSaveOrder={handleSaveOrder}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onTogglePaymentStatus={handleTogglePaymentStatus}
        onDeleteOrder={handleDeleteOrder}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
        onToggleExpenseStatus={handleToggleExpenseStatus}
        onSaveStockPurchase={handleSaveStockPurchase}
        onDeleteStockPurchase={handleDeleteStockPurchase}
        onToast={handleToast}
        onOpenProductModal={setActiveModalProduct}
      />
      {activeModalProduct && (
        <ProductModal
          item={activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          onCopy={handleCopy}
        />
      )}
      <Toast message={toastMessage} />
    </div>
  );
}
