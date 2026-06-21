import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, BookOpen, Library, Settings, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, path: '/', label: 'Home' },
    { icon: Library, path: '/events', label: 'Events' },
    { icon: BookOpen, path: '/personal-ledger', label: 'Personal' },
    { icon: Settings, path: '/settings', label: 'Settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[var(--primary)]/10 px-6 py-2 z-50 shadow-[0_-10px_40px_rgba(15,23,42,0.05)] pb-safe">
      <div className="flex justify-between items-center relative">
        {navItems.map((item, index) => {
          if (item.isFab) {
            return (
              <div key="fab" className="relative -top-6">
                <Link to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_rgba(245,158,11,0.3)] border-4 border-white"
                  >
                    <Plus size={28} strokeWidth={2.5} />
                  </motion.div>
                </Link>
              </div>
            );
          }

          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center w-12 h-12 relative group">
              {active && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-[var(--secondary)]"
                />
              )}
              <Icon 
                size={22} 
                className={`transition-colors duration-300 ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]/70'}`} 
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[9px] mt-1 font-semibold ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
