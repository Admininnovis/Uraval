import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import uravinLogo from '../assets/uravin-logo.png';
import {
  LayoutGrid,
  BookOpen,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

const TopNav = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { t, language, toggleLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: language === 'ta' ? 'கண்ணோட்டம்' : 'Overview', icon: LayoutGrid, path: '/' },
    { label: language === 'ta' ? 'நிகழ்வு குறிப்பேடு' : 'Event Ledger', icon: BookOpen, path: '/events' },
    { label: language === 'ta' ? 'தனிப்பட்ட கணக்கு' : 'Personal Ledger', icon: User, path: '/personal-ledger' },
    { label: language === 'ta' ? 'அமைப்புகள்' : 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'S';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#EDE5D8]/95 backdrop-blur-sm border-b border-[#DDD1BF] font-sans">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 md:h-18">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-[#432C20] hover:opacity-90 transition-opacity">
          <img
            src={uravinLogo}
            alt="Uravin Logo"
            className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-full border border-[#B68A3D]/50 shadow-xs"
          />
          <span className="font-serif font-bold text-xl md:text-2xl text-[#432C20] tracking-tight">
            Uravin
          </span>
        </Link>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex space-x-6 lg:space-x-8 items-center h-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 h-full transition-all text-sm font-medium relative ${
                  active 
                    ? 'text-[#432C20] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#B68A3D] after:rounded-t-sm' 
                    : 'text-stone-600 hover:text-[#432C20]'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#B68A3D]' : 'text-stone-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F3EB] hover:bg-[#FAF7F2] text-[#B68A3D] border border-[#DDD1BF] rounded-lg transition-all font-bold text-xs shadow-sm min-h-[38px]"
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            <span className="font-serif font-bold text-xs">文</span>
            <span>{language === 'en' ? 'TA' : 'EN'}</span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[#DDD1BF]/40 transition-colors min-h-[44px] min-w-[44px] justify-center"
              aria-label="User Account Menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#432C20] text-[#FAF7F0] flex items-center justify-center font-bold text-xs shadow-sm">
                {userInitial}
              </div>
              <ChevronDown size={14} className="text-[#432C20]/70" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl shadow-lg py-1.5 z-50 text-sm">
                <div className="px-4 py-2.5 border-b border-[#DDD1BF]/60">
                  <p className="font-bold text-[#432C20] truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-stone-500 truncate">{user?.email || ''}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[#432C20] hover:bg-[#EDE5D8] transition-colors"
                >
                  <Settings size={16} className="text-[#B68A3D]" />
                  <span>{t('sidebar.settings') || 'Settings'}</span>
                </Link>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[#C62828] hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>{t('sidebar.closeLedger') || 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
