import mongoose from 'mongoose';

const accountAccessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    initialFreePeriodStart: {
      type: Date,
      required: true,
    },
    initialFreePeriodExpiry: {
      type: Date,
      required: true,
      index: true,
    },
    paidMaintenanceExpiry: {
      type: Date,
      default: null,
      index: true,
    },
    currentAccessExpiry: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['free_trial', 'active_paid', 'expired'],
      default: 'free_trial',
      index: true,
    },
  },
  { timestamps: true }
);

// Method to compute effective status dynamically
accountAccessSchema.methods.computeStatus = function (currentTime = new Date()) {
  const effectiveExpiry = this.paidMaintenanceExpiry && this.paidMaintenanceExpiry > this.initialFreePeriodExpiry
    ? this.paidMaintenanceExpiry
    : this.initialFreePeriodExpiry;

  this.currentAccessExpiry = effectiveExpiry;

  if (currentTime.getTime() >= effectiveExpiry.getTime()) {
    this.status = 'expired';
  } else if (this.paidMaintenanceExpiry && this.paidMaintenanceExpiry.getTime() > this.initialFreePeriodExpiry.getTime()) {
    this.status = 'active_paid';
  } else {
    this.status = 'free_trial';
  }

  return this.status;
};

export default mongoose.model('AccountAccess', accountAccessSchema);
