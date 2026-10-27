import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Event from '../models/Event.js';
import AccountAccess from '../models/AccountAccess.js';
import { addCalendarMonths } from '../utils/dateUtils.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moi-kanakku';

/**
 * Migration Script: Initialize AccountAccess for all existing users from their original registration date,
 * and mark existing legacy booklets as active and paid.
 */
export async function runMigration() {
  console.log('[Migration] Connecting to MongoDB at', MONGODB_URI);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  console.log('[Migration] Step 1: Initializing AccountAccess for existing users...');
  const users = await User.find({ deleted: { $ne: true } });
  let createdAccessCount = 0;
  let existingAccessCount = 0;

  for (const user of users) {
    const existing = await AccountAccess.findOne({ user: user._id });
    if (!existing) {
      const freeStart = user.createdAt || new Date();
      const freeExpiry = addCalendarMonths(freeStart, 6);

      const access = new AccountAccess({
        user: user._id,
        initialFreePeriodStart: freeStart,
        initialFreePeriodExpiry: freeExpiry,
        paidMaintenanceExpiry: null,
        currentAccessExpiry: freeExpiry,
      });

      access.computeStatus();
      await access.save();
      createdAccessCount++;
    } else {
      existing.computeStatus();
      await existing.save();
      existingAccessCount++;
    }
  }

  console.log(`[Migration] User Access complete: ${createdAccessCount} initialized, ${existingAccessCount} verified.`);

  console.log('[Migration] Step 2: Marking existing legacy booklets as active and paid...');
  const eventUpdateResult = await Event.updateMany(
    { isPaid: { $ne: true } },
    {
      $set: {
        status: 'active',
        isPaid: true,
        isLegacy: true,
      },
    }
  );

  console.log(`[Migration] Booklets verified/updated: ${eventUpdateResult.modifiedCount} updated.`);
  console.log('[Migration] Safe migration completed successfully.');

  return { createdAccessCount, existingAccessCount, eventsUpdated: eventUpdateResult.modifiedCount };
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].endsWith('migrateAccountAccess.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
