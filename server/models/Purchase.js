import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    purchaseReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    application: {
      type: String,
      required: true,
      default: 'uravuu',
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    booklet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    bookletPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    purpose: {
      type: String,
      enum: ['booklet_creation', 'account_maintenance'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in paise (e.g. 15000 or 10000)
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    pricingSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    invoiceNumber: {
      type: String,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    isDuplicateCaptureFlagged: {
      type: Boolean,
      default: false,
    },
    reconciliationNotes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Purchase', purchaseSchema);
