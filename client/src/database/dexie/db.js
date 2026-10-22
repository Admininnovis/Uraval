import Dexie from 'dexie';

// Initialize the Dexie database
export const db = new Dexie('MOIOfflineDatabase');

// Define the database schema
// Note: We only index fields that we need to query against (like serverId, localId, syncStatus, etc.)
db.version(1).stores({
  events: '++localId, serverId, syncStatus, operationType, updatedAt',
  moiRecords: '++localId, serverId, eventId, personId, syncStatus, operationType, updatedAt',
  guests: '++localId, serverId, syncStatus, operationType, updatedAt',
  ledgers: '++localId, serverId, eventId, syncStatus, operationType, updatedAt',
  payments: '++localId, serverId, eventId, syncStatus, operationType, updatedAt',
  expenses: '++localId, serverId, eventId, syncStatus, operationType, updatedAt',
  users: '++localId, serverId, syncStatus, operationType, updatedAt',
  settings: '++localId, serverId, syncStatus, operationType, updatedAt',
  reports: '++localId, serverId, syncStatus, operationType, updatedAt',
  syncQueue: '++id, collection, localId, operationType, createdAt' // Dedicated queue for ordered sync processing
});

export default db;
