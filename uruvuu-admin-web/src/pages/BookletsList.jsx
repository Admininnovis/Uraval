import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../api/adminApi';
import {
  Search,
  Book,
  BookOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function BookletsList() {
  const [booklets, setBooklets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooklets(1);
  }, [statusFilter]);

  const loadBooklets = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getBooklets({
        page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });

      setBooklets(res.data.booklets);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching booklets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBooklets(1);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Booklets & Ledgers</h1>
            <p className="page-subtitle">Track activated and draft booklets, owners, and booklet-creation payments.</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-card" style={{ padding: '1rem 1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <input
                type="text"
                placeholder="Search by booklet name, type, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">All Booklets (Draft & Active)</option>
                <option value="active">Active (Paid / Legacy)</option>
                <option value="draft">Draft (Pending Payment)</option>
              </select>

              <button type="submit" className="btn btn-primary btn-sm">Search</button>
              {(search || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    loadBooklets(1);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Booklets Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booklet Details</th>
                <th>Owner</th>
                <th>Owner Access Status</th>
                <th>Booklet State</th>
                <th>Creation Payment Status</th>
                <th>Razorpay Reference</th>
                <th>Activated Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--accent-gold)' }} />
                    Loading booklets...
                  </td>
                </tr>
              ) : booklets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No booklets found.
                  </td>
                </tr>
              ) : (
                booklets.map((b) => {
                  const ownerStatus = b.ownerAccessStatus || b.owner?.accessStatus || 'none';
                  const bookletTitle = b.eventName || b.name || 'Untitled Booklet';

                  return (
                    <tr key={b.id}>
                      <td>
                        <strong style={{ color: 'var(--text-main)', display: 'block' }}>{bookletTitle}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Type: {b.eventType} • Date: {new Date(b.eventDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        {b.owner ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.owner.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{b.owner.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Unknown</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            ownerStatus === 'free_trial'
                              ? 'badge-info'
                              : ownerStatus === 'active_paid'
                              ? 'badge-success'
                              : ownerStatus === 'expired'
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                        >
                          {ownerStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                      <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {b.status === 'active' ? 'Activated' : 'Draft'}
                      </span>
                      {b.isLegacy && (
                        <span className="badge badge-neutral" style={{ marginLeft: '0.35rem', fontSize: '0.65rem' }}>
                          Legacy
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          b.purchaseStatus === 'captured'
                            ? 'badge-success'
                            : b.purchaseStatus === 'pending'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {b.purchaseStatus || (b.isLegacy ? 'Legacy Granted' : 'Pending')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {b.razorpayPaymentId || b.razorpayOrderId || (b.isLegacy ? 'Legacy Record' : '—')}
                      </span>
                    </td>
                    <td>
                      {b.activatedAt ? new Date(b.activatedAt).toLocaleDateString() : 'Pending'}
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
            Showing {(pagination.page - 1) * pagination.limit + (booklets.length > 0 ? 1 : 0)} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} booklets
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => loadBooklets(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-outline btn-sm"
              style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => loadBooklets(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="btn btn-outline btn-sm"
              style={{ opacity: pagination.page >= pagination.pages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
