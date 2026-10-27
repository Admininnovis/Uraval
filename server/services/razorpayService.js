import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let razorpayClient = null;

/**
 * Returns or initializes the Razorpay SDK client.
 */
export function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;

  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';

  razorpayClient = new Razorpay({
    key_id,
    key_secret,
  });

  return razorpayClient;
}

/**
 * Allows test suites to override or inject a mock client.
 */
export function setRazorpayClient(mockClient) {
  razorpayClient = mockClient;
}

/**
 * Creates an order on Razorpay with required Uravuu metadata.
 *
 * @param {object} params
 * @param {number} params.amount - Amount in paise (e.g., 15000 or 10000)
 * @param {string} params.currency - 'INR'
 * @param {string} params.receipt - Short unique reference (max 40 chars)
 * @param {object} params.notes - Metadata object (application: 'uravuu', etc.)
 * @returns {Promise<object>} Created order object
 */
export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes }) {
  const client = getRazorpayClient();
  const safeReceipt = (receipt || `rcpt_${Date.now()}`).substring(0, 40);

  const options = {
    amount: Math.round(amount),
    currency,
    receipt: safeReceipt,
    notes: {
      application: 'uravuu',
      ...notes,
    },
  };

  return await client.orders.create(options);
}

/**
 * Fetches payment details from Razorpay.
 *
 * @param {string} paymentId
 * @returns {Promise<object>}
 */
export async function fetchRazorpayPayment(paymentId) {
  const client = getRazorpayClient();
  return await client.payments.fetch(paymentId);
}

/**
 * Fetches order details from Razorpay.
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export async function fetchRazorpayOrder(orderId) {
  const client = getRazorpayClient();
  return await client.orders.fetch(orderId);
}

/**
 * Verifies Razorpay Checkout signature using HMAC-SHA256 and constant-time comparison.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
 *
 * @param {object} params
 * @param {string} params.orderId
 * @param {string} params.paymentId
 * @param {string} params.signature
 * @returns {boolean}
 */
export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;

  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature against raw body bytes.
 *
 * @param {string|Buffer} rawBody - Exact raw request body
 * @param {string} signature - Header `x-razorpay-signature`
 * @param {string} [customSecret] - Optional override webhook secret
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature, customSecret) {
  if (!rawBody || !signature) return false;

  const secret = customSecret || process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch {
    return false;
  }
}
