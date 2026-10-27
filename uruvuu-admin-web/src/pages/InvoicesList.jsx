import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../api/adminApi';
import TaxInvoiceTemplate from '../components/TaxInvoiceTemplate';
import {
  downloadInvoiceElementPdf,
  downloadMultipleInvoiceElementsPdf,
} from '../utils/pdfGenerator';
import {
  Search,
  Download,
  Eye,
  Calendar,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle,
} from 'lucide-react';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [summary, setSummary] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Preview Modal state
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [downloadingSingle, setDownloadingSingle] = useState(false);

  // Batch download state
  const [batchInvoices, setBatchInvoices] = useState([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');

  useEffect(() => {
    loadInvoices(1);
  }, [selectedMonth]);

  const loadInvoices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getInvoices({
        page,
        limit: pagination.limit,
        month: selectedMonth || undefined,
        search: search || undefined,
      });

      setInvoices(res.data.invoices || []);
      setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
      setSummary(res.data.summary);
      if (res.data.availableMonths && res.data.availableMonths.length > 0) {
        setAvailableMonths(res.data.availableMonths);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInvoices(1);
  };

  const handleSingleDownload = async (invoiceData) => {
    try {
      setDownloadingSingle(true);
      // If previewing, download preview element; otherwise render hidden
      setPreviewInvoice(invoiceData);
      setTimeout(async () => {
        await downloadInvoiceElementPdf('invoice-preview-container', invoiceData.invoiceNumber);
        setDownloadingSingle(false);
      }, 300);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not generate PDF: ' + err.message);
      setDownloadingSingle(false);
    }
  };

  const handleBatchDownloadAll = async () => {
    try {
      setIsBatchGenerating(true);
      setBatchProgressText('Fetching all invoices for selected month...');
      const res = await adminApi.getAllInvoicesByMonth({
        month: selectedMonth || undefined,
      });

      const allItems = res.data.invoices || [];
      if (allItems.length === 0) {
        alert('No invoices found for the selected filter.');
        setIsBatchGenerating(false);
        return;
      }

      setBatchInvoices(allItems);
      setBatchProgressText(`Rendering ${allItems.length} invoices into single PDF...`);

      // Allow DOM to mount hidden elements
      setTimeout(async () => {
        try {
          const ids = allItems.map((_, idx) => `batch-inv-${idx}`);
          const monthLabel = selectedMonth || 'All-Months';
          await downloadMultipleInvoiceElementsPdf(ids, `Uravuu-Tax-Invoices-${monthLabel}.pdf`);
        } catch (genErr) {
          console.error('Batch generation error:', genErr);
          alert('Failed to generate combined PDF: ' + genErr.message);
        } finally {
          setIsBatchGenerating(false);
          setBatchInvoices([]);
          setBatchProgressText('');
        }
      }, 800);
    } catch (err) {
      console.error('Batch download error:', err);
      alert('Failed to fetch invoices for batch export');
      setIsBatchGenerating(false);
      setBatchProgressText('');
    }
  };

  const formatMonthDisplay = (ym) => {
    if (!ym) return 'All Months';
    const [y, m] = ym.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header & Batch Download */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Tax Invoices & Billing</h1>
            <p className="page-subtitle">Official computer-generated GST tax invoices for booklet creation and account maintenance.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleBatchDownloadAll}
              disabled={isBatchGenerating || invoices.length === 0}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              <span>{isBatchGenerating ? batchProgressText || 'Generating Combined PDF...' : 'Download Filtered as Single PDF'}</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}>
                <Receipt size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Invoices Issued</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{summary.totalInvoicesCount}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>₹{summary.totalGrossRupees}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Taxable Value</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{summary.totalTaxableRupees}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(147, 51, 234, 0.1)', color: '#A855F7' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>CGST + SGST (18%)</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{(parseFloat(summary.totalCgstRupees) + parseFloat(summary.totalSgstRupees)).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Month Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--accent-gold)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-select"
                style={{ minWidth: 180 }}
              >
                <option value="">All Invoices (All Time)</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthDisplay(ym)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: 360 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="text"
                placeholder="Search Invoice #, Name, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-text"
                style={{ paddingLeft: '2.25rem', width: '100%' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </form>
        </div>

        {/* Invoices Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Loading tax invoices...</div>
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No tax invoices found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Billed To</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td>{new Date(inv.date).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inv.user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{inv.user.email}</div>
                        {inv.user.phone && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{inv.user.phone}</div>}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {inv.purpose === 'booklet_creation' ? 'Booklet Creation' : 'Account Maintenance'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{inv.amountRupees.toFixed(2)}</td>
                      <td>
                        <span className="badge badge-success">PAID</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => setPreviewInvoice(inv.invoiceData)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Preview Invoice"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => handleSingleDownload(inv.invoiceData)}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Download PDF"
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Page {pagination.page} of {pagination.pages} ({pagination.total} invoices)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadInvoices(pagination.page - 1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadInvoices(pagination.page + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Single Invoice Preview */}
        {previewInvoice && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '850px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Modal Top Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>
                  Tax Invoice Preview — {previewInvoice.invoiceNumber}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleSingleDownload(previewInvoice)}
                    disabled={downloadingSingle}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={15} />
                    <span>{downloadingSingle ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={() => setPreviewInvoice(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Invoice Preview Viewport */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', background: '#0F172A' }}>
                <div style={{ transform: 'scale(0.92)', transformOrigin: 'top center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <TaxInvoiceTemplate invoice={previewInvoice} id="invoice-preview-container" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Off-screen Container for Batch Invoices Render */}
        {batchInvoices.length > 0 && (
          <div style={{ position: 'fixed', left: '-9999px', top: '0px', width: '794px', zIndex: -9999, pointerEvents: 'none' }}>
            {batchInvoices.map((inv, idx) => (
              <TaxInvoiceTemplate key={idx} invoice={inv} id={`batch-inv-${idx}`} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
