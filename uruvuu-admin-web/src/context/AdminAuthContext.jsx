import React, { createContext, useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('uravuu_admin_user');
    const token = localStorage.getItem('uravuu_admin_token');
    if (storedUser && token) {
      try {
        setAdmin(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('uravuu_admin_user');
        localStorage.removeItem('uravuu_admin_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.login(email, password);
    const { token, admin: adminData } = res.data;
    localStorage.setItem('uravuu_admin_token', token);
    localStorage.setItem('uravuu_admin_user', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('uravuu_admin_token');
    localStorage.removeItem('uravuu_admin_user');
    setAdmin(null);
    window.location.href = '/login';
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
