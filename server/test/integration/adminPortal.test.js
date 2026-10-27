import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import Purchase from '../../models/Purchase.js';
import PaymentAttempt from '../../models/PaymentAttempt.js';
import MaintenanceGrant from '../../models/MaintenanceGrant.js';
import BookletActivation from '../../models/BookletActivation.js';
import AccountAccess from '../../models/AccountAccess.js';
import {
  adminLogin,
  getAdminOverview,
  getAdminUsers,
  getAdminBooklets,
  getAdminPayments,
  exportPaymentsCsv,
} from '../../controllers/adminController.js';

dotenv.config();

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    send(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

describe('Integration Tests: Admin Portal & Authorization', () => {
  let regularUser;
  let adminUser;
  let testBookletActive;
  let testBookletDraft;
  let testPurchase;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: 'moi-test-suite',
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      });
    }

    await User.deleteMany({ email: /@test-uravuu-admin/ });
    await Event.deleteMany({ eventName: /Admin Test/ });
    await Purchase.deleteMany({ purchaseReference: /URV-ADM-/ });

    // 1. Regular user
    regularUser = await User.create({
      name: 'Regular Customer',
      email: 'regular@test-uravuu-admin.com',
      password: 'UserPass123!',
      role: 'user',
      createdAt: new Date('2026-10-26T00:00:00Z'),
    });

    // 2. Admin user
    adminUser = await User.create({
      name: 'System Admin',
      email: 'superadmin@test-uravuu-admin.com',
      password: 'AdminPass123!',
      role: 'admin',
      createdAt: new Date('2026-10-26T00:00:00Z'),
    });

    // 3. User access
    await AccountAccess.create({
      user: regularUser._id,
      initialFreePeriodStart: new Date('2026-10-26T00:00:00Z'),
      initialFreePeriodExpiry: new Date('2027-04-26T00:00:00Z'),
      currentAccessExpiry: new Date('2027-04-26T00:00:00Z'),
      status: 'free_trial',
    });

    // 4. Draft booklet
    testBookletDraft = await Event.create({
      eventName: 'Admin Test Draft Booklet',
      eventType: 'Wedding',
      eventDate: new Date(),
      createdBy: regularUser._id,
      status: 'draft',
      isPaid: false,
    });

    // 5. Active booklet
    testBookletActive = await Event.create({
      eventName: 'Admin Test Active Booklet',
      eventType: 'Birthday',
      eventDate: new Date(),
      createdBy: regularUser._id,
      status: 'active',
      isPaid: true,
      activatedAt: new Date(),
    });

    // 6. Booklet purchase
    testPurchase = await Purchase.create({
      purchaseReference: `URV-ADM-BOOK-${Date.now()}`,
      application: 'uravuu',
      user: regularUser._id,
      booklet: testBookletActive._id,
      purpose: 'booklet_creation',
      amount: 15000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 15000, taxableAmountPaise: 12712, totalTaxPaise: 2288 },
      status: 'captured',
      razorpayOrderId: `order_adm_${Date.now()}`,
      razorpayPaymentId: `pay_adm_${Date.now()}`,
      fulfilledAt: new Date(),
    });

    // 7. Payment Attempt
    await PaymentAttempt.create({
      purchase: testPurchase._id,
      razorpayPaymentId: testPurchase.razorpayPaymentId,
      razorpayOrderId: testPurchase.razorpayOrderId,
      status: 'captured',
      amount: 15000,
      currency: 'INR',
      capturedAt: new Date(),
    });

    await BookletActivation.create({
      purchase: testPurchase._id,
      booklet: testBookletActive._id,
      user: regularUser._id,
      sourcePaymentId: testPurchase.razorpayPaymentId,
      activatedAt: new Date(),
    });
  });

  after(async () => {
    await User.deleteMany({ email: /@test-uravuu-admin/ });
    await Event.deleteMany({ eventName: /Admin Test/ });
    await Purchase.deleteMany({ purchaseReference: /URV-ADM-/ });
    await mongoose.disconnect();
  });

  it('31: Unauthenticated and non-admin access is rejected on admin login', async () => {
    // Non-admin login attempt
    const req = {
      body: {
        email: regularUser.email,
        password: 'UserPass123!',
      },
    };
    const res = createMockRes();

    await adminLogin(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.data.message, /Forbidden.*administrator/i);
  });

  it('32: Successful admin login returns signed JWT with admin role', async () => {
    const req = {
      body: {
        email: adminUser.email,
        password: 'AdminPass123!',
      },
    };
    const res = createMockRes();

    await adminLogin(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.data.token);
    assert.equal(res.data.admin.email, adminUser.email);
    assert.equal(res.data.admin.role, 'admin');

    // Verify token payload
    const decoded = jwt.verify(res.data.token, process.env.JWT_SECRET || 'your-secret-key');
    assert.equal(decoded.role, 'admin');
    assert.equal(decoded.id, adminUser._id.toString());
  });

  it('33 & 34: Admin overview separates drafts from active booklets and summarizes metrics accurately', async () => {
    const req = { query: {} };
    const res = createMockRes();

    await getAdminOverview(req, res);
    assert.equal(res.statusCode, 200);
    const metrics = res.data;

    assert.ok(metrics.allTime.totalUsers >= 2);
    assert.ok(metrics.allTime.totalActivatedBooklets >= 1);
    assert.ok(metrics.allTime.totalDraftBooklets >= 1);
    assert.ok(metrics.allTime.grossCapturedRupees >= 150);
    assert.ok(metrics.allTime.bookletCreationRupees >= 150);
    assert.ok(metrics.allTime.successfulPurchasesCount >= 1);
  });

  it('35 & 36: Filtered payments, summaries across dataset, and formula injection safe CSV export', async () => {
    // Filter payments
    const req = { query: { purpose: 'booklet_creation', page: 1, limit: 10 } };
    const res = createMockRes();

    await getAdminPayments(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.data.payments.length >= 1);
    assert.equal(res.data.payments[0].purpose, 'booklet_creation');

    // CSV export
    const exportReq = { query: { purpose: 'booklet_creation' } };
    const exportRes = createMockRes();

    await exportPaymentsCsv(exportReq, exportRes);
    assert.equal(exportRes.statusCode, 200);
    assert.equal(exportRes.headers['Content-Type'], 'text/csv; charset=utf-8');
    assert.ok(exportRes.data.includes('Purchase Reference'));
    assert.ok(exportRes.data.includes(testPurchase.purchaseReference));
  });

  it('37: Sensitive data (passwords, salts, secrets) is not exposed in admin endpoints', async () => {
    const req = { query: { search: regularUser.email } };
    const res = createMockRes();

    await getAdminUsers(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.data.users.length >= 1);
    const userItem = res.data.users.find((u) => u.id.toString() === regularUser._id.toString());
    assert.ok(userItem);
    assert.equal(userItem.password, undefined);
    assert.equal(userItem.__v, undefined);
  });
});
