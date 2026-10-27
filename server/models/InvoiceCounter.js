import mongoose from 'mongoose';

const invoiceCounterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      default: 'uravuu_tax_invoice',
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('InvoiceCounter', invoiceCounterSchema);
