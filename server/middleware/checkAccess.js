import { checkUserAccess } from '../services/accountAccessService.js';
import User from '../models/User.js';

/**
 * Middleware to enforce active account access.
 * If expired, returns 403 Forbidden with renewal instructions.
 */
export async function requireActiveAccountAccess(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { hasAccess, access } = await checkUserAccess(userId);

    if (!hasAccess) {
      return res.status(403).json({
        code: 'ACCOUNT_ACCESS_EXPIRED',
        error: 'ACCOUNT_ACCESS_EXPIRED',
        message: 'Your application access has expired. Renew for ₹100 to access all your booklets for six months.',
        accessExpiry: access.currentAccessExpiry,
        status: access.status,
        requiresMaintenance: true,
      });
    }

    req.accountAccess = access;
    next();
  } catch (error) {
    console.error('[requireActiveAccountAccess] Error:', error);
    res.status(500).json({ message: 'Error checking account access status' });
  }
}

/**
 * Middleware to enforce administrator authorization.
 * Never accepts client-provided roles. Always checks authoritative database state.
 */
export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin' || user.deleted) {
      return res.status(403).json({ message: 'Forbidden: Admin authorization required' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('[requireAdmin] Error:', error);
    res.status(500).json({ message: 'Error verifying admin authorization' });
  }
}
