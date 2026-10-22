import { db } from '../dexie/db';
import { v4 as uuidv4 } from 'uuid';

export class BaseRepository {
  constructor(tableName) {
    this.table = db[tableName];
    this.tableName = tableName;
  }

  /**
   * Generates tracking metadata for a new record.
   */
  _generateMetadata(operationType = 'create') {
    return {
      syncStatus: 'pending',
      operationType,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
      version: 1
    };
  }

  /**
   * Add a new record to the local store and queue it for sync.
   * @param {Object} data - The payload
   * @returns {Promise<Object>} - The created record
   */
  async create(data) {
    return db.transaction('rw', this.table, db.syncQueue, async () => {
      const newRecord = {
        ...data,
        ...this._generateMetadata('create'),
        // Optionally map MongoDB _id to serverId if it's already there
        serverId: data._id || null
      };

      // Dexie will auto-increment localId
      const localId = await this.table.add(newRecord);
      const createdRecord = await this.table.get(localId);

      // Queue for background sync
      await db.syncQueue.add({
        collection: this.tableName,
        localId: localId,
        operationType: 'create',
        createdAt: new Date()
      });

      return createdRecord;
    });
  }

  /**
   * Update an existing record in the local store and queue it for sync.
   * @param {number|string} identifier - localId (preferred) or serverId
   * @param {Object} updates - The delta to apply
   */
  async update(identifier, updates) {
    return db.transaction('rw', this.table, db.syncQueue, async () => {
      // Find the record by localId or serverId
      let record;
      if (typeof identifier === 'number') {
        record = await this.table.get(identifier);
      } else {
        record = await this.table.where('serverId').equals(identifier).first();
      }

      if (!record) throw new Error(`Record not found in ${this.tableName}`);

      const updatedRecord = {
        ...record,
        ...updates,
        updatedAt: new Date(),
        // If it was already pending a create, it remains a create. Otherwise, it's an update.
        operationType: record.operationType === 'create' ? 'create' : 'update',
        syncStatus: 'pending',
        version: record.version + 1
      };

      await this.table.put(updatedRecord);

      await db.syncQueue.add({
        collection: this.tableName,
        localId: updatedRecord.localId,
        operationType: updatedRecord.operationType,
        createdAt: new Date()
      });

      return updatedRecord;
    });
  }

  /**
   * Mark a record as deleted in the local store and queue for sync.
   * @param {number|string} identifier - localId or serverId
   */
  async delete(identifier) {
    return db.transaction('rw', this.table, db.syncQueue, async () => {
      let record;
      if (typeof identifier === 'number') {
        record = await this.table.get(identifier);
      } else {
        record = await this.table.where('serverId').equals(identifier).first();
      }

      if (!record) return; // Already deleted or doesn't exist

      if (record.operationType === 'create' && record.syncStatus === 'pending') {
        // If it was never synced to the server, we can safely just delete it locally
        await this.table.delete(record.localId);
      } else {
        // Soft delete locally to sync to server
        const deletedRecord = {
          ...record,
          deleted: true,
          updatedAt: new Date(),
          operationType: 'delete',
          syncStatus: 'pending',
          version: record.version + 1
        };
        await this.table.put(deletedRecord);

        await db.syncQueue.add({
          collection: this.tableName,
          localId: record.localId,
          operationType: 'delete',
          createdAt: new Date()
        });
      }
    });
  }

  /**
   * Retrieves all non-deleted records
   */
  async getAll() {
    return this.table.filter(record => !record.deleted).toArray();
  }

  /**
   * Upserts data coming directly from the server (pull sync).
   * It skips adding them to the syncQueue.
   * @param {Array<Object>} records - Server records
   */
  async upsertFromServer(records) {
    return db.transaction('rw', this.table, async () => {
      for (const record of records) {
        const existing = await this.table.where('serverId').equals(record._id || record.serverId).first();

        // Standard mapping of MongoDB _id to serverId
        const serverData = {
          ...record,
          serverId: record._id || record.serverId,
          syncStatus: 'synced',
          operationType: 'none',
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
          version: record.version || 1
        };

        if (existing) {
          // If server version is strictly greater, or it's a forced sync update
          // Avoid overwriting a pending local edit unless it's a conflict resolution strategy
          if (existing.syncStatus !== 'pending' || new Date(serverData.updatedAt) > new Date(existing.updatedAt)) {
             await this.table.put({ ...existing, ...serverData });
          }
        } else {
          await this.table.add(serverData);
        }
      }
    });
  }
}
