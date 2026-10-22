import { create } from 'zustand';

export const useSyncStore = create((set) => ({
  isOnline: navigator.onLine,
  syncProgress: 0,
  isSyncing: false,
  lastSyncTime: null,
  pendingItemsCount: 0,
  
  setOnlineStatus: (status) => set({ isOnline: status }),
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setPendingItemsCount: (count) => set({ pendingItemsCount: count }),
}));
