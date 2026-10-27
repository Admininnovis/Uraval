/**
 * Pricing and Tax Configuration for Uravuu.
 *
 * Requirements:
 * 1. Booklet creation:
 *    - ₹150 INCLUDING GST (15,000 paise).
 *    - Taxable value + CGST (9%) + SGST (9%) precisely rounded to total 15,000 paise.
 * 2. Account maintenance:
 *    - Exactly ₹100 (10,000 paise) for 6 calendar months.
 *    - Tax treatment is unconfirmed. Do NOT assume GST treatment or generate tax invoice.
 */

export const PRICING_CONFIG = {
  BOOKLET_CREATION: {
    PURPOSE: 'booklet_creation',
    AMOUNT_PAISE: 15000, // ₹150
    CURRENCY: 'INR',
    IS_TAX_INCLUSIVE: true,
    GST_RATE: 18, // 18% total (9% CGST + 9% SGST)
    DESCRIPTION: 'Uravuu Booklet Creation (1-time charge, includes GST)',
  },
  ACCOUNT_MAINTENANCE: {
    PURPOSE: 'account_maintenance',
    AMOUNT_PAISE: 10000, // ₹100
    CURRENCY: 'INR',
    IS_TAX_INCLUSIVE: false,
    GST_RATE: null, // Unconfirmed
    DURATION_MONTHS: 6,
    DESCRIPTION: 'Uravuu Account Maintenance (6 calendar months access)',
    TAX_NOTE: 'Tax treatment not confirmed. Charged gross ₹100. Tax invoice not issued.',
  },
  FREE_TRIAL_MONTHS: 6,
  APPLICATION_IDENTIFIER: 'uravuu',
};

/**
 * Calculates the pricing and tax breakdown snapshot for a purchase purpose.
 * Ensures the breakdown sums exactly to the final charged paise amount.
 *
 * @param {'booklet_creation'|'account_maintenance'} purpose
 * @returns {object} Pricing and tax snapshot
 */
export function getPricingSnapshot(purpose) {
  if (purpose === PRICING_CONFIG.BOOKLET_CREATION.PURPOSE) {
    const totalPaise = PRICING_CONFIG.BOOKLET_CREATION.AMOUNT_PAISE; // 15000
    const gstRate = PRICING_CONFIG.BOOKLET_CREATION.GST_RATE; // 18

    // Calculate base taxable value: Total / (1 + Rate / 100)
    // 15000 / 1.18 = 12711.864... -> 12712 paise
    const taxablePaise = Math.round(totalPaise / (1 + gstRate / 100));
    const totalTaxPaise = totalPaise - taxablePaise; // 2288 paise
    const halfTaxPaise = Math.floor(totalTaxPaise / 2); // 1144 paise
    const cgstPaise = halfTaxPaise; // 1144 paise
    const sgstPaise = totalTaxPaise - halfTaxPaise; // 1144 paise

    return {
      purpose,
      currency: PRICING_CONFIG.BOOKLET_CREATION.CURRENCY,
      totalAmountPaise: totalPaise,
      totalAmountRupees: totalPaise / 100,
      taxableAmountPaise: taxablePaise,
      taxableAmountRupees: taxablePaise / 100,
      gstRate,
      cgstPaise,
      cgstRupees: cgstPaise / 100,
      sgstPaise,
      sgstRupees: sgstPaise / 100,
      isTaxInclusive: true,
      taxStatus: 'gst_included_configured',
      note: '₹150 inclusive of 18% GST (9% CGST + 9% SGST)',
    };
  }

  if (purpose === PRICING_CONFIG.ACCOUNT_MAINTENANCE.PURPOSE) {
    const totalPaise = PRICING_CONFIG.ACCOUNT_MAINTENANCE.AMOUNT_PAISE; // 10000
    return {
      purpose,
      currency: PRICING_CONFIG.ACCOUNT_MAINTENANCE.CURRENCY,
      totalAmountPaise: totalPaise,
      totalAmountRupees: totalPaise / 100,
      taxableAmountPaise: null,
      taxableAmountRupees: null,
      gstRate: null,
      cgstPaise: 0,
      cgstRupees: 0,
      sgstPaise: 0,
      sgstRupees: 0,
      isTaxInclusive: false,
      taxStatus: 'unconfirmed_treatment',
      note: PRICING_CONFIG.ACCOUNT_MAINTENANCE.TAX_NOTE,
      durationMonths: PRICING_CONFIG.ACCOUNT_MAINTENANCE.DURATION_MONTHS,
    };
  }

  throw new Error(`Unknown pricing purpose: ${purpose}`);
}
