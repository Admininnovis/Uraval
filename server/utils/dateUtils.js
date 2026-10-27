/**
 * Date and calendar month utilities with documented month-end clamping rules.
 * All calculations operate strictly in UTC.
 */

/**
 * Returns the number of days in the specified UTC year and month (0-indexed).
 * @param {number} year - Full year (e.g., 2026)
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @returns {number} Days in month (28, 29, 30, or 31)
 */
export function getUTCDaysInMonth(year, month) {
  // Day 0 of the next month is the last day of the target month
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Adds an exact number of calendar months to a UTC Date using month-end clamping.
 * If the source day exceeds the number of days in the target month (e.g. Aug 31 -> Feb 28),
 * it is clamped to the last valid day of that target month.
 *
 * @param {Date|string|number} fromDate - Starting date
 * @param {number} monthsCount - Number of calendar months to add (e.g., 6)
 * @returns {Date} Resulting UTC Date with exact time preserved
 */
export function addCalendarMonths(fromDate, monthsCount = 6) {
  const d = new Date(fromDate);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to addCalendarMonths');
  }

  const origYear = d.getUTCFullYear();
  const origMonth = d.getUTCMonth();
  const origDay = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  const ms = d.getUTCMilliseconds();

  const totalMonths = origMonth + monthsCount;
  const targetYear = origYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const daysInTargetMonth = getUTCDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(origDay, daysInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay, hours, minutes, seconds, ms));
}

/**
 * Checks whether an account's access is active.
 * Access is active strictly while the current time is before access expiry.
 *
 * @param {Date|string|null} accessExpiry - Current access expiration timestamp
 * @param {Date} [currentTime=new Date()] - Reference timestamp
 * @returns {boolean}
 */
export function isAccessActive(accessExpiry, currentTime = new Date()) {
  if (!accessExpiry) return false;
  const expiryDate = new Date(accessExpiry);
  if (isNaN(expiryDate.getTime())) return false;
  return currentTime.getTime() < expiryDate.getTime();
}

/**
 * Calculates new maintenance access expiry.
 * - Early renewal (currentExpiry > captureTime): adds 6 months to currentExpiry.
 * - Renewal after expiry (currentExpiry <= captureTime or null): adds 6 months from captureTime.
 *
 * @param {Date|string|null} currentExpiry - Existing access expiry
 * @param {Date|string} captureTime - Payment capture timestamp (UTC)
 * @param {number} [months=6] - Calendar months to add
 * @returns {Date}
 */
export function calculateNewExpiry(currentExpiry, captureTime, months = 6) {
  const captureDate = new Date(captureTime);
  if (isNaN(captureDate.getTime())) {
    throw new Error('Invalid capture time');
  }

  if (currentExpiry) {
    const existingDate = new Date(currentExpiry);
    if (!isNaN(existingDate.getTime()) && existingDate.getTime() > captureDate.getTime()) {
      return addCalendarMonths(existingDate, months);
    }
  }

  return addCalendarMonths(captureDate, months);
}
