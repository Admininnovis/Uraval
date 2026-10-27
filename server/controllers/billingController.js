import crypto from 'crypto';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import PaymentAttempt from '../models/PaymentAttempt.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import WebhookInbox from '../models/WebhookInbox.js';
import { getOrCreateAccountAccess, checkUserAccess } from '../services/accountAccessService.js';
import { PRICING_CONFIG, getPricingSnapshot } from '../config/pricing.js';
import {
  createRazorpayOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  fetchRazorpayPayment,
  getRazorpayClient,
} from '../services/razorpayService.js';
import { fulfillPurchasePayment } from '../services/fulfillmentService.js';
import { assignInvoiceToPurchase, buildInvoiceObject } from '../services/invoiceService.js';

/**
 * Generates an internal purchase reference.
 * Format: URV-PUR-<timestamp>-<randomHex>
 */
function generatePurchaseReference() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `URV-PUR-${ts}-${rand}`;
}

/**
 * GET /api/billing/access-status
 * Returns current account access and pricing information. Usable even when expired.
 */
export async function getAccessStatus(req, res) {
  try {
    const userId = req.user.id;
    const access = await getOrCreateAccountAccess(userId);
    const user = await User.findById(userId).select('name email phone');

    const now = new Date();
    const expiry = new Date(access.currentAccessExpiry);
    const msDiff = expiry.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    const isAccessActive = msDiff > 0;

    res.json({
      access: {
        status: access.status,
        isActive: isAccessActive,
        isAccessActive,
        isExpiringSoon: daysRemaining <= 14 && isAccessActive,
        currentAccessExpiry: access.currentAccessExpiry,
        initialFreePeriodStart: access.initialFreePeriodStart,
        initialFreePeriodExpiry: access.initialFreePeriodExpiry,
        paidMaintenanceExpiry: access.paidMaintenanceExpiry,
        daysRemaining,
      },
      user,
      pricing: {
        bookletCreation: PRICING_CONFIG.BOOKLET_CREATION,
        accountMaintenance: PRICING_CONFIG.ACCOUNT_MAINTENANCE,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id',
    });
  } catch (error) {
    console.error('[getAccessStatus] Error:', error);
    res.status(500).json({ message: 'Error retrieving account access status' });
  }
}

/**
 * POST /api/billing/maintenance-purchase
 * Creates or resumes an internal maintenance purchase and Razorpay order for ₹100.
 * Usable when expired.
 */
export async function createMaintenancePurchase(req, res) {
  try {
    const userId = req.user.id;
    const pricingSnapshot = getPricingSnapshot(PRICING_CONFIG.ACCOUNT_MAINTENANCE.PURPOSE);

    // Only one unresolved maintenance purchase per account at a time.
    // Check if an unresolved purchase from the last 30 minutes exists and reuse it.
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let purchase = await Purchase.findOne({
      user: userId,
      purpose: 'account_maintenance',
      status: { $in: ['created', 'pending'] },
      createdAt: { $gte: thirtyMinutesAgo },
    });

    let order;
    if (purchase && purchase.razorpayOrderId) {
      try {
        order = await getRazorpayClient().orders.fetch(purchase.razorpayOrderId);
      } catch {
        order = null; // Recreate if fetch fails
      }
    }

    if (!purchase || !order) {
      const purchaseReference = generatePurchaseReference();
      purchase = new Purchase({
        purchaseReference,
        application: 'uravuu',
        user: userId,
        purpose: 'account_maintenance',
        amount: pricingSnapshot.totalAmountPaise, // 10000
        currency: pricingSnapshot.currency, // 'INR'
        pricingSnapshot,
        status: 'created',
      });

      order = await createRazorpayOrder({
        amount: purchase.amount,
        currency: purchase.currency,
        receipt: purchase.purchaseReference.substring(0, 40),
        notes: {
          application: 'uravuu',
          internal_purchase_reference: purchase.purchaseReference,
          user_id: userId.toString(),
          payment_purpose: 'account_maintenance',
        },
      });

      purchase.razorpayOrderId = order.id;
      purchase.status = 'pending';
      await purchase.save();
    }

    res.json({
      purchaseId: purchase._id,
      purchaseReference: purchase.purchaseReference,
      amount: purchase.amount,
      currency: purchase.currency,
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id',
      pricingSnapshot: purchase.pricingSnapshot,
    });
  } catch (error) {
    console.error('[createMaintenancePurchase] Error:', error);
    res.status(500).json({ message: 'Failed to initiate maintenance renewal purchase' });
  }
}

/**
 * POST /api/billing/booklet-purchase
 * Validates booklet details, creates draft Event, creates purchase and Razorpay order for ₹150.
 * Requires active account access.
 */
export async function createBookletPurchase(req, res) {
  try {
    const userId = req.user.id;
    const { eventName, eventType, eventDate, location, description } = req.body;

    if (!eventName || !eventType || !eventDate) {
      return res.status(400).json({ message: 'Event name, event type, and date are required' });
    }

    // Must have active account access to initiate a new booklet purchase
    const { hasAccess } = await checkUserAccess(userId);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'ACCOUNT_ACCESS_EXPIRED',
        message: 'Your application access has expired. Renew maintenance before creating new booklets.',
        requiresMaintenance: true,
      });
    }

    const pricingSnapshot = getPricingSnapshot(PRICING_CONFIG.BOOKLET_CREATION.PURPOSE);

    const purchaseReference = generatePurchaseReference();
    const purchase = new Purchase({
      purchaseReference,
      application: 'uravuu',
      user: userId,
      booklet: null, // Booklet is ONLY created after verified payment capture!
      bookletPayload: {
        eventName: eventName.trim(),
        eventType,
        eventDate: new Date(eventDate),
        location: location ? location.trim() : '',
        description: description ? description.trim() : '',
      },
      purpose: 'booklet_creation',
      amount: pricingSnapshot.totalAmountPaise, // 15000
      currency: pricingSnapshot.currency, // 'INR'
      pricingSnapshot,
      status: 'created',
    });

    const order = await createRazorpayOrder({
      amount: purchase.amount,
      currency: purchase.currency,
      receipt: purchase.purchaseReference.substring(0, 40),
      notes: {
        application: 'uravuu',
        internal_purchase_reference: purchase.purchaseReference,
        user_id: userId.toString(),
        payment_purpose: 'booklet_creation',
        event_name: eventName.trim().substring(0, 40),
      },
    });

    purchase.razorpayOrderId = order.id;
    purchase.status = 'pending';
    await purchase.save();

    res.json({
      purchaseId: purchase._id,
      purchaseReference: purchase.purchaseReference,
      amount: purchase.amount,
      currency: purchase.currency,
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id',
      pricingSnapshot: purchase.pricingSnapshot,
    });
  } catch (error) {
    console.error('[createBookletPurchase] Error:', error);
    res.status(500).json({ message: 'Failed to initiate booklet purchase' });
  }
}

/**
 * POST /api/billing/verify-payment
 * Verifies Razorpay checkout response signature and triggers idempotent fulfillment.
 */
export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required Razorpay payment verification fields' });
    }

    // 1. Verify checkout signature
    const isValidSignature = verifyCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      return res.status(400).json({ message: 'Invalid payment signature verification failed' });
    }

    // 2. Resolve purchase and verify ownership
    let purchase = null;
    if (purchaseId) {
      purchase = await Purchase.findById(purchaseId);
    }
    if (!purchase) {
      purchase = await Purchase.findOne({ razorpayOrderId: razorpay_order_id });
    }

    if (!purchase) {
      return res.status(404).json({ message: 'Matching purchase order not found' });
    }

    if (purchase.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized purchase verification' });
    }

    // 3. Trigger authoritative fulfillment
    const fulfillmentResult = await fulfillPurchasePayment({
      purchaseId: purchase._id,
      paymentId: razorpay_payment_id,
      trigger: 'checkout_verify',
    });

    const access = await getOrCreateAccountAccess(req.user.id);

    res.json({
      success: true,
      fulfillmentResult,
      bookletId: fulfillmentResult.bookletId || fulfillmentResult.purchase?.booklet,
      access: {
        status: access.status,
        currentAccessExpiry: access.currentAccessExpiry,
      },
      message: 'Payment verified and fulfilled successfully',
    });
  } catch (error) {
    console.error('[verifyPayment] Error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
}

/**
 * POST /api/billing/recover/:purchaseId
 * Allows client to poll or recover state after returning from UPI or interrupted checkout.
 */
export async function recoverPurchaseStatus(req, res) {
  try {
    const { purchaseId } = req.params;
    const isObjectId = mongoose.isValidObjectId(purchaseId);
    const purchase = isObjectId
      ? await Purchase.findById(purchaseId)
      : await Purchase.findOne({ purchaseReference: purchaseId });

    if (!purchase || purchase.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    if (purchase.status === 'captured') {
      return res.json({ status: 'captured', bookletId: purchase.booklet, purchase });
    }

    if (purchase.status === 'failed') {
      return res.json({ status: 'failed', purchase, message: purchase.failureReason || 'Payment failed' });
    }

    let paymentError = null;

    if (purchase.razorpayOrderId) {
      try {
        const client = getRazorpayClient();
        const payments = await client.orders.fetchPayments(purchase.razorpayOrderId);
        const items = payments?.items || [];
        const captured = items.find((p) => p.status === 'captured');

        if (captured) {
          await fulfillPurchasePayment({
            purchaseId: purchase._id,
            paymentId: captured.id,
            providerPayment: captured,
            trigger: 'user_recovery_poll',
          });
          const fresh = await Purchase.findById(purchase._id);
          return res.json({ status: 'captured', bookletId: fresh?.booklet, purchase: fresh });
        }
      } catch (err) {
        console.warn(`[recoverPurchaseStatus] Razorpay check error for order ${purchase.razorpayOrderId}:`, err.message);
        paymentError = err;
      }
    }

    // Payment was not captured on Razorpay (checkout abandoned, failed, or cancelled)
    purchase.status = 'failed';
    purchase.failedAt = new Date();
    purchase.failureReason = paymentError
      ? `Payment verification could not find completed transaction: ${paymentError.message}`
      : 'Payment not completed or cancelled by user';
    await purchase.save();

    res.json({
      status: 'failed',
      message: 'Payment was not completed. Marked as failed.',
      purchase,
    });
  } catch (error) {
    console.error('[recoverPurchaseStatus] Error:', error);
    res.status(500).json({ message: 'Failed to recover payment status' });
  }
}

/**
 * GET /api/billing/purchases
 * Returns own payment history.
 */
export async function getUserPurchases(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const total = await Purchase.countDocuments({ user: userId });
    const purchases = await Purchase.find({ user: userId })
      .populate('booklet', 'eventName eventType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[getUserPurchases] Error:', error);
    res.status(500).json({ message: 'Failed to load purchase history' });
  }
}

/**
 * GET /api/billing/receipt/:id
 * Generates receipt data for a captured purchase.
 */
export async function getReceipt(req, res) {
  try {
    const idOrRef = req.params.id;
    const isObjectId = mongoose.isValidObjectId(idOrRef);
    const purchase = isObjectId
      ? await Purchase.findById(idOrRef)
          .populate('user', 'name email phone')
          .populate('booklet', 'eventName eventType eventDate')
      : await Purchase.findOne({ purchaseReference: idOrRef })
          .populate('user', 'name email phone')
          .populate('booklet', 'eventName eventType eventDate');

    if (!purchase || purchase.user._id.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    if (purchase.status !== 'captured') {
      return res.status(400).json({ message: 'Receipt only available for captured payments' });
    }

    const attempt = await PaymentAttempt.findOne({
      purchase: purchase._id,
      status: 'captured',
    });

    if (!purchase.invoiceNumber) {
      await assignInvoiceToPurchase(purchase._id);
      purchase.invoiceNumber = (await Purchase.findById(purchase._id)).invoiceNumber;
    }

    const invoiceData = buildInvoiceObject(purchase, purchase.user);

    res.json({
      receipt: {
        receiptNumber: purchase.invoiceNumber || `REC-${purchase.purchaseReference}`,
        invoiceNumber: purchase.invoiceNumber,
        purchaseReference: purchase.purchaseReference,
        date: purchase.fulfilledAt || purchase.createdAt,
        customer: {
          name: purchase.user.name,
          email: purchase.user.email,
          phone: purchase.user.phone,
        },
        purpose: purchase.purpose,
        purposeLabel:
          purchase.purpose === 'booklet_creation'
            ? `Booklet Creation - ${purchase.booklet?.eventName || 'Booklet'}`
            : 'Account Maintenance (6 Calendar Months)',
        amountPaise: purchase.amount,
        amountRupees: purchase.amount / 100,
        currency: purchase.currency,
        razorpayPaymentId: purchase.razorpayPaymentId,
        paymentMethod: attempt?.method || 'Online',
        pricingSnapshot: purchase.pricingSnapshot,
      },
      invoice: invoiceData,
    });
  } catch (error) {
    console.error('[getReceipt] Error:', error);
    res.status(500).json({ message: 'Failed to generate receipt' });
  }
}

/**
 * POST /api/billing/webhook
 * Handles incoming Razorpay webhooks with raw body signature verification and deduplication.
 */
export async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  // 1. Verify Webhook Signature
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn('[Webhook] Invalid signature received from Razorpay');
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const event = req.body;
  const eventId = req.headers['x-razorpay-event-id'] || event.event_id || event.id;

  if (!eventId) {
    return res.status(400).json({ message: 'Missing event ID' });
  }

  // 2. Deduplicate in WebhookInbox
  const existingEvent = await WebhookInbox.findOne({ eventId });
  if (existingEvent) {
    return res.status(200).json({ status: 'already_processed', eventId });
  }

  // Identify application from payload
  const entity = event.payload?.payment?.entity || event.payload?.order?.entity;
  const appIdentifier = entity?.notes?.application || 'unknown';

  const inboxRecord = await WebhookInbox.create({
    eventId,
    eventType: event.event,
    application: appIdentifier,
    razorpayOrderId: entity?.order_id || null,
    razorpayPaymentId: entity?.id && entity.id.startsWith('pay_') ? entity.id : null,
    payload: event,
    processingState: appIdentifier !== 'uravuu' ? 'ignored' : 'pending',
    attemptCount: 1,
  });

  // Safe early exit if event belongs to another application sharing this Razorpay account
  if (appIdentifier !== 'uravuu') {
    return res.status(200).json({ status: 'ignored_foreign_app', eventId });
  }

  // 3. Process Uravuu Payment Event
  try {
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity && paymentEntity.status === 'captured') {
        await fulfillPurchasePayment({
          paymentId: paymentEntity.id,
          providerPayment: paymentEntity,
          trigger: `webhook_${event.event}`,
        });
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity) {
        const purchase = await Purchase.findOne({ razorpayOrderId: paymentEntity.order_id });
        if (purchase && purchase.status !== 'captured') {
          purchase.status = 'failed';
          purchase.failureReason = paymentEntity.error_description || 'Payment failed on provider';
          await purchase.save();
        }
      }
    }

    inboxRecord.processingState = 'processed';
    inboxRecord.processedAt = new Date();
    await inboxRecord.save();

    res.status(200).json({ status: 'processed', eventId });
  } catch (err) {
    console.error('[Webhook Processing Error]:', err);
    inboxRecord.processingState = 'failed';
    inboxRecord.lastError = err.message;
    await inboxRecord.save();
    // Return 200 to Razorpay so it does not endlessly bombard if it's an application level issue
    res.status(200).json({ status: 'error_recorded', message: err.message });
  }
}
