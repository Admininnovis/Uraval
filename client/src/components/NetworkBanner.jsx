import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useSyncStore } from '../store/useSyncStore';

export default function NetworkBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { language } = useLanguage();
  const setSyncStoreOnline = useSyncStore((state) => state.setOnlineStatus);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStoreOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStoreOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStoreOnline]);

  const handleManualRetry = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/assets/uravin-logo.png', {
        method: 'HEAD',
        cache: 'no-store',
      });
      if (response.ok) {
        setIsOnline(true);
        setSyncStoreOnline(true);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 2500);
      } else {
        setIsOnline(false);
        setSyncStoreOnline(false);
      }
    } catch {
      setIsOnline(false);
      setSyncStoreOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  const isTamil = language === 'ta';

  return (
    <AnimatePresence>
      {(!isOnline || showRestored) && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2.5 shadow-lg flex items-center justify-between text-white text-xs sm:text-sm font-medium ${
            !isOnline
              ? 'bg-gradient-to-r from-[#8B1E1E] via-[#A82828] to-[#8B1E1E] border-b border-red-700'
              : 'bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] border-b border-green-700'
          }`}
        >
          <div className="flex items-center space-x-2.5 mx-auto sm:mx-0">
            {!isOnline ? (
              <div className="p-1 rounded-full bg-red-900/60 animate-pulse">
                <WifiOff className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="p-1 rounded-full bg-green-900/60">
                <Wifi className="w-4 h-4 text-white" />
              </div>
            )}
            <span>
              {!isOnline
                ? isTamil
                  ? 'இணைய இணைப்பு இல்லை • தயவுசெய்து நெட்வொர்க்கில் இணையவும்'
                  : 'No Internet Connection • Please connect to the network'
                : isTamil
                ? 'இணைப்பு மீண்டும் கிடைத்தது • ஆன்லைன்'
                : 'Connection Restored • Back Online'}
            </span>
          </div>

          {!isOnline && (
            <button
              onClick={handleManualRetry}
              disabled={isChecking}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 active:scale-95 transition rounded-md text-xs font-semibold cursor-pointer border border-white/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isTamil ? 'மீண்டும் முயற்சி' : 'Retry'}</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
