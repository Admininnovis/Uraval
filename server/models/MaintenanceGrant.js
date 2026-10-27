import mongoose from 'mongoose';

const maintenanceGrantSchema = new mongoose.Schema(
  {
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    previousAccessExpiry: {
      type: Date,
      required: true,
    },
    newAccessExpiry: {
      type: Date,
      required: true,
    },
    monthsGranted: {
      type: Number,
      required: true,
      default: 6,
    },
    sourcePaymentId: {
      type: String,
      required: true,
      index: true,
    },
    fulfilledAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('MaintenanceGrant', maintenanceGrantSchema);
