const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL || '').replace(/\/$/, '');

const fallbackProducts = [
  {
    productId: 'tree-001', name: 'Fraser Fir', type: 'Fraser Fir', size: '7 ft', price: 89.99,
    description: 'Fresh-cut Fraser Fir with strong branches, soft needles, and classic Christmas fragrance.', availableQuantity: 12
  },
  {
    productId: 'tree-002', name: 'Douglas Fir', type: 'Douglas Fir', size: '6 ft', price: 69.99,
    description: 'Full-bodied Douglas Fir with dense green foliage and a traditional holiday look.', availableQuantity: 18
  },
  {
    productId: 'tree-003', name: 'Balsam Fir', type: 'Balsam Fir', size: '7.5 ft', price: 99.99,
    description: 'Premium Balsam Fir with excellent needle retention and a rich evergreen scent.', availableQuantity: 8
  },
  {
    productId: 'tree-004', name: 'Blue Spruce', type: 'Blue Spruce', size: '5.5 ft', price: 59.99,
    description: 'Compact Blue Spruce with sturdy branches and a distinctive blue-green color.', availableQuantity: 10
  }
];

let localOrders = [];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

async function api(path, options = {}) {
  if (!API_BASE_URL) {
    return localApi(path, options);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `API error: ${response.status}`);
  return body;
}

async function localApi(path, options = {}) {
  const method = options.method || 'GET';
  if (method === 'GET' && path === '/products') return fallbackProducts;
  if (method === 'GET' && path.startsWith('/products/')) {
    const productId = path.split('/').pop();
    const product = fallbackProducts.find(p => p.productId === productId);
    if (!product) throw new Error('Product not found');
    return product;
  }
  if (method === 'POST' && path === '/orders') {
    const orderInput = JSON.parse(options.body || '{}');
    const product = fallbackProducts.find(p => p.productId === orderInput.productId);
    if (!product) throw new Error('Product not found');
    const quantity = Number(orderInput.quantity || 1);
    const order = {
      orderId: `local-order-${Date.now()}`,
      customerName: orderInput.customerName,
      customerEmail: orderInput.customerEmail,
      customerPhone: orderInput.customerPhone || '',
      productId: product.productId,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      estimatedTotal: Number((quantity * product.price).toFixed(2)),
      status: 'Submitted',
      createdAt: new Date().toISOString()
    };
    localOrders.unshift(order);
    return order;
  }
  if (method === 'GET' && path.startsWith('/orders/')) {
    const orderId = path.split('/').pop();
    const order = localOrders.find(o => o.orderId === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }
  if (method === 'GET' && path === '/orders') return localOrders;
  throw new Error('Local route not implemented');
}

function renderProductCard(product) {
  return `
    <article class="card">
      <h3>${product.name}</h3>
      <p class="muted">${product.type} · ${product.size}</p>
      <p>${product.description}</p>
      <p class="price">${money(product.price)}</p>
      <p class="muted">Available: ${product.availableQuantity}</p>
      <button onclick="selectProduct('${product.productId}')">View Details</button>
    </article>
  `;
}

function renderProductDetails(product) {
  return `
    <div class="card">
      <h3>${product.name}</h3>
      <p><strong>Type:</strong> ${product.type}</p>
      <p><strong>Size:</strong> ${product.size}</p>
      <p><strong>Price:</strong> ${money(product.price)}</p>
      <p><strong>Available:</strong> ${product.availableQuantity}</p>
      <p>${product.description}</p>
      <button onclick="prefillOrder('${product.productId}')">Order This Tree</button>
    </div>
  `;
}

function renderOrder(order) {
  return `
    <div class="card">
      <h3>Order ${order.orderId}</h3>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
      <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
      <p><strong>Product:</strong> ${order.productName} (${order.productId})</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Estimated Total:</strong> ${money(order.estimatedTotal)}</p>
      <p class="muted"><strong>Created:</strong> ${order.createdAt}</p>
    </div>
  `;
}

async function loadProducts() {
  const container = document.getElementById('products');
  container.innerHTML = '<p class="muted">Loading products...</p>';
  try {
    const products = await api('/products');
    container.innerHTML = products.map(renderProductCard).join('');
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function selectProduct(productId) {
  const container = document.getElementById('productDetails');
  container.innerHTML = '<p class="muted">Loading product details...</p>';
  try {
    const product = await api(`/products/${productId}`);
    container.innerHTML = renderProductDetails(product);
    prefillOrder(product.productId);
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function prefillOrder(productId) {
  document.getElementById('productId').value = productId;
}

async function submitOrder(event) {
  event.preventDefault();
  const result = document.getElementById('orderResult');
  const payload = {
    productId: document.getElementById('productId').value.trim(),
    quantity: Number(document.getElementById('quantity').value),
    customerName: document.getElementById('customerName').value.trim(),
    customerEmail: document.getElementById('customerEmail').value.trim(),
    customerPhone: document.getElementById('customerPhone').value.trim()
  };
  result.innerHTML = '<p class="muted">Submitting order...</p>';
  try {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify(payload) });
    result.innerHTML = `<p class="success">Order submitted successfully.</p>${renderOrder(order)}`;
    document.getElementById('lookupOrderId').value = order.orderId;
  } catch (err) {
    result.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function lookupOrder() {
  const orderId = document.getElementById('lookupOrderId').value.trim();
  if (!orderId) return;
  const container = document.getElementById('orderDetails');
  container.innerHTML = '<p class="muted">Loading order...</p>';
  try {
    const order = await api(`/orders/${orderId}`);
    container.innerHTML = renderOrder(order);
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function loadOrders() {
  const container = document.getElementById('orders');
  container.innerHTML = '<p class="muted">Loading orders...</p>';
  try {
    const orders = await api('/orders');
    container.innerHTML = orders.length ? orders.map(renderOrder).join('') : '<p class="muted">No orders yet.</p>';
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

document.getElementById('refreshProductsBtn').addEventListener('click', loadProducts);
document.getElementById('orderForm').addEventListener('submit', submitOrder);
document.getElementById('lookupOrderBtn').addEventListener('click', lookupOrder);
document.getElementById('loadOrdersBtn').addEventListener('click', loadOrders);

loadProducts();
