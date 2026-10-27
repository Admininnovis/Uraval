import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['Wedding', 'Housewarming', 'Seemantham', 'Birthday', 'Ear Piercing', 'Temple Function', 'Custom'],
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalCollection: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'active'],
      default: 'active', // Legacy booklets default to active
    },
    isPaid: {
      type: Boolean,
      default: true, // Legacy booklets default to paid
    },
    isLegacy: {
      type: Boolean,
      default: false,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
