import React from 'react';
import { X, Book, ShieldCheck, CreditCard, Calendar, Clock } from 'lucide-react';

export default function UserDetailModal({ userDetails, onClose }) {
  if (!userDetails) return null;

  const { user, access, booklets = [], maintenanceGrants = [], purchases = [] } = userDetails;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{user.name}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              <span>ID: {user._id || user.id}</span> • <span>{user.email}</span> {user.phone ? `• ${user.phone}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Account Access Summary */}
        <div style={{ background: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={14} /> Account Access & Maintenance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Status: </span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'uppercase' }}>{access?.status || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Access Valid Until: </span>
              <strong style={{ color: 'var(--text-main)' }}>
                {access?.currentAccessExpiry ? new Date(access.currentAccessExpiry).toLocaleDateString() : 'N/A'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Free Period Expiry: </span>
              <span>{access?.initialFreePeriodExpiry ? new Date(access.initialFreePeriodExpiry).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Paid Expiry: </span>
              <span>{access?.paidMaintenanceExpiry ? new Date(access.paidMaintenanceExpiry).toLocaleDateString() : 'None'}</span>
            </div>
          </div>
        </div>

        {/* Booklets Summaries */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Book size={15} style={{ color: 'var(--accent-gold)' }} /> Activated Booklets ({booklets.length})
          </h3>
          {booklets.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No booklets created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {booklets.map((b) => (
                <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>{b.eventName}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Type: {b.eventType} • Date: {new Date(b.eventDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Grants */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={15} style={{ color: 'var(--accent-primary)' }} /> Maintenance Grants History ({maintenanceGrants.length})
          </h3>
          {maintenanceGrants.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No paid maintenance renewals granted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {maintenanceGrants.map((g) => (
                <div key={g._id} style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>+6 Months Granted</span>
                    <span style={{ color: 'var(--text-dim)' }}>{new Date(g.grantedAt).toLocaleString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-dim)' }}>
                    Extended from {new Date(g.previousExpiry).toLocaleDateString()} to {new Date(g.newExpiry).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={15} style={{ color: 'var(--accent-success)' }} /> Purchases & Payment Records ({purchases.length})
          </h3>
          {purchases.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No payment transactions found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {purchases.map((p) => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>{p.purchaseReference}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      {p.purpose?.replace('_', ' ')} • {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{(p.amount / 100).toFixed(2)}</div>
                    <span className={`badge ${p.status === 'captured' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
