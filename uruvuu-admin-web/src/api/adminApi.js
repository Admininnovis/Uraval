import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const adminHttp = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
});

adminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('uravuu_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminHttp.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || (error.response?.status === 403 && window.location.pathname !== '/login')) {
      localStorage.removeItem('uravuu_admin_token');
      localStorage.removeItem('uravuu_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  login: (email, password) => adminHttp.post('/login', { email, password }),
  getOverview: (params) => adminHttp.get('/overview', { params }),
  getUsers: (params) => adminHttp.get('/users', { params }),
  getUserDetails: (id) => adminHttp.get(`/users/${id}`),
  getBooklets: (params) => adminHttp.get('/booklets', { params }),
  getPayments: (params) => adminHttp.get('/payments', { params }),
  exportPaymentsCsv: (params) =>
    adminHttp.get('/payments/export', {
      params,
      responseType: 'blob',
    }),
  getInvoices: (params) => adminHttp.get('/invoices', { params }),
  getAllInvoicesByMonth: (params) => adminHttp.get('/invoices/all-by-month', { params }),
};

export default adminHttp;
