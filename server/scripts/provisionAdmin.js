import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moi-kanakku';

/**
 * Script to safely provision or promote an administrator.
 * Usage:
 *   node scripts/provisionAdmin.js <email> <password> [name] [phone]
 */
export async function provisionAdmin(email, password, name = 'Admin User', phone = '') {
  if (!email || !password) {
    throw new Error('Email and password are required to provision an admin user');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  const cleanEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: cleanEmail });

  if (user) {
    console.log(`[ProvisionAdmin] User with email ${cleanEmail} exists. Updating role to admin and resetting password...`);
    user.role = 'admin';
    user.password = password; // Pre-save hook will hash
    if (phone) user.phone = phone;
    await user.save();
    console.log(`[ProvisionAdmin] Successfully promoted existing user ${user.email} (ID: ${user._id}) to admin.`);
  } else {
    console.log(`[ProvisionAdmin] Creating new admin account for ${cleanEmail}...`);
    user = new User({
      name,
      email: cleanEmail,
      password,
      phone,
      role: 'admin',
    });
    await user.save();
    console.log(`[ProvisionAdmin] Created new admin user ${user.email} (ID: ${user._id}).`);
  }

  return user;
}

if (process.argv[1] && process.argv[1].endsWith('provisionAdmin.js')) {
  const [, , email, password, name, phone] = process.argv;
  if (!email || !password) {
    console.error('Usage: node scripts/provisionAdmin.js <email> <password> [name] [phone]');
    process.exit(1);
  }

  provisionAdmin(email, password, name, phone)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ProvisionAdmin] Failed:', err);
      process.exit(1);
    });
}
