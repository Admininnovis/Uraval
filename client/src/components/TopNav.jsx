import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Settings,
  LogOut
} from 'lucide-react';

const TopNav = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const { t, language, toggleLanguage } = useLanguage();

  const menuItems = [
    { label: t('sidebar.index') || 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: t('sidebar.eventLedger') || 'Event Ledgers', icon: Library, path: '/events' },
    { label: t('sidebar.personalLedger') || 'Personal Ledgers', icon: BookOpen, path: '/personal-ledger' },
    { label: t('sidebar.settings') || 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-ledger-paper border-b border-ledger-brown/20 shadow-[0_4px_10px_rgba(0,0,0,0.05)] font-serif">
      <div className="absolute inset-0 opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
      {/* Decorative top ledger line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-ledger-red/80 z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex justify-between items-center h-20">
        
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-ledger-brown font-tamil tracking-wider drop-shadow-sm">
            {t('sidebar.titleLine1') || 'MOI'} {t('sidebar.titleLine2') || 'LEDGER'}
          </h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 items-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-2 py-2 transition-all ${
                  active 
                    ? 'text-ledger-red underline underline-offset-[6px] decoration-[3px] decoration-ledger-red' 
                    : 'text-ledger-ink/70 hover:text-ledger-brown'
                }`}
              >
                <Icon size={18} className={active ? 'text-ledger-red' : 'text-ledger-ink/50'} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={toggleLanguage}
            className="hidden md:flex items-center space-x-1 md:space-x-2 px-2 py-1.5 md:px-3 md:py-2 bg-[#2A2118] text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg hover:bg-[#1A140F] transition-all font-bold text-xs md:text-sm shadow-[0_4px_10px_rgba(0,0,0,0.3)] tracking-widest uppercase"
          >
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#2A2118] flex items-center justify-center text-[10px] md:text-xs">
              {language === 'en' ? 'த' : 'En'}
            </span>
            <span className="hidden sm:inline">{language === 'en' ? 'TA' : 'EN'}</span>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center space-x-1 md:space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-ledger-red via-[#8B0000] to-ledger-red text-white shadow-[0_4px_15px_rgba(155,44,44,0.4)] hover:shadow-[0_8px_25px_rgba(155,44,44,0.6)] border border-white/10 hover:-translate-y-0.5 active:scale-95 transition-all rounded-lg font-bold text-xs md:text-sm tracking-widest uppercase"
            title={t('sidebar.closeLedger') || 'Close Ledger'}
          >
            <LogOut size={16} className="text-white/80" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
