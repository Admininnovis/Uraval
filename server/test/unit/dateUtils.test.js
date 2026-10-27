import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addCalendarMonths,
  getUTCDaysInMonth,
  isAccessActive,
  calculateNewExpiry,
} from '../../utils/dateUtils.js';

describe('Unit Tests: Date and Calendar Month Calculations', () => {
  it('1 & 2: Free access lasts exactly six calendar months from creation', () => {
    // Normal month: Oct 26, 2026 -> Apr 26, 2027
    const start = new Date(Date.UTC(2026, 9, 26, 12, 0, 0)); // Oct is month index 9
    const expiry = addCalendarMonths(start, 6);

    assert.equal(expiry.getUTCFullYear(), 2027);
    assert.equal(expiry.getUTCMonth(), 3); // April is index 3
    assert.equal(expiry.getUTCDate(), 26);
    assert.equal(expiry.getUTCHours(), 12);
  });

  it('11: Month-end clamping rule clamps August 31 to February 28 (non-leap year)', () => {
    // Aug 31, 2026 + 6 calendar months -> Feb 28, 2027
    const aug31 = new Date(Date.UTC(2026, 7, 31, 10, 30, 0)); // August is 7
    const febEnd = addCalendarMonths(aug31, 6);

    assert.equal(febEnd.getUTCFullYear(), 2027);
    assert.equal(febEnd.getUTCMonth(), 1); // February is 1
    assert.equal(febEnd.getUTCDate(), 28); // Clamped to 28
    assert.equal(febEnd.getUTCHours(), 10);
    assert.equal(febEnd.getUTCMinutes(), 30);
  });

  it('11: Month-end clamping rule clamps August 31 to February 29 in leap year (2024)', () => {
    const aug31Leap = new Date(Date.UTC(2023, 7, 31, 8, 0, 0));
    const febLeap = addCalendarMonths(aug31Leap, 6);

    assert.equal(febLeap.getUTCFullYear(), 2024);
    assert.equal(febLeap.getUTCMonth(), 1);
    assert.equal(febLeap.getUTCDate(), 29); // Leap year 29
  });

  it('11: Month-end clamping rule clamps March 31 to September 30', () => {
    const mar31 = new Date(Date.UTC(2027, 2, 31, 15, 0, 0)); // March is 2
    const sepEnd = addCalendarMonths(mar31, 6);

    assert.equal(sepEnd.getUTCFullYear(), 2027);
    assert.equal(sepEnd.getUTCMonth(), 8); // September is 8
    assert.equal(sepEnd.getUTCDate(), 30); // Clamped to 30
  });

  it('9: Early renewal extends existing expiry by six months', () => {
    const existingExpiry = new Date(Date.UTC(2027, 3, 26, 12, 0, 0)); // Apr 26, 2027
    const captureTime = new Date(Date.UTC(2027, 2, 1, 10, 0, 0)); // Mar 1, 2027 (before expiry)

    const newExpiry = calculateNewExpiry(existingExpiry, captureTime, 6);

    assert.equal(newExpiry.getUTCFullYear(), 2027);
    assert.equal(newExpiry.getUTCMonth(), 9); // Oct 26, 2027 (Apr + 6 months)
    assert.equal(newExpiry.getUTCDate(), 26);
  });

  it('10: Renewal after expiry starts six months from verified capture time', () => {
    const existingExpiry = new Date(Date.UTC(2027, 3, 26, 12, 0, 0)); // Apr 26, 2027
    const captureTime = new Date(Date.UTC(2027, 6, 15, 10, 0, 0)); // Jul 15, 2027 (long gap after expiry)

    const newExpiry = calculateNewExpiry(existingExpiry, captureTime, 6);

    // Starts from Jul 15, 2027 + 6 months -> Jan 15, 2028
    assert.equal(newExpiry.getUTCFullYear(), 2028);
    assert.equal(newExpiry.getUTCMonth(), 0); // January is 0
    assert.equal(newExpiry.getUTCDate(), 15);
  });

  it('isAccessActive: returns true while strictly before expiry and false at or after', () => {
    const expiry = new Date(Date.UTC(2027, 3, 26, 12, 0, 0));

    const before = new Date(Date.UTC(2027, 3, 26, 11, 59, 59));
    assert.equal(isAccessActive(expiry, before), true);

    const exact = new Date(Date.UTC(2027, 3, 26, 12, 0, 0));
    assert.equal(isAccessActive(expiry, exact), false);

    const after = new Date(Date.UTC(2027, 3, 26, 12, 0, 1));
    assert.equal(isAccessActive(expiry, after), false);
  });
});
