import AccountAccess from '../models/AccountAccess.js';
import User from '../models/User.js';
import { addCalendarMonths, isAccessActive } from '../utils/dateUtils.js';

/**
 * Retrieves or initializes the AccountAccess record for a given user.
 * Existing users retain their free period starting from original registration (createdAt).
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<AccountAccess>}
 */
export async function getOrCreateAccountAccess(userId) {
  let access = await AccountAccess.findOne({ user: userId });

  if (!access) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const freePeriodStart = user.createdAt || new Date();
    const freePeriodExpiry = addCalendarMonths(freePeriodStart, 6);

    access = new AccountAccess({
      user: user._id,
      initialFreePeriodStart: freePeriodStart,
      initialFreePeriodExpiry: freePeriodExpiry,
      paidMaintenanceExpiry: null,
      currentAccessExpiry: freePeriodExpiry,
      status: 'free_trial',
    });

    access.computeStatus();
    await access.save();
  } else {
    const prevStatus = access.status;
    const newStatus = access.computeStatus();
    if (prevStatus !== newStatus) {
      await access.save();
    }
  }

  return access;
}

/**
 * Checks whether an account currently has active access.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ hasAccess: boolean, access: AccountAccess }>}
 */
export async function checkUserAccess(userId) {
  const access = await getOrCreateAccountAccess(userId);
  const hasAccess = isAccessActive(access.currentAccessExpiry);
  return { hasAccess, access };
}
