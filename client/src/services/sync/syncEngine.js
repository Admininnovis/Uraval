import { db } from '../../database/dexie/db';
import { useSyncStore } from '../../store/useSyncStore';
import api from '../api';

class SyncEngine {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
  }

  start() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Initialize state
    useSyncStore.getState().setOnlineStatus(navigator.onLine);

    if (navigator.onLine) {
      this.sync();
    }

    // Periodic sync just in case
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, 60000); // Every minute
  }

  stop() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  handleOnline() {
    useSyncStore.getState().setOnlineStatus(true);
    this.sync();
  }

  handleOffline() {
    useSyncStore.getState().setOnlineStatus(false);
  }

  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    useSyncStore.getState().setIsSyncing(true);

    try {
      await this.pushChanges();
      await this.pullChanges();
      useSyncStore.getState().setLastSyncTime(new Date());
    } catch (error) {
      console.error('[SyncEngine] Sync failed:', error);
    } finally {
      this.isSyncing = false;
      useSyncStore.getState().setIsSyncing(false);
      this.updatePendingCount();
    }
  }

  async updatePendingCount() {
    const count = await db.syncQueue.count();
    useSyncStore.getState().setPendingItemsCount(count);
  }

  async pushChanges() {
    const queue = await db.syncQueue.orderBy('createdAt').toArray();
    if (queue.length === 0) return;

    useSyncStore.getState().setSyncProgress(10);
    
    // We can either push one by one, or send a batch. 
    // Sending a batch to a dedicated /api/sync endpoint is more robust for transactions.
    
    // Construct the payload mapping localIds to the actual data
    const operations = await Promise.all(queue.map(async (item) => {
      const collection = item.collection;
      const record = await db[collection].get(item.localId);
      return {
        ...item,
        data: record
      };
    }));

    try {
      // Direct axios call (bypassing the adapter interceptor since we pass specific config?)
      // Wait, our adapter only intercepts when offline. Since we are online, it hits the network!
      const response = await api.post('/sync/push', { operations });
      
      // If successful, clear the queue and mark records as synced
      if (response.status === 200) {
        const { serverUpdates } = response.data; // Server might return mapped IDs

        await db.transaction('rw', db.syncQueue, ...db.tables, async () => {
          // Remove processed items from queue
          const queueIds = queue.map(q => q.id);
          await db.syncQueue.bulkDelete(queueIds);
          
          // Update local records with server IDs and syncStatus = 'synced'
          for (const update of serverUpdates) {
             const table = db[update.collection];
             if (table) {
                const localRecord = await table.get(update.localId);
                if (localRecord) {
                   await table.put({
                     ...localRecord,
                     serverId: update.serverId,
                     syncStatus: 'synced',
                     operationType: 'none',
                     updatedAt: new Date(update.updatedAt)
                   });
                }
             }
          }
        });
        
        useSyncStore.getState().setSyncProgress(50);
      }
    } catch (error) {
      console.error('[SyncEngine] Push failed', error);
      throw error;
    }
  }

  async pullChanges() {
    const lastSyncTime = useSyncStore.getState().lastSyncTime;
    
    try {
      const response = await api.get('/sync/pull', {
        params: { lastSyncedAt: lastSyncTime ? lastSyncTime.toISOString() : null }
      });

      if (response.status === 200) {
        const { deltas } = response.data; // { events: [...], people: [...], ... }
        
        await db.transaction('rw', ...db.tables, async () => {
          for (const [collection, records] of Object.entries(deltas)) {
            const table = db[collection];
            if (!table) continue;

            for (const record of records) {
              const existing = await table.where('serverId').equals(record._id).first();
              const serverData = {
                ...record,
                serverId: record._id,
                syncStatus: 'synced',
                operationType: 'none',
                updatedAt: new Date(record.updatedAt),
                version: record.version || 1
              };

              if (existing) {
                // Conflict resolution: Server wins if it's newer and we aren't pending a push
                if (existing.syncStatus !== 'pending' || new Date(serverData.updatedAt) > existing.updatedAt) {
                  await table.put({ ...existing, ...serverData });
                }
              } else {
                await table.add(serverData);
              }
            }
          }
        });
        useSyncStore.getState().setSyncProgress(100);
      }
    } catch (error) {
      console.error('[SyncEngine] Pull failed', error);
      throw error;
    }
  }
}

export const syncEngine = new SyncEngine();
