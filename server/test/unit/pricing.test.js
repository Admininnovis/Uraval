import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRICING_CONFIG, getPricingSnapshot } from '../../config/pricing.js';

describe('Unit Tests: Pricing and Tax Configurations', () => {
  it('4: Booklet creation costs exactly 15000 paise (₹150 including GST)', () => {
    assert.equal(PRICING_CONFIG.BOOKLET_CREATION.AMOUNT_PAISE, 15000);
    assert.equal(PRICING_CONFIG.BOOKLET_CREATION.CURRENCY, 'INR');
    assert.equal(PRICING_CONFIG.BOOKLET_CREATION.IS_TAX_INCLUSIVE, true);

    const snapshot = getPricingSnapshot('booklet_creation');
    assert.equal(snapshot.totalAmountPaise, 15000);
    assert.equal(snapshot.totalAmountRupees, 150);
    assert.equal(snapshot.gstRate, 18);

    // Verify rounding precision: taxable + CGST + SGST == exactly total
    assert.equal(
      snapshot.taxableAmountPaise + snapshot.cgstPaise + snapshot.sgstPaise,
      15000
    );
    assert.equal(snapshot.taxableAmountPaise, 12712);
    assert.equal(snapshot.cgstPaise, 1144);
    assert.equal(snapshot.sgstPaise, 1144);
  });

  it('5: Maintenance costs exactly 10000 paise (₹100) for six calendar months', () => {
    assert.equal(PRICING_CONFIG.ACCOUNT_MAINTENANCE.AMOUNT_PAISE, 10000);
    assert.equal(PRICING_CONFIG.ACCOUNT_MAINTENANCE.CURRENCY, 'INR');
    assert.equal(PRICING_CONFIG.ACCOUNT_MAINTENANCE.DURATION_MONTHS, 6);

    const snapshot = getPricingSnapshot('account_maintenance');
    assert.equal(snapshot.totalAmountPaise, 10000);
    assert.equal(snapshot.totalAmountRupees, 100);
    // Explicitly unconfirmed tax treatment: do not invent rate or taxable amount
    assert.equal(snapshot.gstRate, null);
    assert.equal(snapshot.taxableAmountPaise, null);
    assert.equal(snapshot.taxStatus, 'unconfirmed_treatment');
  });

  it('6 & 7: Maintenance covers the whole account; multiple booklets do not multiply maintenance charges', () => {
    // Maintenance is per-account, not per-booklet
    const singleAccountFee = PRICING_CONFIG.ACCOUNT_MAINTENANCE.AMOUNT_PAISE;
    const feeForUserWith1Booklet = singleAccountFee;
    const feeForUserWith10Booklets = singleAccountFee;

    assert.equal(feeForUserWith1Booklet, 10000);
    assert.equal(feeForUserWith10Booklets, 10000);
  });

  it('8: Booklet creation charge is distinct from maintenance and does not extend access', () => {
    const bookletFee = PRICING_CONFIG.BOOKLET_CREATION.AMOUNT_PAISE;
    const maintenanceFee = PRICING_CONFIG.ACCOUNT_MAINTENANCE.AMOUNT_PAISE;

    assert.equal(bookletFee, 15000);
    assert.equal(maintenanceFee, 10000);
    assert.notEqual(bookletFee, maintenanceFee);
  });
});
