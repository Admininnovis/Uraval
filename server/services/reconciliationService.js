import Purchase from '../models/Purchase.js';
import { getRazorpayClient } from './razorpayService.js';
import { fulfillPurchasePayment } from './fulfillmentService.js';

let intervalHandle = null;

/**
 * Reconciles pending purchases by checking their status against Razorpay.
 */
export async function runReconciliationJob() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pendingPurchases = await Purchase.find({
      status: { $in: ['created', 'pending'] },
      razorpayOrderId: { $ne: null },
      createdAt: { $gte: fortyEightHoursAgo, $lte: fiveMinutesAgo },
    }).limit(50);

    if (pendingPurchases.length === 0) return { checked: 0, fulfilled: 0 };

    const client = getRazorpayClient();
    let fulfilledCount = 0;

    for (const purchase of pendingPurchases) {
      try {
        const paymentsResponse = await client.orders.fetchPayments(purchase.razorpayOrderId);
        const payments = paymentsResponse.items || [];

        // Check if any payment was captured
        const capturedPayment = payments.find((p) => p.status === 'captured');
        if (capturedPayment) {
          const result = await fulfillPurchasePayment({
            purchaseId: purchase._id,
            paymentId: capturedPayment.id,
            providerPayment: capturedPayment,
            trigger: 'reconciliation_job',
          });
          if (result.success && !result.alreadyFulfilled) {
            fulfilledCount++;
          }
        } else if (payments.length > 0 && payments.every((p) => p.status === 'failed')) {
          purchase.status = 'failed';
          purchase.failedAt = new Date();
          purchase.failureReason = 'All provider payment attempts failed';
          await purchase.save();
        }
      } catch (err) {
        console.error(`[Reconciliation] Error reconciling purchase ${purchase.purchaseReference}:`, err.message);
      }
    }

    return { checked: pendingPurchases.length, fulfilled: fulfilledCount };
  } catch (error) {
    console.error('[ReconciliationJob] Fatal error during reconciliation run:', error);
    return { checked: 0, fulfilled: 0, error: error.message };
  }
}

/**
 * Starts the scheduled reconciliation worker.
 * @param {number} [intervalMs=600000] - Default 10 minutes
 */
export function startReconciliationWorker(intervalMs = 600000) {
  if (intervalHandle) return;
  // Run once after 30 seconds startup delay
  setTimeout(() => {
    runReconciliationJob().catch(() => {});
  }, 30000);

  intervalHandle = setInterval(() => {
    runReconciliationJob().catch(() => {});
  }, intervalMs);

  console.log(`[ReconciliationWorker] Started with interval ${intervalMs}ms`);
}

export function stopReconciliationWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
