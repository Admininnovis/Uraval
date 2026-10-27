import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../../services/razorpayService.js';

describe('Unit Tests: Payment Verification and Signature Security', () => {
  const testSecret = 'test_secret_key_12345';

  before(() => {
    process.env.RAZORPAY_KEY_SECRET = testSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;
  });

  it('13: Valid checkout signature is accepted', () => {
    const orderId = 'order_test_998877';
    const paymentId = 'pay_test_112233';
    const payload = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(payload)
      .digest('hex');

    const result = verifyCheckoutSignature({
      orderId,
      paymentId,
      signature: validSignature,
    });

    assert.equal(result, true);
  });

  it('13: Tampered or invalid checkout signature is rejected', () => {
    const orderId = 'order_test_998877';
    const paymentId = 'pay_test_112233';
    const fakeSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const result = verifyCheckoutSignature({
      orderId,
      paymentId,
      signature: fakeSignature,
    });

    assert.equal(result, false);
  });

  it('13: Checkout signature with missing fields is safely rejected', () => {
    assert.equal(verifyCheckoutSignature({ orderId: '', paymentId: 'pay_123', signature: 'sig' }), false);
    assert.equal(verifyCheckoutSignature({ orderId: 'order_123', paymentId: '', signature: 'sig' }), false);
    assert.equal(verifyCheckoutSignature({ orderId: 'order_123', paymentId: 'pay_123', signature: '' }), false);
  });

  it('14: Valid webhook signature is accepted', () => {
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_abc123' } } },
    });

    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(rawBody)
      .digest('hex');

    const result = verifyWebhookSignature(rawBody, validSignature);
    assert.equal(result, true);
  });

  it('14: Modified raw webhook body is rejected even by 1 byte', () => {
    const originalBody = '{"event":"payment.captured","amount":15000}';
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(originalBody)
      .digest('hex');

    // Tampered body: change amount to 10000
    const tamperedBody = '{"event":"payment.captured","amount":10000}';
    const result = verifyWebhookSignature(tamperedBody, validSignature);

    assert.equal(result, false);
  });

  it('14: Webhook with wrong secret is rejected', () => {
    const rawBody = '{"event":"payment.captured"}';
    const wrongSignature = crypto
      .createHmac('sha256', 'wrong_secret')
      .update(rawBody)
      .digest('hex');

    const result = verifyWebhookSignature(rawBody, wrongSignature);
    assert.equal(result, false);
  });
});
