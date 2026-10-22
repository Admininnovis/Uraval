import axios from 'axios';
import { routeOfflineRequest } from './offline/offlineRouter';
import { useSyncStore } from '../store/useSyncStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Use a custom adapter to intercept requests when offline
const defaultAdapter = axios.defaults.adapter;

api.defaults.adapter = async function (config) {
  const isOnline = useSyncStore.getState().isOnline;
  
  const handleOfflineFallback = async () => {
    const response = await routeOfflineRequest(config);
    return {
      data: response.data,
      status: response.status,
      statusText: 'OK',
      headers: {},
      config,
      request: {}
    };
  };

  if (!isOnline) {
    // We are explicitly offline, handle via Dexie
    return await handleOfflineFallback();
  }
  
  // Online, try standard adapter
  try {
    let response;
    if (typeof defaultAdapter === 'function') {
        response = await defaultAdapter(config);
    } else if (Array.isArray(defaultAdapter)) {
        const adapter = axios.getAdapter(defaultAdapter);
        response = await adapter(config);
    } else {
        response = await axios.defaults.adapter(config);
    }
    return response;
  } catch (error) {
    // If the server is unreachable (e.g. Network Error), fallback to offline mode
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
       console.warn('[API] Server unreachable, falling back to offline router.');
       useSyncStore.getState().setOnlineStatus(false); // Force offline mode
       return await handleOfflineFallback();
    }
    throw error;
  }
};

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
    }
    return Promise.reject(error);
  }
);

export default api;
