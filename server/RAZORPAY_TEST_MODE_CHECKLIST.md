# Razorpay Test Mode Verification Checklist

This document distinguishes **Automated Test Scenarios** (passing in the test suite), **Manually Verified Scenarios** in Test Mode, and **Unverified Provider Scenarios** requiring production credentials or live banking infrastructure.

---

## 1. Automated Test Scenarios (100% Verified in Test Suite)

Run with `npm test` in `server/`:

| # | Scenario | Automated Test Coverage | Status |
|---|---|---|---|
| 1 | Free access starts at account creation | `businessLogic.test.js` | **PASS** |
| 2 | Free access lasts 6 calendar months | `businessLogic.test.js` | **PASS** |
| 3 | Registration without booklets still starts free period | `businessLogic.test.js` | **PASS** |
| 4 | Booklet creation costs exactly 15000 paise (₹150) | `pricing.test.js` | **PASS** |
| 5 | Maintenance costs exactly 10000 paise (₹100) | `pricing.test.js` | **PASS** |
| 6 | Maintenance covers the whole account | `pricing.test.js` & `businessLogic.test.js` | **PASS** |
| 7 | Multiple booklets do not multiply maintenance charges | `pricing.test.js` & `businessLogic.test.js` | **PASS** |
| 8 | Booklet creation does not extend access | `pricing.test.js` & `businessLogic.test.js` | **PASS** |
| 9 | Early renewal extends existing expiry by six months | `dateUtils.test.js` | **PASS** |
| 10 | Expired renewal starts from verified capture time | `dateUtils.test.js` | **PASS** |
| 11 | Month-end clamping (Aug 31 -> Feb 28/29, Mar 31 -> Sep 30) | `dateUtils.test.js` | **PASS** |
| 12 | Expired data is preserved and access is restored after renewal | `businessLogic.test.js` | **PASS** |
| 13 | Invalid / tampered checkout signatures are rejected | `security.test.js` | **PASS** |
| 14 | Modified raw webhook bodies are rejected (HMAC mismatch) | `security.test.js` | **PASS** |
| 15 | Amount, currency, order, purpose mismatch cannot fulfill | `reliabilityAndFulfillment.test.js` | **PASS** |
| 16 | Authorized-only and failed payments do not fulfill or grant access | `reliabilityAndFulfillment.test.js` | **PASS** |
| 17 | Duplicate checkout callbacks fulfill exactly once | `reliabilityAndFulfillment.test.js` | **PASS** |
| 18 | Duplicate webhook deliveries fulfill exactly once | `reliabilityAndFulfillment.test.js` | **PASS** |
| 19 | Callback, webhook, and reconciliation races fulfill once | `reliabilityAndFulfillment.test.js` | **PASS** |
| 20 | Out-of-order events do not regress captured payments | `reliabilityAndFulfillment.test.js` | **PASS** |
| 21 | Unexpected duplicate captures flagged for admin review | `reliabilityAndFulfillment.test.js` | **PASS** |
| 22 | Booklet payment finishing after account expiry is preserved | `businessLogic.test.js` | **PASS** |
| 23 | Events from another application on shared account safely ignored | `reliabilityAndFulfillment.test.js` | **PASS** |
| 24 | Non-admin access to admin endpoints rejected with 403 | `adminPortal.test.js` | **PASS** |
| 25 | Admin overview metrics separate drafts from active booklets | `adminPortal.test.js` | **PASS** |
| 26 | Formula injection safe CSV export with sanitized values | `adminPortal.test.js` | **PASS** |
| 27 | Sensitive data (passwords, OTPs) excluded from admin APIs | `adminPortal.test.js` | **PASS** |

---

## 2. Manually Verified Test Mode Scenarios (Using Test Keys)

To test end-to-end in your browser with Razorpay Test Mode:

### Setup:
1. In `server/.env`, ensure `RAZORPAY_KEY_ID=rzp_test_...` and `RAZORPAY_KEY_SECRET=...`.
2. Start server (`npm run dev` in `server`).
3. Start client (`npm run dev` in `client`).

### Verification Steps:
- [ ] **Booklet Creation Flow (`/events`)**:
  - Click "New Ledger / புதிய குறிப்பேடு".
  - Verify statutory notice: *“₹150 one-time charge per booklet, including GST. Account maintenance is charged separately.”*
  - Submit form. Razorpay Checkout modal appears with ₹150.00.
  - In Razorpay modal, select **UPI** or **Test Netbanking** -> **Success**.
  - Modal verifies payment and booklet appears with **Active** state.
- [ ] **Checkout Dismissal / Draft Preservation**:
  - Open booklet form, submit, then close the Razorpay popup with the `✕` button.
  - Verify booklet appears in the list with **"Draft / Unpaid"** badge.
  - Click **"Pay ₹150 to Activate"**. Verify Razorpay Checkout reopens without creating a duplicate booklet record.
- [ ] **Account Maintenance Renewal (`/subscription`)**:
  - Open Subscription page. Check initial free-period start and expiry dates.
  - Click **"Renew Maintenance for ₹100"**.
  - Complete payment in Razorpay Checkout modal.
  - Verify paid maintenance expiry is updated by 6 calendar months and receipt acknowledgment is viewable.
- [ ] **Admin Web Portal (`http://localhost:5174`)**:
  - Log in with provisioned admin credentials.
  - Verify Overview counts, Users list, Booklets list, and Payments transactions.
  - Click "Export Filtered CSV" and verify download opens cleanly in Excel without formula warnings.

---

## 3. Unverified Provider Scenarios (Requiring Live Gateway Activation)

The following scenarios depend on live bank networks, real payment capture, and live Razorpay production accounts:

1. **Production Webhook Delivery Over Public HTTPS**:
   - Razorpay requires a publicly accessible HTTPS domain (e.g., via domain or ngrok tunnel) with valid SSL to deliver live webhooks.
2. **Actual UPI Auto-Refunds / Banking Settlement**:
   - Actual settlement timelines (T+1/T+2 banking days) and interchange gateway fees deducted by Razorpay in live settlement batches.
3. **Card 3D-Secure Live OTP Behavior**:
   - Verification of live bank OTP redirects on Visa/MasterCard/RuPay.
