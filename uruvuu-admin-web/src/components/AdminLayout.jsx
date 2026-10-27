import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  LogOut,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { admin, logout } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/booklets', label: 'Booklets', icon: BookOpen },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/invoices', label: 'Invoices & Billing', icon: Receipt },
  ];

  return (
    <div className="admin-app">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #D4AF37, #966E2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1305', fontWeight: 800 }}>
            U
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Uravuu Admin
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 600, letterSpacing: '0.05em' }}>
              MANAGEMENT PORTAL
            </div>
          </div>
        </div>

        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} style={{ color: 'var(--accent-gold)' }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin User Footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {admin?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {admin?.email}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
