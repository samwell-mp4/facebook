// Mock initial orders demonstrating Snack Store BH order flow and accounting reconciliation
export const INITIAL_ORDERS = [
  {
    id: "PED-102941",
    createdAt: "2026-10-12T14:30:00Z",
    dataPedido: "2026-10-12",
    dataVencimento: "2026-10-22",
    cliente: {
      nome: "Juliana Mendes Alvarenga",
      telefone: "(31) 98451-2290",
      cpf: "109.842.336-12",
      endereco: {
        cep: "30130-110",
        rua: "Av. Getúlio Vargas",
        numero: "840",
        bairro: "Savassi",
        cidade: "Belo Horizonte",
        estado: "MG",
        complemento: "Sala 402"
      }
    },
    itens: [
      {
        sku: "ARAB-A002",
        cod: "A002",
        nome: "Arabic A002 Yara Rosa",
        ref: "Lattafa Yara Rosa",
        coverImage: "11 - ARABIC A002 YARA ROSA/perfume-arabe-a002-yara-rosa-lattafa-25ml-edp-01.jpg",
        isArabic: true,
        qty: 2,
        qtd: 2,
        precoVenda: 84.90,
        precoCusto: 37.00,
        subtotalVenda: 169.80,
        subtotalCusto: 74.00,
        lucroItem: 95.80,
        margemItem: 129.5
      },
      {
        sku: "BRAND-157",
        cod: "157",
        nome: "Brand Collection 157 Charlota",
        ref: "Bvlgari Omnia Crystalline",
        coverImage: "8 - BRAND 157 CHARLOTA/perfume-brand-collection-157-charlota-25ml-edp-01.jpg",
        isArabic: false,
        qty: 1,
        qtd: 1,
        precoVenda: 69.90,
        precoCusto: 29.50,
        subtotalVenda: 69.90,
        subtotalCusto: 29.50,
        lucroItem: 40.40,
        margemItem: 136.9
      }
    ],
    totais: {
      valorTotal: 239.70,
      custoTotal: 103.50,
      lucroBruto: 136.20,
      margemLucro: 131.6,
      qtdItens: 3
    },
    totalCobrar: 239.70,
    totalPago: 239.70,
    valorEmAberto: 0,
    formaPagamento: "pix",
    financeiro: {
      tipoVenda: "avista",
      metodoPagamento: "pix",
      valorTotal: 239.70,
      totalVenda: 239.70,
      totalCusto: 103.50,
      lucroBruto: 136.20,
      margemLucro: 131.6,
      statusPagamento: "pago",
      valorRecebido: 239.70,
      valorEmAberto: 0,
      pagoEm: "2026-10-12T14:35:00Z"
    },
    status: "concluido",
    observacoes: "Pagamento Pix aprovado. Entregue via Motoboy na Savassi.",
    historicoStatus: [
      { status: "pendente", data: "2026-10-12T14:30:00Z", nota: "Pedido criado via WhatsApp" },
      { status: "confirmado", data: "2026-10-12T14:35:00Z", nota: "Pix confirmado" },
      { status: "em-rota", data: "2026-10-12T15:20:00Z", nota: "Saiu com motoboy" },
      { status: "concluido", data: "2026-10-12T16:10:00Z", nota: "Entregue e concluído" }
    ]
  },
  {
    id: "PED-102942",
    createdAt: "2026-10-13T10:15:00Z",
    dataPedido: "2026-10-13",
    dataVencimento: "2026-10-27",
    cliente: {
      nome: "Rodrigo Vasconcelos (Lojista)",
      telefone: "(31) 99182-4455",
      cpf: "082.914.776-88",
      endereco: {
        cep: "31270-010",
        rua: "Av. Fleming",
        numero: "350",
        bairro: "Ouro Preto",
        cidade: "Belo Horizonte",
        estado: "MG",
        complemento: "Barbearia Fleming"
      }
    },
    itens: [
      {
        sku: "ARAB-A007",
        cod: "A007",
        nome: "Arabic A007 Fakhar Black",
        ref: "Lattafa Fakhar Black / YSL Y EDP",
        coverImage: "1 - ARABIC A007 FAKHAR PRETO/perfume-arabe-a007-fakhar-black-lattafa-ysl-y-edp-25ml-edp-01.jpg",
        isArabic: true,
        qty: 3,
        qtd: 3,
        precoVenda: 50.00,
        precoCusto: 37.00,
        subtotalVenda: 150.00,
        subtotalCusto: 111.00,
        lucroItem: 39.00,
        margemItem: 35.1
      },
      {
        sku: "ARAB-A001",
        cod: "A001",
        nome: "Arabic A001 Asad",
        ref: "Lattafa Asad / Sauvage Elixir",
        coverImage: "9 - ARABIC A001 ASAD/perfume-arabe-a001-asad-lattafa-sauvage-elixir-25ml-edp-01.jpg",
        isArabic: true,
        qty: 3,
        qtd: 3,
        precoVenda: 49.90,
        precoCusto: 37.00,
        subtotalVenda: 149.70,
        subtotalCusto: 111.00,
        lucroItem: 38.70,
        margemItem: 34.9
      },
      {
        sku: "BRAND-005",
        cod: "005",
        nome: "Brand Collection 005 One Million",
        ref: "Paco Rabanne One Million",
        coverImage: "23 - BRAND 005 ONE MILLION/perfume-brand-collection-005-one-million-25ml-edp-01.jpg",
        isArabic: false,
        qty: 4,
        qtd: 4,
        precoVenda: 39.90,
        precoCusto: 28.00,
        subtotalVenda: 159.60,
        subtotalCusto: 112.00,
        lucroItem: 47.60,
        margemItem: 42.5
      }
    ],
    totais: {
      valorTotal: 459.30,
      custoTotal: 334.00,
      lucroBruto: 125.30,
      margemLucro: 37.5,
      qtdItens: 10
    },
    totalCobrar: 459.30,
    totalPago: 0,
    valorEmAberto: 459.30,
    formaPagamento: "a-prazo",
    paymentSplits: {},
    financeiro: {
      tipoVenda: "aprazo",
      metodoPagamento: "a-prazo",
      valorTotal: 459.30,
      totalVenda: 459.30,
      totalCusto: 334.00,
      lucroBruto: 125.30,
      margemLucro: 37.5,
      statusPagamento: "pendente",
      valorRecebido: 0,
      valorEmAberto: 459.30,
      pagoEm: null
    },
    status: "em-rota",
    observacoes: "Compra de atacado para revenda em barbearia. Faturado a prazo para 14 dias.",
    historicoStatus: [
      { status: "pendente", data: "2026-10-13T10:15:00Z", nota: "Pedido de atacado criado" },
      { status: "confirmado", data: "2026-10-13T11:00:00Z", nota: "Separado no estoque de 25ml" },
      { status: "em-rota", data: "2026-10-14T09:30:00Z", nota: "Saiu para entrega" }
    ]
  },
  {
    id: "PED-102943",
    createdAt: "2026-10-14T09:00:00Z",
    dataPedido: "2026-10-14",
    dataVencimento: "2026-10-14",
    cliente: {
      nome: "Fernanda Costa Silva",
      telefone: "(31) 97312-8801",
      cpf: "135.792.468-01",
      endereco: {
        cep: "30310-000",
        rua: "Rua Grão Mogol",
        numero: "420",
        bairro: "Sion",
        cidade: "Belo Horizonte",
        estado: "MG",
        complemento: "Bloco B, Apto 302"
      }
    },
    itens: [
      {
        sku: "BRAND-477",
        cod: "477",
        nome: "Brand Collection 477 Good Girl Blush",
        ref: "Carolina Herrera Good Girl Blush",
        coverImage: "52 - BRAND 477/perfume-brand-collection-477-good-girl-blush-25ml-edp-01.jpg",
        isArabic: false,
        qty: 1,
        qtd: 1,
        precoVenda: 84.90,
        precoCusto: 38.00,
        subtotalVenda: 84.90,
        subtotalCusto: 38.00,
        lucroItem: 46.90,
        margemItem: 123.4
      },
      {
        sku: "BRAND-136",
        cod: "136",
        nome: "Brand Collection 136 Scandal",
        ref: "Jean Paul Gaultier Scandal",
        coverImage: "51 - BRAND 136 SCANDAL/perfume-brand-collection-136-scandal-25ml-edp-01.jpg",
        isArabic: false,
        qty: 1,
        qtd: 1,
        precoVenda: 79.90,
        precoCusto: 29.50,
        subtotalVenda: 79.90,
        subtotalCusto: 29.50,
        lucroItem: 50.40,
        margemItem: 170.8
      }
    ],
    totais: {
      valorTotal: 164.80,
      custoTotal: 67.50,
      lucroBruto: 97.30,
      margemLucro: 144.1,
      qtdItens: 2
    },
    totalCobrar: 164.80,
    totalPago: 0,
    valorEmAberto: 164.80,
    formaPagamento: "pix",
    paymentSplits: {},
    financeiro: {
      tipoVenda: "avista",
      metodoPagamento: "pix",
      valorTotal: 164.80,
      totalVenda: 164.80,
      totalCusto: 67.50,
      lucroBruto: 97.30,
      margemLucro: 144.1,
      statusPagamento: "pendente",
      valorRecebido: 0,
      valorEmAberto: 164.80,
      pagoEm: null
    },
    status: "pendente",
    observacoes: "Cliente solicitou chave Pix para efetuar pagamento.",
    historicoStatus: [
      { status: "pendente", data: "2026-10-14T09:00:00Z", nota: "Pedido criado e aguardando Pix" }
    ]
  }
];
