import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../api/adminApi';
import {
  Users,
  BookOpen,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export default function Overview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOverview({ startDate: startDate || undefined, endDate: endDate || undefined });
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    loadOverview();
  };

  const allTime = metrics?.allTime;
  const period = metrics?.selectedPeriod;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header and Period Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Executive Overview</h1>
            <p className="page-subtitle">Authoritative ledger, subscription, and financial metrics across Uravuu.</p>
          </div>

          <form onSubmit={handleApplyFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={15} style={{ color: 'var(--accent-gold)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Filter</button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); loadOverview(); }}
                className="btn btn-outline btn-sm"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-gold)' }} />
            <div>Loading verified platform metrics...</div>
          </div>
        ) : (
          <>
            {/* 1. All-Time User & Access Metrics */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>
                All-Time Accounts & Access States
              </div>
              <div className="metrics-grid">
                <div className="metric-card gold-border">
                  <span className="metric-label">Total Registered Users</span>
                  <div className="metric-value">{allTime?.totalUsers ?? 0}</div>
                  <span className="metric-sub">Authoritative accounts in system</span>
                </div>

                <div className="metric-card green-border">
                  <span className="metric-label">Free Access Active</span>
                  <div className="metric-value" style={{ color: '#34D399' }}>{allTime?.accountsFree ?? 0}</div>
                  <span className="metric-sub">Within initial 6-month free access</span>
                </div>

                <div className="metric-card blue-border">
                  <span className="metric-label">Paid Maintenance Active</span>
                  <div className="metric-value" style={{ color: '#38BDF8' }}>{allTime?.accountsPaid ?? 0}</div>
                  <span className="metric-sub">Active via verified ₹100 renewal</span>
                </div>

                <div className="metric-card red-border">
                  <span className="metric-label">Access Expired</span>
                  <div className="metric-value" style={{ color: '#F87171' }}>{allTime?.accountsExpired ?? 0}</div>
                  <span className="metric-sub">Awaiting ₹100 maintenance renewal</span>
                </div>
              </div>
            </div>

            {/* 2. All-Time Booklets Metrics */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>
                Booklets & Ledgers
              </div>
              <div className="metrics-grid">
                <div className="metric-card gold-border">
                  <span className="metric-label">Total Activated Booklets</span>
                  <div className="metric-value">{allTime?.totalActivatedBooklets ?? 0}</div>
                  <span className="metric-sub">Verified paid or legacy booklets</span>
                </div>

                <div className="metric-card amber-border">
                  <span className="metric-label">Draft / Unpaid Booklets</span>
                  <div className="metric-value" style={{ color: '#FBBF24' }}>{allTime?.totalDraftBooklets ?? 0}</div>
                  <span className="metric-sub">Pending ₹150 creation payment</span>
                </div>

                <div className="metric-card green-border">
                  <span className="metric-label">Successful Purchases</span>
                  <div className="metric-value" style={{ color: '#34D399' }}>{allTime?.successfulPurchasesCount ?? 0}</div>
                  <span className="metric-sub">Fulfilled Uravuu purchases</span>
                </div>
              </div>
            </div>

            {/* 3. Collections & Financial Breakdown (All-Time) */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>
                All-Time Collections Breakdown (Uravuu Only)
              </div>
              <div className="metrics-grid">
                <div className="metric-card gold-border">
                  <span className="metric-label">Gross Captured Collections</span>
                  <div className="metric-value">₹{(allTime?.grossCapturedRupees ?? 0).toLocaleString()}</div>
                  <span className="metric-sub">Collections before gateway fees & taxes</span>
                </div>

                <div className="metric-card blue-border">
                  <span className="metric-label">Booklet Creation (₹150 Incl. GST)</span>
                  <div className="metric-value">₹{(allTime?.bookletCreationRupees ?? 0).toLocaleString()}</div>
                  <span className="metric-sub">18% GST snapshot applied</span>
                </div>

                <div className="metric-card green-border">
                  <span className="metric-label">Account Maintenance (₹100)</span>
                  <div className="metric-value">₹{(allTime?.maintenanceRupees ?? 0).toLocaleString()}</div>
                  <span className="metric-sub">6-Month full account coverage</span>
                </div>

                <div className="metric-card red-border">
                  <span className="metric-label">Total Refunded</span>
                  <div className="metric-value">₹{(allTime?.refundedRupees ?? 0).toLocaleString()}</div>
                  <span className="metric-sub">Executed refunds</span>
                </div>

                <div className="metric-card gold-border">
                  <span className="metric-label">Collections After Refunds</span>
                  <div className="metric-value" style={{ color: '#F3E5AB' }}>
                    ₹{(allTime?.collectionsAfterRefundsRupees ?? 0).toLocaleString()}
                  </div>
                  <span className="metric-sub">Net provider captured volume</span>
                </div>
              </div>
            </div>

            {/* 4. Selected Period Metrics */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Selected Period Metrics
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {period?.startDate || period?.endDate ? `Filtered: ${period.startDate || 'Beginning'} to ${period.endDate || 'Now'}` : 'Showing all-time window'}
                  </div>
                </div>
                <TrendingUp size={20} style={{ color: 'var(--accent-gold)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>New Registrations</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{period?.newRegistrations ?? 0}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Captured Collections</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.2rem' }}>₹{(period?.capturedRupees ?? 0).toLocaleString()}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Successful Purchases</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem' }}>{period?.successfulCount ?? 0}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Failed Payment Attempts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F87171', marginTop: '0.2rem' }}>{period?.failedCount ?? 0}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Pending Purchases</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem' }}>{period?.pendingCount ?? 0}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
