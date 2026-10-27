import mongoose from 'mongoose';

const paymentAttemptSchema = new mongoose.Schema(
  {
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in paise
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    method: {
      type: String,
      default: null,
    },
    capturedAt: {
      type: Date,
      default: null,
    },
    failureDetails: {
      code: { type: String, default: null },
      description: { type: String, default: null },
      source: { type: String, default: null },
      step: { type: String, default: null },
      reason: { type: String, default: null },
    },
    refundInfo: {
      refundId: { type: String, default: null },
      refundStatus: { type: String, default: null },
      amountRefunded: { type: Number, default: 0 },
      refundedAt: { type: Date, default: null },
    },
    rawMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('PaymentAttempt', paymentAttemptSchema);
