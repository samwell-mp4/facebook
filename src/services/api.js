/**
 * Snack Store BH - Serviço de Conexão com API PostgreSQL na Nuvem
 * Gerencia persistência em tempo real no PostgreSQL com fallback transparente
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Status & Health
  async getHealth() {
    return request('/health');
  },

  // Produtos
  async getProducts() {
    return request('/products');
  },
  async saveProduct(product) {
    return request('/products', { method: 'POST', body: product });
  },
  async updateProduct(sku, updates) {
    return request(`/products/${encodeURIComponent(sku)}`, { method: 'PUT', body: updates });
  },
  async batchUpdateProducts(products) {
    return request('/products/batch', { method: 'POST', body: { products } });
  },
  async resetProducts() {
    return request('/products/reset', { method: 'POST' });
  },
  async deleteProduct(sku) {
    return request(`/products/${encodeURIComponent(sku)}`, { method: 'DELETE' });
  },

  // Pedidos
  async getOrders() {
    return request('/orders');
  },
  async saveOrder(order) {
    return request('/orders', { method: 'POST', body: order });
  },
  async updateOrderStatus(orderId, status) {
    return request(`/orders/${encodeURIComponent(orderId)}/status`, { method: 'PUT', body: { status } });
  },
  async toggleOrderPayment(orderId) {
    return request(`/orders/${encodeURIComponent(orderId)}/toggle-payment`, { method: 'PUT' });
  },
  async saveAcerto(orderId, acertoData) {
    return request(`/orders/${encodeURIComponent(orderId)}/acerto`, { method: 'POST', body: acertoData });
  },
  async deleteOrder(orderId) {
    return request(`/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
  },

  // Fornecedores
  async getSuppliers() {
    return request('/suppliers');
  },
  async saveSupplier(supplier) {
    return request('/suppliers', { method: 'POST', body: supplier });
  },
  async deleteSupplier(id) {
    return request(`/suppliers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Despesas
  async getExpenses() {
    return request('/expenses');
  },
  async saveExpense(expense) {
    return request('/expenses', { method: 'POST', body: expense });
  },
  async toggleExpenseStatus(id) {
    return request(`/expenses/${encodeURIComponent(id)}/toggle-status`, { method: 'PUT' });
  },
  async deleteExpense(id) {
    return request(`/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Compras de Estoque
  async getPurchases() {
    return request('/purchases');
  },
  async savePurchase(purchase) {
    return request('/purchases', { method: 'POST', body: purchase });
  },
  async deletePurchase(id) {
    return request(`/purchases/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Exportação / Backup Completo
  async exportDb() {
    return request('/db/export');
  }
};
