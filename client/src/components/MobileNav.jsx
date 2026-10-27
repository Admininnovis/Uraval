import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LayoutGrid, BookOpen, User, Settings, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const { language } = useLanguage();

  const navItems = [
    { 
      icon: LayoutGrid, 
      path: '/', 
      label: language === 'ta' ? 'கண்ணோட்டம்' : 'Overview' 
    },
    { 
      icon: BookOpen, 
      path: '/events', 
      label: language === 'ta' ? 'நிகழ்வுகள்' : 'Events' 
    },
    { 
      icon: User, 
      path: '/personal-ledger', 
      label: language === 'ta' ? 'தனிப்பட்டவை' : 'Personal' 
    },
    { 
      icon: ShieldCheck, 
      path: '/subscription', 
      label: language === 'ta' ? 'சந்தா' : 'Access' 
    },
    { 
      icon: Settings, 
      path: '/settings', 
      label: language === 'ta' ? 'அமைப்புகள்' : 'Settings' 
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F7F3EB]/95 backdrop-blur-md border-t border-[#DDD1BF] px-3 py-1.5 z-50 shadow-[0_-4px_16px_rgba(67,44,32,0.06)] pb-safe"
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 relative transition-all group"
            >
              {active && (
                <motion.div 
                  layoutId="activeMobileTab" 
                  className="absolute top-0.5 w-6 h-[2px] rounded-full bg-[#B68A3D]"
                />
              )}
              <Icon 
                size={20} 
                className={`transition-colors ${active ? 'text-[#B68A3D]' : 'text-stone-400 group-hover:text-[#432C20]'}`} 
                strokeWidth={active ? 2.3 : 1.9}
              />
              <span className={`text-[10px] mt-0.5 font-medium transition-colors leading-tight text-center truncate max-w-[76px] ${active ? 'text-[#432C20] font-bold' : 'text-stone-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
