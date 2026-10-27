import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import UserDetailModal from '../components/UserDetailModal';
import { adminApi } from '../api/adminApi';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadUsers(1);
  }, [statusFilter]);

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleViewUser = async (id) => {
    try {
      setDetailLoading(true);
      const res = await adminApi.getUserDetails(id);
      setSelectedUserDetails(res.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Could not load user details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Registered Users</h1>
            <p className="page-subtitle">Account access lifecycles, maintenance statuses, and payment records.</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="admin-card" style={{ padding: '1rem 1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">All Access Statuses</option>
                <option value="free_trial">Free Trial</option>
                <option value="active_paid">Paid Active</option>
                <option value="expired">Expired</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                />
                <span>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm">Search</button>
              {(search || statusFilter || startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setStartDate('');
                    setEndDate('');
                    loadUsers(1);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Registration</th>
                <th>Active Booklets</th>
                <th>Access Status</th>
                <th>Effective Expiry</th>
                <th>Total Spent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--accent-gold)' }} />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const accessStatus = u.access?.status || 'unknown';
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ color: 'var(--text-main)', display: 'block' }}>{u.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          ID: {u.id}
                        </span>
                      </td>
                      <td>
                        <div>{u.email}</div>
                        {u.phone && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{u.phone}</div>}
                      </td>
                      <td>{new Date(u.registrationDate).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-neutral">{u.activatedBookletsCount} Booklets</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            accessStatus === 'free_trial'
                              ? 'badge-info'
                              : accessStatus === 'active_paid'
                              ? 'badge-success'
                              : 'badge-danger'
                          }`}
                        >
                          {accessStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {u.access?.currentAccessExpiry
                          ? new Date(u.access.currentAccessExpiry).toLocaleDateString()
                          : '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                        ₹{u.totalCapturedPaymentsRupees.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleViewUser(u.id)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + (users.length > 0 ? 1 : 0)} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => loadUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-outline btn-sm"
              style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => loadUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="btn btn-outline btn-sm"
              style={{ opacity: pagination.page >= pagination.pages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUserDetails && (
          <UserDetailModal
            userDetails={selectedUserDetails}
            onClose={() => setSelectedUserDetails(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
