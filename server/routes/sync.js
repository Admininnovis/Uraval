import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import EventEntry from '../models/EventEntry.js';
import Person from '../models/Person.js';
import PersonalLedger from '../models/PersonalLedger.js';
import User from '../models/User.js';
import { protect as auth } from '../middleware/auth.js';

const router = express.Router();

// Map frontend collection names to Mongoose models
const modelMap = {
  events: Event,
  moiRecords: EventEntry,
  people: Person,
  guests: Person,
  ledgers: PersonalLedger,
  users: User,
  // ... other maps
};

// PULL endpoint - Get all changes since lastSyncedAt
router.get('/pull', auth, async (req, res) => {
  try {
    const { lastSyncedAt } = req.query;
    let query = {};
    
    if (lastSyncedAt) {
      query = { updatedAt: { $gt: new Date(lastSyncedAt) } };
    }

    const deltas = {
      events: await Event.find(query),
      moiRecords: await EventEntry.find(query),
      people: await Person.find(query),
      ledgers: await PersonalLedger.find(query),
    };

    res.json({ deltas });
  } catch (error) {
    console.error('Pull Sync Error:', error);
    res.status(500).json({ message: 'Server error during sync pull' });
  }
});

// PUSH endpoint - Receive batched changes from client
router.post('/push', auth, async (req, res) => {
  try {
    const { operations } = req.body;
    const serverUpdates = [];

    for (const op of operations) {
      const Model = modelMap[op.collection];
      if (!Model) continue;

      const clientData = op.data;
      const { serverId, operationType, updatedAt, version } = clientData;

      if (operationType === 'create') {
        const newRecord = new Model({ ...clientData, createdBy: req.user.id });
        await newRecord.save();
        
        serverUpdates.push({
          collection: op.collection,
          localId: op.localId,
          serverId: newRecord._id,
          updatedAt: newRecord.updatedAt,
        });
      } 
      else if (operationType === 'update') {
        if (!serverId) continue;
        const existingRecord = await Model.findById(serverId);
        
        if (existingRecord) {
          // Conflict Resolution: Latest timestamp wins (or could use version)
          if (new Date(updatedAt) > existingRecord.updatedAt || version > existingRecord.version) {
            Object.assign(existingRecord, clientData);
            existingRecord.version = version;
            await existingRecord.save();
            
            serverUpdates.push({
              collection: op.collection,
              localId: op.localId,
              serverId: existingRecord._id,
              updatedAt: existingRecord.updatedAt,
            });
          }
        }
      }
      else if (operationType === 'delete') {
         if (!serverId) continue;
         const existingRecord = await Model.findById(serverId);
         if (existingRecord) {
            existingRecord.deleted = true;
            existingRecord.version = version;
            await existingRecord.save();
            serverUpdates.push({
              collection: op.collection,
              localId: op.localId,
              serverId: existingRecord._id,
              updatedAt: existingRecord.updatedAt,
            });
         }
      }
    }

    res.json({ success: true, serverUpdates });
  } catch (error) {
    console.error('Push Sync Error:', error);
    res.status(500).json({ message: 'Server error during sync push', error: error.message });
  }
});

export default router;
