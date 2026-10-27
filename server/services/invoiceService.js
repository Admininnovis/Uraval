import InvoiceCounter from '../models/InvoiceCounter.js';
import Purchase from '../models/Purchase.js';

export const SUPPLIER_DETAILS = {
  name: 'Tarvino Pvt Ltd',
  productName: 'Uravuu',
  address: 'No 334, Kamaraj Nagar, Seplanatham, Cuddalore, Panruti, Tamil Nadu, India, 607802',
  gstin: '33AANCT1942J1Z5',
  state: 'Tamil Nadu (33)',
  sacCode: '998315 (Software as a Service)',
};

/**
 * Atomically generates next sequential invoice number: TARURA0000001, TARURA0000002...
 */
export async function generateNextInvoiceNumber() {
  const counter = await InvoiceCounter.findOneAndUpdate(
    { name: 'uravuu_tax_invoice' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(7, '0');
  return `TARURA${padded}`;
}

/**
 * Assigns an invoice number to a captured purchase if not already assigned.
 */
export async function assignInvoiceToPurchase(purchaseId) {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) return null;

  if (purchase.invoiceNumber) {
    return purchase.invoiceNumber;
  }

  const invoiceNumber = await generateNextInvoiceNumber();
  purchase.invoiceNumber = invoiceNumber;
  purchase.invoiceDate = purchase.fulfilledAt || new Date();
  await purchase.save();

  return invoiceNumber;
}

/**
 * Formats a date into "DD MMM YYYY" (e.g. "27 Oct 2026")
 */
export function formatInvoiceDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculates billing period text based on purpose and dates
 */
export function calculateBillingPeriod(purchase) {
  const issueDate = formatInvoiceDate(purchase.invoiceDate || purchase.fulfilledAt || purchase.createdAt);
  if (purchase.purpose === 'account_maintenance') {
    const startDate = new Date(purchase.fulfilledAt || purchase.createdAt);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6);
    return `${formatInvoiceDate(startDate)} - ${formatInvoiceDate(endDate)}`;
  }
  // Booklet creation
  return `${issueDate} (One-Time Lifetime)`;
}

/**
 * Prepares clean structured invoice object for PDF or JSON response
 */
export function buildInvoiceObject(purchase, user) {
  const isBooklet = purchase.purpose === 'booklet_creation';
  const pricing = purchase.pricingSnapshot || {};

  // Net amount and GST calculations
  const taxablePaise = pricing.taxableAmountPaise || (isBooklet ? 12712 : 8475);
  const cgstPaise = pricing.cgstPaise || (isBooklet ? 1144 : 763);
  const sgstPaise = pricing.sgstPaise || (isBooklet ? 1144 : 763);
  const totalAmountPaise = purchase.amount || (isBooklet ? 15000 : 10000);

  const issueDateStr = formatInvoiceDate(purchase.invoiceDate || purchase.fulfilledAt || purchase.createdAt);
  const billingPeriodStr = calculateBillingPeriod(purchase);

  return {
    invoiceNumber: purchase.invoiceNumber || 'TARURA0000001',
    purchaseReference: purchase.purchaseReference,
    dateOfIssue: issueDateStr,
    billingPeriod: billingPeriodStr,
    placeOfSupply: 'Tamil Nadu (33)',
    status: purchase.status === 'captured' ? 'PAID' : purchase.status.toUpperCase(),
    reverseCharge: 'No',

    supplier: SUPPLIER_DETAILS,

    billedTo: {
      name: user?.name || 'Valued Customer',
      email: user?.email || '',
      phone: user?.phone ? `+91${user.phone.replace(/^\+?91/, '')}` : '+91XXXXXXXXXX',
      state: 'Tamil Nadu (33)',
      gstin: 'Unregistered (B2C)',
    },

    description: isBooklet
      ? `Uravuu Booklet Creation Fee${purchase.bookletPayload?.eventName ? ` - ${purchase.bookletPayload.eventName}` : ''}`
      : 'Uravuu Account Maintenance Subscription (6 Months)',

    currency: purchase.currency || 'INR',
    taxableAmountRupees: (taxablePaise / 100).toFixed(2),
    cgstRate: '9%',
    cgstRupees: (cgstPaise / 100).toFixed(2),
    sgstRate: '9%',
    sgstRupees: (sgstPaise / 100).toFixed(2),
    totalRupees: (totalAmountPaise / 100).toFixed(2),

    footerText: 'This is a computer-generated invoice and does not require a physical signature.',
    footerThankYou: 'Thank you for your business!',
    footerCompany: 'Uravuu by Tarvino Pvt Ltd',
  };
}
