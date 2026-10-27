import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import Purchase from '../../models/Purchase.js';
import PaymentAttempt from '../../models/PaymentAttempt.js';
import MaintenanceGrant from '../../models/MaintenanceGrant.js';
import BookletActivation from '../../models/BookletActivation.js';
import AccountAccess from '../../models/AccountAccess.js';
import WebhookInbox from '../../models/WebhookInbox.js';
import { fulfillPurchasePayment } from '../../services/fulfillmentService.js';
import { handleWebhook } from '../../controllers/billingController.js';
import crypto from 'crypto';

dotenv.config();

describe('Integration Tests: Payment Security, Reliability, and Idempotency', () => {
  let testUser;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: 'moi-test-suite',
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      });
    }
    await User.deleteMany({ email: /@test-uravuu-rel/ });
    await Purchase.deleteMany({ purchaseReference: /URV-REL-/ });
    await MaintenanceGrant.deleteMany({});
    await BookletActivation.deleteMany({});
    await PaymentAttempt.deleteMany({});
    await WebhookInbox.deleteMany({});

    testUser = await User.create({
      name: 'Reliability Test User',
      email: 'user@test-uravuu-rel.com',
      password: 'Password123!',
      createdAt: new Date('2026-10-26T00:00:00Z'),
    });

    await AccountAccess.create({
      user: testUser._id,
      initialFreePeriodStart: new Date('2026-10-26T00:00:00Z'),
      initialFreePeriodExpiry: new Date('2027-04-26T00:00:00Z'),
      currentAccessExpiry: new Date('2027-04-26T00:00:00Z'),
      status: 'free_trial',
    });
  });

  after(async () => {
    await User.deleteMany({ email: /@test-uravuu-rel/ });
    await Purchase.deleteMany({ purchaseReference: /URV-REL-/ });
    await MaintenanceGrant.deleteMany({});
    await BookletActivation.deleteMany({});
    await PaymentAttempt.deleteMany({});
    await WebhookInbox.deleteMany({});
    await mongoose.disconnect();
  });

  it('15: Rejects fulfillment when amount, currency, or order does not match', async () => {
    const purchase = await Purchase.create({
      purchaseReference: `URV-REL-AMT-${Date.now()}`,
      application: 'uravuu',
      user: testUser._id,
      purpose: 'account_maintenance',
      amount: 10000, // 10000 paise expected
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'pending',
      razorpayOrderId: `order_rel_1_${Date.now()}`,
    });

    // Wrong amount: 5000 paise
    await assert.rejects(
      async () => {
        await fulfillPurchasePayment({
          purchaseId: purchase._id,
          paymentId: `pay_wrong_amt_${Date.now()}`,
          providerPayment: {
            id: `pay_wrong_amt_${Date.now()}`,
            order_id: purchase.razorpayOrderId,
            status: 'captured',
            amount: 5000,
            currency: 'INR',
          },
        });
      },
      /Amount mismatch/
    );

    // Wrong currency: USD
    await assert.rejects(
      async () => {
        await fulfillPurchasePayment({
          purchaseId: purchase._id,
          paymentId: `pay_wrong_cur_${Date.now()}`,
          providerPayment: {
            id: `pay_wrong_cur_${Date.now()}`,
            order_id: purchase.razorpayOrderId,
            status: 'captured',
            amount: 10000,
            currency: 'USD',
          },
        });
      },
      /Invalid payment currency/
    );

    // Wrong order ID
    await assert.rejects(
      async () => {
        await fulfillPurchasePayment({
          purchaseId: purchase._id,
          paymentId: `pay_wrong_ord_${Date.now()}`,
          providerPayment: {
            id: `pay_wrong_ord_${Date.now()}`,
            order_id: 'order_completely_different',
            status: 'captured',
            amount: 10000,
            currency: 'INR',
          },
        });
      },
      /Order mismatch/
    );
  });

  it('16: Authorized-only and failed payments do not fulfill or grant access', async () => {
    const purchase = await Purchase.create({
      purchaseReference: `URV-REL-AUTH-${Date.now()}`,
      application: 'uravuu',
      user: testUser._id,
      purpose: 'account_maintenance',
      amount: 10000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'pending',
      razorpayOrderId: `order_rel_auth_${Date.now()}`,
    });

    const authResult = await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: `pay_auth_${Date.now()}`,
      providerPayment: {
        id: `pay_auth_${Date.now()}`,
        order_id: purchase.razorpayOrderId,
        status: 'authorized', // Not captured
        amount: 10000,
        currency: 'INR',
      },
    });

    assert.equal(authResult.success, false);
    assert.match(authResult.message, /not captured/i);

    const checkPurchase = await Purchase.findById(purchase._id);
    assert.equal(checkPurchase.status, 'pending'); // Still pending
  });

  it('18, 19 & 20: Duplicate callbacks, webhooks, and races fulfill exactly once', async () => {
    const purchase = await Purchase.create({
      purchaseReference: `URV-REL-IDEM-${Date.now()}`,
      application: 'uravuu',
      user: testUser._id,
      purpose: 'account_maintenance',
      amount: 10000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'pending',
      razorpayOrderId: `order_rel_idem_${Date.now()}`,
    });

    const paymentId = `pay_rel_idem_${Date.now()}`;
    const paymentData = {
      id: paymentId,
      order_id: purchase.razorpayOrderId,
      status: 'captured',
      amount: 10000,
      currency: 'INR',
      created_at: Math.floor(Date.now() / 1000),
    };

    // Simulate 3 concurrent executions (e.g. checkout verify + webhook + reconciliation job)
    const [res1, res2, res3] = await Promise.all([
      fulfillPurchasePayment({ purchaseId: purchase._id, paymentId, providerPayment: paymentData, trigger: 'checkout' }),
      fulfillPurchasePayment({ purchaseId: purchase._id, paymentId, providerPayment: paymentData, trigger: 'webhook' }),
      fulfillPurchasePayment({ purchaseId: purchase._id, paymentId, providerPayment: paymentData, trigger: 'reconciliation' }),
    ]);

    // All return success
    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(res3.success, true);

    // Exactly one fulfilled initially, other two recognized alreadyFulfilled
    const initialFulfillments = [res1, res2, res3].filter((r) => r.alreadyFulfilled === false);
    assert.equal(initialFulfillments.length, 1);

    // Exactly one MaintenanceGrant created in DB
    const grants = await MaintenanceGrant.find({ purchase: purchase._id });
    assert.equal(grants.length, 1);
  });

  it('21: Out-of-order events do not regress captured payments', async () => {
    const purchase = await Purchase.create({
      purchaseReference: `URV-REL-REG-${Date.now()}`,
      application: 'uravuu',
      user: testUser._id,
      purpose: 'account_maintenance',
      amount: 10000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'captured',
      fulfilledAt: new Date(),
      razorpayOrderId: `order_rel_reg_${Date.now()}`,
      razorpayPaymentId: `pay_rel_reg_${Date.now()}`,
    });

    const attempt = await PaymentAttempt.create({
      purchase: purchase._id,
      razorpayPaymentId: purchase.razorpayPaymentId,
      razorpayOrderId: purchase.razorpayOrderId,
      status: 'captured',
      amount: 10000,
      currency: 'INR',
    });

    // Simulate delayed arrival of a failed payment attempt event for this order
    const delayedFailedData = {
      id: `pay_failed_earlier_${Date.now()}`,
      order_id: purchase.razorpayOrderId,
      status: 'failed',
      amount: 10000,
      currency: 'INR',
      error_description: 'Card declined',
    };

    const failResult = await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: delayedFailedData.id,
      providerPayment: delayedFailedData,
      trigger: 'delayed_webhook_failure',
    });

    // The purchase status MUST remain 'captured'
    const finalPurchase = await Purchase.findById(purchase._id);
    assert.equal(finalPurchase.status, 'captured');
  });

  it('28: Unexpected duplicate captures with different payment IDs are flagged for admin review', async () => {
    const purchase = await Purchase.create({
      purchaseReference: `URV-REL-DUP-${Date.now()}`,
      application: 'uravuu',
      user: testUser._id,
      purpose: 'account_maintenance',
      amount: 10000,
      currency: 'INR',
      pricingSnapshot: { totalAmountPaise: 10000 },
      status: 'pending',
      razorpayOrderId: `order_rel_dup_${Date.now()}`,
    });

    // 1st captured payment
    const pay1 = `pay_dup_1_${Date.now()}`;
    await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: pay1,
      providerPayment: {
        id: pay1,
        order_id: purchase.razorpayOrderId,
        status: 'captured',
        amount: 10000,
        currency: 'INR',
      },
    });

    // 2nd captured payment with different payment ID (e.g. customer paid twice or provider anomaly)
    const pay2 = `pay_dup_2_${Date.now()}`;
    await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: pay2,
      providerPayment: {
        id: pay2,
        order_id: purchase.razorpayOrderId,
        status: 'captured',
        amount: 10000,
        currency: 'INR',
      },
    });

    const flaggedPurchase = await Purchase.findById(purchase._id);
    assert.equal(flaggedPurchase.isDuplicateCaptureFlagged, true);
    assert.match(flaggedPurchase.reconciliationNotes, /Duplicate capture detected/);
  });

  it('30: Webhook safely ignores events from another application on shared Razorpay account', async () => {
    const secret = 'test_webhook_secret_shared';
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;

    // External app payload (e.g. from an e-commerce app sharing this Razorpay account)
    const externalPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_foreign_${Date.now()}`,
            order_id: `order_foreign_${Date.now()}`,
            amount: 50000,
            currency: 'INR',
            status: 'captured',
            notes: {
              application: 'other_ecommerce_app',
            },
          },
        },
      },
    };

    const rawBody = JSON.stringify(externalPayload);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    let responseCode = null;
    let responseBody = null;

    const req = {
      headers: {
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_foreign_${Date.now()}`,
      },
      body: externalPayload,
      rawBody,
    };

    const res = {
      status(code) {
        responseCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await handleWebhook(req, res);

    assert.equal(responseCode, 200);
    assert.equal(responseBody.status, 'ignored_foreign_app');

    // Stored in inbox with processingState = 'ignored'
    const inboxRecord = await WebhookInbox.findOne({ eventId: req.headers['x-razorpay-event-id'] });
    assert.equal(inboxRecord.processingState, 'ignored');
    assert.equal(inboxRecord.application, 'other_ecommerce_app');
  });
});
