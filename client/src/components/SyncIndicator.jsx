import React, { useEffect, useContext } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { syncEngine } from '../services/sync/syncEngine';

export default function SyncIndicator() {
  const { isOnline, isSyncing, lastSyncTime, pendingItemsCount } = useSyncStore();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      syncEngine.start();
      return () => syncEngine.stop();
    }
  }, [isAuthenticated]);

  if (isOnline && !isSyncing && pendingItemsCount === 0) {
    return null; // Hidden when online and fully synced
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 bg-gray-900 text-white rounded-lg shadow-lg p-3 flex items-center justify-between z-50 max-w-sm">
      <div className="flex items-center gap-3">
        {!isOnline ? (
          <WifiOff className="w-5 h-5 text-red-400" />
        ) : isSyncing ? (
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        )}
        
        <div className="text-sm">
          {!isOnline && <p className="font-medium text-red-400">Offline Mode</p>}
          {isOnline && isSyncing && <p className="font-medium text-blue-400">Syncing changes...</p>}
          {isOnline && !isSyncing && pendingItemsCount > 0 && <p className="font-medium text-yellow-400">{pendingItemsCount} items pending sync</p>}
          
          {lastSyncTime && (
            <p className="text-xs text-gray-400">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      
      {!isOnline && pendingItemsCount > 0 && (
        <div className="bg-red-500/20 text-red-200 text-xs px-2 py-1 rounded-full whitespace-nowrap">
          {pendingItemsCount} pending
        </div>
      )}
    </div>
  );
}
