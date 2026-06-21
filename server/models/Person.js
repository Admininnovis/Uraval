import mongoose from 'mongoose';

const personSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalReceived: {
      type: Number,
      default: 0,
    },
    totalReturned: {
      type: Number,
      default: 0,
    },
    editHistory: [{
      name: String,
      village: String,
      mobile: String,
      notes: String,
      updatedAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

// Virtual for balance
personSchema.virtual('balance').get(function () {
  return this.totalReceived - this.totalReturned;
});

// Virtual for status
personSchema.virtual('status').get(function () {
  const balance = this.totalReceived - this.totalReturned;
  if (balance > 0) return 'Need To Return';
  if (balance < 0) return 'Need To Receive';
  return 'Settled';
});

personSchema.set('toJSON', { virtuals: true });
personSchema.set('toObject', { virtuals: true });

export default mongoose.model('Person', personSchema);
