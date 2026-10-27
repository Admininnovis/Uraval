import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../api/adminApi';
import {
  Search,
  Download,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Calendar,
} from 'lucide-react';

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [datasetSummary, setDatasetSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPayments(1);
  }, [purposeFilter, statusFilter]);

  const loadPayments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getPayments({
        page,
        limit: pagination.limit,
        search: search || undefined,
        purpose: purposeFilter || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setPayments(res.data.payments);
      setPagination(res.data.pagination);
      setDatasetSummary(res.data.summary);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPayments(1);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await adminApi.exportPaymentsCsv({
        search: search || undefined,
        purpose: purposeFilter || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      // Trigger browser download
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uravuu-payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Could not generate CSV export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header & Export Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Transactions & Payments</h1>
            <p className="page-subtitle">Authoritative Uravuu transactions, Razorpay IDs, and dataset financial summaries.</p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="btn btn-export"
          >
            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={15} />}
            <span>Export Filtered CSV</span>
          </button>
        </div>

        {/* Dataset Summary Across Full Filtered Dataset (not just current page) */}
        {datasetSummary && (
          <div className="metrics-grid" style={{ marginBottom: 0 }}>
            <div className="metric-card gold-border">
              <span className="metric-label">Dataset Filtered Captured</span>
              <div className="metric-value">₹{(datasetSummary.totalCapturedAmountRupees ?? 0).toLocaleString()}</div>
              <span className="metric-sub">Calculated across full filtered dataset</span>
            </div>

            <div className="metric-card green-border">
              <span className="metric-label">Successful Purchases</span>
              <div className="metric-value" style={{ color: '#34D399' }}>{datasetSummary.capturedCount ?? 0}</div>
              <span className="metric-sub">Captured & fulfilled orders</span>
            </div>

            <div className="metric-card red-border">
              <span className="metric-label">Failed Payment Attempts</span>
              <div className="metric-value" style={{ color: '#F87171' }}>{datasetSummary.failedCount ?? 0}</div>
              <span className="metric-sub">Declined by bank/provider</span>
            </div>

            <div className="metric-card amber-border">
              <span className="metric-label">Pending Purchases</span>
              <div className="metric-value" style={{ color: '#FBBF24' }}>{datasetSummary.pendingCount ?? 0}</div>
              <span className="metric-sub">Awaiting customer or provider action</span>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="admin-card" style={{ padding: '1rem 1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <input
                type="text"
                placeholder="Search by reference, order ID, or payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">All Purposes</option>
                <option value="booklet_creation">Booklet Creation (₹150)</option>
                <option value="account_maintenance">Account Maintenance (₹100)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">All Statuses</option>
                <option value="captured">Captured</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
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
              {(search || purposeFilter || statusFilter || startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPurposeFilter('');
                    setStatusFilter('');
                    setStartDate('');
                    setEndDate('');
                    loadPayments(1);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Payments Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Purpose</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Razorpay Order / Payment</th>
                <th>Created / Captured</th>
                <th>Warnings & Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--accent-gold)' }} />
                    Loading transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No payment records matching criteria found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>
                        {p.purchaseReference}
                      </span>
                    </td>
                    <td>
                      {p.user ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{p.user.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Unknown</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {p.purpose === 'booklet_creation' ? 'Booklet Creation' : 'Account Maintenance'}
                      </span>
                      {p.booklet && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          Booklet: {p.booklet.eventName}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{(p.amount / 100).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === 'captured'
                            ? 'badge-success'
                            : p.status === 'failed'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                        {p.razorpayPaymentId || '—'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Order: {p.razorpayOrderId}
                      </div>
                    </td>
                    <td>
                      <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                      {p.fulfilledAt && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)' }}>
                          Captured: {new Date(p.fulfilledAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.isDuplicateCaptureFlagged ? (
                        <span className="badge badge-danger" title="Unexpected duplicate payment captured on same order">
                          <AlertTriangle size={12} /> Duplicate Capture
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {p.reconciliationNotes || 'Verified'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + (payments.length > 0 ? 1 : 0)} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => loadPayments(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-outline btn-sm"
              style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => loadPayments(pagination.page + 1)}
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
