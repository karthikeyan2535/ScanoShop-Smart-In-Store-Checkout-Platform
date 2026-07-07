import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity = 1) => api.post('/cart/add', { productId, quantity }),
  updateItem: (cartItemId, quantity) => api.put('/cart/update', { cartItemId, quantity }),
  removeItem: (cartItemId) => api.delete(`/cart/remove/${cartItemId}`),
  clearCart: () => api.delete('/cart/clear'),
};

export const scanService = {
  scan: (barcode) => api.post('/scan', { barcode }),
};

export const orderService = {
  checkout: () => api.post('/order/checkout'),
  getUserOrders: (params) => api.get('/order/user', { params }),
  getOrderById: (id) => api.get(`/order/${id}`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getLowStock: () => api.get('/admin/low-stock'),
};

export const paymentService = {
  createOrder: () => api.post('/payments/create-order'),
  verifyPayment: (data) => api.post('/payments/verify', data),
};
