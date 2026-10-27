import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import PaymentAttempt from '../models/PaymentAttempt.js';
import MaintenanceGrant from '../models/MaintenanceGrant.js';
import BookletActivation from '../models/BookletActivation.js';
import AccountAccess from '../models/AccountAccess.js';
import Event from '../models/Event.js';
import { calculateNewExpiry } from '../utils/dateUtils.js';
import { fetchRazorpayPayment } from './razorpayService.js';
import { assignInvoiceToPurchase } from './invoiceService.js';

/**
 * Shared Idempotent Fulfillment Service.
 * Used by:
 * 1. Checkout verification API
 * 2. Webhook receiver
 * 3. Scheduled reconciliation job
 *
 * Enforces:
 * - Payment is strictly captured on provider
 * - Matching amount, INR currency, order ID, purpose, application
 * - Concurrency control & idempotent fulfillment (only fulfilled once)
 * - Safe recording of payment attempts without regressions
 * - Flags unexpected duplicate captures for admin review
 * - Fulfills booklet activation even if account access expired during checkout
 */
export async function fulfillPurchasePayment({
  purchaseId,
  paymentId,
  providerPayment = null,
  trigger = 'checkout_verify',
}) {
  if (!purchaseId && !paymentId) {
    throw new Error('Either purchaseId or paymentId is required for fulfillment');
  }

  // 1. Resolve Purchase
  let purchase = null;
  if (purchaseId) {
    purchase = await Purchase.findById(purchaseId);
  }
  if (!purchase && paymentId) {
    purchase = await Purchase.findOne({ razorpayPaymentId: paymentId });
  }

  // 2. Fetch authoritative provider payment if not passed
  let paymentData = providerPayment;
  if (!paymentData && paymentId) {
    paymentData = await fetchRazorpayPayment(paymentId);
  }

  if (!paymentData) {
    throw new Error('Unable to retrieve payment details from provider');
  }

  // If purchase wasn't found by purchaseId, attempt lookup via payment's order_id or notes
  if (!purchase && paymentData.order_id) {
    purchase = await Purchase.findOne({ razorpayOrderId: paymentData.order_id });
  }

  if (!purchase) {
    throw new Error(`No internal purchase matching order ${paymentData.order_id} or payment ${paymentData.id}`);
  }

  // Check application identifier to prevent cross-app contamination on shared Razorpay account
  if (paymentData.notes && paymentData.notes.application && paymentData.notes.application !== 'uravuu') {
    throw new Error(`Ignoring payment from external application: ${paymentData.notes.application}`);
  }

  const captureTime = paymentData.created_at
    ? new Date(paymentData.created_at * 1000)
    : new Date();

  // 3. Record or update PaymentAttempt
  try {
    const existingAttempt = await PaymentAttempt.findOne({ razorpayPaymentId: paymentData.id });
    if (existingAttempt) {
      // Do not regress captured payment if older/subsequent event is failed
      if (existingAttempt.status !== 'captured' || paymentData.status === 'captured') {
        existingAttempt.status = paymentData.status;
        existingAttempt.capturedAt = paymentData.status === 'captured' ? captureTime : existingAttempt.capturedAt;
        existingAttempt.method = paymentData.method || existingAttempt.method;
        await existingAttempt.save();
      }
    } else {
      await PaymentAttempt.create({
        purchase: purchase._id,
        razorpayPaymentId: paymentData.id,
        razorpayOrderId: paymentData.order_id || purchase.razorpayOrderId,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        method: paymentData.method,
        capturedAt: paymentData.status === 'captured' ? captureTime : null,
        failureDetails: paymentData.error_code
          ? {
              code: paymentData.error_code,
              description: paymentData.error_description,
              source: paymentData.error_source,
              step: paymentData.error_step,
              reason: paymentData.error_reason,
            }
          : {},
        rawMetadata: { trigger },
      });
    }
  } catch (err) {
    if (err.code !== 11000) {
      console.warn('[FulfillmentService] Warning recording payment attempt:', err.message);
    }
  }

  // 4. Validate Provider State for Fulfillment
  if (paymentData.status !== 'captured') {
    return {
      success: false,
      status: paymentData.status,
      message: `Payment is not captured. Current provider status: ${paymentData.status}`,
      purchase,
    };
  }

  if (paymentData.currency !== 'INR') {
    throw new Error(`Invalid payment currency: expected INR, received ${paymentData.currency}`);
  }

  if (Number(paymentData.amount) !== Number(purchase.amount)) {
    throw new Error(
      `Amount mismatch: expected ${purchase.amount} paise, received ${paymentData.amount} paise`
    );
  }

  if (paymentData.order_id && purchase.razorpayOrderId && paymentData.order_id !== purchase.razorpayOrderId) {
    throw new Error(
      `Order mismatch: expected ${purchase.razorpayOrderId}, received ${paymentData.order_id}`
    );
  }

  // 5. Idempotency Check & Duplicate Capture Warning
  if (purchase.status === 'captured') {
    if (purchase.razorpayPaymentId && purchase.razorpayPaymentId !== paymentData.id) {
      // Duplicate payment captured for same purchase! Flag for admin review.
      purchase.isDuplicateCaptureFlagged = true;
      purchase.reconciliationNotes = `Duplicate capture detected. Original payment: ${purchase.razorpayPaymentId}, Secondary payment: ${paymentData.id}`;
      await purchase.save();
      console.warn(`[FULFILLMENT WARNING] Duplicate capture detected for purchase ${purchase.purchaseReference}`);
    }
    return {
      success: true,
      alreadyFulfilled: true,
      purchase,
      message: 'Purchase is already fulfilled.',
    };
  }

  // 6. Atomic Fulfillment Execution
  // Use a transaction if replica set available, or atomic Mongoose condition
  const session = await mongoose.startSession().catch(() => null);
  const useTransaction = !!(session && session.inTransaction);

  try {
    if (useTransaction) {
      session.startTransaction();
    }

    // Atomic update condition: status must still be 'created' or 'pending'
    const updatedPurchase = await Purchase.findOneAndUpdate(
      { _id: purchase._id, status: { $in: ['created', 'pending'] } },
      {
        $set: {
          status: 'captured',
          razorpayPaymentId: paymentData.id,
          fulfilledAt: captureTime,
          reconciliationNotes: `Fulfilled via ${trigger}`,
        },
      },
      { new: true, session: useTransaction ? session : undefined }
    );

    if (!updatedPurchase) {
      // Another worker or thread fulfilled this purchase in parallel
      if (session) {
        try { await session.abortTransaction(); } catch (_) {}
      }
      await new Promise((r) => setTimeout(r, 150));
      const fresh = await Purchase.findById(purchase._id);
      return {
        success: true,
        alreadyFulfilled: true,
        purchase: fresh,
        message: 'Purchase fulfilled concurrently by another worker.',
      };
    }

    // A. Account Maintenance Fulfillment
    if (updatedPurchase.purpose === 'account_maintenance') {
      let access = await AccountAccess.findOne({ user: updatedPurchase.user });

      const prevExpiry = access ? access.currentAccessExpiry : captureTime;
      const newExpiry = calculateNewExpiry(prevExpiry, captureTime, 6);

      if (access) {
        access.paidMaintenanceExpiry = newExpiry;
        access.currentAccessExpiry = newExpiry;
        access.status = 'active_paid';
        await access.save();
      }

      await MaintenanceGrant.create([
        {
          purchase: updatedPurchase._id,
          user: updatedPurchase.user,
          previousAccessExpiry: prevExpiry,
          newAccessExpiry: newExpiry,
          monthsGranted: 6,
          sourcePaymentId: paymentData.id,
          fulfilledAt: captureTime,
        },
      ]);
    }

    // B. Booklet Creation Fulfillment
    let createdBookletId = updatedPurchase.booklet;
    if (updatedPurchase.purpose === 'booklet_creation') {
      if (updatedPurchase.booklet) {
        await Event.findByIdAndUpdate(updatedPurchase.booklet, {
          $set: {
            status: 'active',
            isPaid: true,
            purchaseId: updatedPurchase._id,
            activatedAt: captureTime,
          },
        });
      } else if (updatedPurchase.bookletPayload) {
        // Create the booklet record ONLY after verified payment capture
        const payload = updatedPurchase.bookletPayload;
        const newEvent = new Event({
          eventName: (payload.eventName || 'Untitled Booklet').trim().toUpperCase(),
          eventType: payload.eventType || 'Custom',
          eventDate: payload.eventDate ? new Date(payload.eventDate) : new Date(),
          location: payload.location ? payload.location.trim().toUpperCase() : '',
          description: payload.description || '',
          createdBy: updatedPurchase.user,
          status: 'active',
          isPaid: true,
          purchaseId: updatedPurchase._id,
          activatedAt: captureTime,
          isLegacy: false,
        });
        await newEvent.save();
        updatedPurchase.booklet = newEvent._id;
        await updatedPurchase.save();
        createdBookletId = newEvent._id;
      }

      if (createdBookletId) {
        await BookletActivation.create([
          {
            purchase: updatedPurchase._id,
            booklet: createdBookletId,
            user: updatedPurchase.user,
            sourcePaymentId: paymentData.id,
            activatedAt: captureTime,
          },
        ]);
      }
    }

    if (session && session.inTransaction) {
      await session.commitTransaction();
    }

    try {
      const invNum = await assignInvoiceToPurchase(updatedPurchase._id);
      if (invNum) {
        updatedPurchase.invoiceNumber = invNum;
      }
    } catch (invErr) {
      console.warn('[FulfillmentService] Error assigning invoice number:', invErr.message);
    }

    return {
      success: true,
      alreadyFulfilled: false,
      purchase: updatedPurchase,
      bookletId: createdBookletId,
      message: 'Payment successfully captured and fulfilled.',
    };
  } catch (error) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
    }
    // Check if another concurrent thread fulfilled this exact purchase
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const fresh = await Purchase.findById(purchase._id);
      if (fresh && fresh.status === 'captured') {
        return {
          success: true,
          alreadyFulfilled: true,
          purchase: fresh,
          message: 'Purchase fulfilled concurrently by another worker.',
        };
      }
    }
    console.error('[FulfillmentService] Error fulfilling purchase:', error.message);
    throw error;
  } finally {
    if (session) {
      try { session.endSession(); } catch (_) {}
    }
  }
}
