import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import AccountAccess from '../../models/AccountAccess.js';
import Purchase from '../../models/Purchase.js';
import { getOrCreateAccountAccess } from '../../services/accountAccessService.js';
import { fulfillPurchasePayment } from '../../services/fulfillmentService.js';
import { addCalendarMonths, isAccessActive } from '../../utils/dateUtils.js';

dotenv.config();

describe('Integration Tests: Account Access, Expiry, and Business Rules', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: 'moi-test-suite' });
    }
    // Clean up test collections
    await User.deleteMany({ email: /@test-uravuu-biz/ });
    await AccountAccess.deleteMany({});
    await Purchase.deleteMany({ application: 'uravuu_test' });
    await Event.deleteMany({ eventName: /Test Booklet/ });
  });

  after(async () => {
    await User.deleteMany({ email: /@test-uravuu-biz/ });
    await AccountAccess.deleteMany({});
    await Purchase.deleteMany({ application: 'uravuu_test' });
    await Event.deleteMany({ eventName: /Test Booklet/ });
    await mongoose.disconnect();
  });

  it('1, 2 & 3: Free access starts at registration, lasts 6 calendar months, even without booklets', async () => {
    const user = await User.create({
      name: 'Test Business User 1',
      email: 'user1@test-uravuu-biz.com',
      password: 'Password123!',
      createdAt: new Date('2026-10-26T10:00:00.000Z'),
    });

    // Initialize access without any booklets created
    const access = await getOrCreateAccountAccess(user._id);

    assert.equal(access.initialFreePeriodStart.toISOString(), user.createdAt.toISOString());
    // 6 calendar months from Oct 26, 2026 -> Apr 26, 2027
    assert.equal(access.initialFreePeriodExpiry.toISOString(), '2027-04-26T10:00:00.000Z');
    assert.equal(access.currentAccessExpiry.toISOString(), '2027-04-26T10:00:00.000Z');
    assert.equal(access.status, 'free_trial');
  });

  it('6 & 7: Maintenance covers the whole account with multiple booklets', async () => {
    const user = await User.create({
      name: 'Multi Booklet Owner',
      email: 'user2@test-uravuu-biz.com',
      password: 'Password123!',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    // Create 3 booklets for this user
    const b1 = await Event.create({ eventName: 'Test Booklet A', eventType: 'Wedding', eventDate: new Date(), createdBy: user._id, status: 'active' });
    const b2 = await Event.create({ eventName: 'Test Booklet B', eventType: 'Birthday', eventDate: new Date(), createdBy: user._id, status: 'active' });
    const b3 = await Event.create({ eventName: 'Test Booklet C', eventType: 'Housewarming', eventDate: new Date(), createdBy: user._id, status: 'active' });

    const access = await getOrCreateAccountAccess(user._id);
    // User was created Jan 1, 2026 -> free period expired Jul 1, 2026
    assert.equal(access.status, 'expired');

    // Fulfill one ₹100 maintenance purchase
    const purchase = await Purchase.create({
      purchaseReference: `URV-TEST-MAINT-${Date.now()}`,
      application: 'uravuu',
      user: user._id,
      purpose: 'account_maintenance',
      amount: 10000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'pending',
      razorpayOrderId: `order_maint_${Date.now()}`,
    });

    const captureTime = new Date('2026-10-26T12:00:00.000Z');
    const result = await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: `pay_maint_${Date.now()}`,
      providerPayment: {
        id: `pay_maint_${Date.now()}`,
        order_id: purchase.razorpayOrderId,
        status: 'captured',
        amount: 10000,
        currency: 'INR',
        created_at: Math.floor(captureTime.getTime() / 1000),
      },
    });

    assert.equal(result.success, true);

    // Refresh access
    const updatedAccess = await AccountAccess.findOne({ user: user._id });
    assert.equal(updatedAccess.status, 'active_paid');
    // Renewed from captureTime Oct 26, 2026 + 6 calendar months -> Apr 26, 2027
    assert.equal(updatedAccess.currentAccessExpiry.toISOString(), '2027-04-26T12:00:00.000Z');

    // All 3 booklets remain accessible under the single account maintenance
    const userBooklets = await Event.find({ createdBy: user._id });
    assert.equal(userBooklets.length, 3);
  });

  it('8: Booklet creation purchase does not extend account access', async () => {
    const user = await User.create({
      name: 'Booklet Access Test',
      email: 'user3@test-uravuu-biz.com',
      password: 'Password123!',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    const accessBefore = await getOrCreateAccountAccess(user._id);
    const expiryBefore = accessBefore.currentAccessExpiry.toISOString();

    // User buys a booklet
    const draftBooklet = await Event.create({
      eventName: 'Test Booklet Paid',
      eventType: 'Wedding',
      eventDate: new Date(),
      createdBy: user._id,
      status: 'draft',
      isPaid: false,
    });

    const purchase = await Purchase.create({
      purchaseReference: `URV-TEST-BKL-${Date.now()}`,
      application: 'uravuu',
      user: user._id,
      booklet: draftBooklet._id,
      purpose: 'booklet_creation',
      amount: 15000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 15000 },
      status: 'pending',
      razorpayOrderId: `order_bkl_${Date.now()}`,
    });

    await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: `pay_bkl_${Date.now()}`,
      providerPayment: {
        id: `pay_bkl_${Date.now()}`,
        order_id: purchase.razorpayOrderId,
        status: 'captured',
        amount: 15000,
        currency: 'INR',
        created_at: Math.floor(Date.now() / 1000),
      },
    });

    const accessAfter = await AccountAccess.findOne({ user: user._id });
    // Expiry MUST NOT change
    assert.equal(accessAfter.currentAccessExpiry.toISOString(), expiryBefore);

    // Booklet is activated
    const activatedBooklet = await Event.findById(draftBooklet._id);
    assert.equal(activatedBooklet.status, 'active');
    assert.equal(activatedBooklet.isPaid, true);
  });

  it('12: Expired data is preserved and access is restored after renewal', async () => {
    const user = await User.create({
      name: 'Expired Data User',
      email: 'user4@test-uravuu-biz.com',
      password: 'Password123!',
      createdAt: new Date('2025-01-01T00:00:00.000Z'), // Created long ago
    });

    const booklet = await Event.create({
      eventName: 'Test Booklet Preserved',
      eventType: 'Wedding',
      eventDate: new Date('2025-02-01'),
      createdBy: user._id,
      status: 'active',
      isPaid: true,
      totalCollection: 50000,
    });

    const access = await getOrCreateAccountAccess(user._id);
    assert.equal(access.status, 'expired');
    assert.equal(isAccessActive(access.currentAccessExpiry), false);

    // Verify booklet data is intact
    const foundBooklet = await Event.findById(booklet._id);
    assert.equal(foundBooklet.totalCollection, 50000);

    // User renews maintenance
    const purchase = await Purchase.create({
      purchaseReference: `URV-TEST-RENEW-${Date.now()}`,
      application: 'uravuu',
      user: user._id,
      purpose: 'account_maintenance',
      amount: 10000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'pending',
      razorpayOrderId: `order_renew_${Date.now()}`,
    });

    await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: `pay_renew_${Date.now()}`,
      providerPayment: {
        id: `pay_renew_${Date.now()}`,
        order_id: purchase.razorpayOrderId,
        status: 'captured',
        amount: 10000,
        currency: 'INR',
      },
    });

    const renewedAccess = await AccountAccess.findOne({ user: user._id });
    assert.equal(renewedAccess.status, 'active_paid');
    assert.equal(isAccessActive(renewedAccess.currentAccessExpiry), true);
  });

  it('29: Booklet payment finishing after account expiry is preserved and activated', async () => {
    const user = await User.create({
      name: 'Expiring During Checkout User',
      email: 'user5@test-uravuu-biz.com',
      password: 'Password123!',
      createdAt: new Date('2025-01-01T00:00:00.000Z'), // Expired
    });

    const access = await getOrCreateAccountAccess(user._id);
    assert.equal(access.status, 'expired');

    // Booklet draft created and payment captured
    const draftBooklet = await Event.create({
      eventName: 'Test Booklet Late Capture',
      eventType: 'Custom',
      eventDate: new Date(),
      createdBy: user._id,
      status: 'draft',
      isPaid: false,
    });

    const purchase = await Purchase.create({
      purchaseReference: `URV-TEST-LATE-${Date.now()}`,
      application: 'uravuu',
      user: user._id,
      booklet: draftBooklet._id,
      purpose: 'booklet_creation',
      amount: 15000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 15000 },
      status: 'pending',
      razorpayOrderId: `order_late_${Date.now()}`,
    });

    const result = await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: `pay_late_${Date.now()}`,
      providerPayment: {
        id: `pay_late_${Date.now()}`,
        order_id: purchase.razorpayOrderId,
        status: 'captured',
        amount: 15000,
        currency: 'INR',
      },
    });

    assert.equal(result.success, true);

    // Booklet is activated even though account access is expired
    const activatedBooklet = await Event.findById(draftBooklet._id);
    assert.equal(activatedBooklet.status, 'active');
    assert.equal(activatedBooklet.isPaid, true);

    // Account access remains expired until maintenance renewal
    const finalAccess = await AccountAccess.findOne({ user: user._id });
    assert.equal(finalAccess.status, 'expired');
  });
});
