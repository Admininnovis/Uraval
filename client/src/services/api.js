import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    } else if (
      error.response?.status === 403 &&
      (error.response?.data?.code === 'ACCOUNT_ACCESS_EXPIRED' || error.response?.data?.error === 'ACCOUNT_ACCESS_EXPIRED')
    ) {
      // Broadcast event for application access expired modal
      window.dispatchEvent(new CustomEvent('uravuu:access_expired', { detail: error.response.data }));
    }
    return Promise.reject(error);
  }
);

// Billing & Subscription API helpers
export const billingApi = {
  getAccessStatus: () => api.get('/billing/access-status'),
  createMaintenancePurchase: () => api.post('/billing/maintenance-purchase'),
  createBookletPurchase: (data) => api.post('/billing/booklet-purchase', data),
  verifyPayment: (data) => api.post('/billing/verify-payment', data),
  recoverPurchaseStatus: (reference) => api.get(`/billing/purchases/${reference}/recover`),
  getUserPurchases: () => api.get('/billing/purchases'),
  getReceipt: (reference) => api.get(`/billing/receipt/${reference}`),
};

export default api;
