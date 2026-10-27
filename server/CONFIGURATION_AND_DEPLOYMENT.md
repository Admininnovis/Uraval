# Uravuu - Configuration and Deployment Guide

## 1. Environment Configuration

Create a `.env` file in the `server/` directory based on the following template (placeholders only):

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://app.uravuu.in
ADMIN_URL=https://admin.uravuu.in

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/uravuu?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate_cryptographically_secure_random_string_min_32_chars>

# Razorpay Shared Account Credentials
RAZORPAY_KEY_ID=rzp_live_<your_key_id>
RAZORPAY_KEY_SECRET=<your_key_secret>
RAZORPAY_WEBHOOK_SECRET=<your_dedicated_webhook_secret>

# Email Service
EMAIL_USER=<your_smtp_email>
EMAIL_PASS=<your_smtp_app_password>
```

---

## 2. Shared Razorpay Account & Webhook Setup

Because this Razorpay account is shared with another application, the Uravuu integration strictly isolates transactions using server-side metadata and authoritative database verification.

### Razorpay Dashboard Configuration Steps:
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** > **Webhooks**.
3. Click **Add New Webhook**.
4. Set the **Webhook URL** to:
   ```
   https://<your-backend-domain>/api/billing/webhook
   ```
5. Enter a secret key into **Secret** and copy this exact string into `RAZORPAY_WEBHOOK_SECRET` in your `.env`.
6. Select the following **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
7. Click **Create Webhook**.

### Shared Account Isolation Logic:
- Every order created by Uravuu tags notes:
  - `application: "uravuu"`
  - `internal_purchase_reference: "URV-..."`
  - `user_id: "<mongo_user_id>"`
  - `payment_purpose: "booklet_creation"` | `"account_maintenance"`
  - `booklet_id: "<mongo_event_id>"` (for booklet creation)
- Receipt numbers are capped at 40 characters (e.g., `URV-BK-1730000000000-A1B2`).
- Webhook processor verifies `application === 'uravuu'`. Any events from the other application are safely ignored with HTTP 200 without side effects.

---

## 3. Database Migration

Run the safe migration script before launching:
```bash
cd server
npm run migrate
```
What this migration performs:
1. **Initializes `AccountAccess` records** for all established users using their original `createdAt` timestamp. It **does not reset** their initial 6-month free period.
2. **Preserves existing booklets**: Marks legacy booklets created before billing introduction as `active` and `isPaid: true` with `isLegacy: true`. It **does not** retroactively charge existing users or mark their existing booklets unpaid.

---

## 4. Admin Account Provisioning

Public admin registration is strictly disabled. Provision the initial system administrator via the CLI script:

```bash
cd server
npm run provision-admin <email> <password> "<Full Name>" "<Phone Number>"
```
Example:
```bash
npm run provision-admin admin@uravuu.in "AdminSecurePassword123!" "Platform Admin" "+919876543210"
```

To authenticate, log in through the `uruvuu-admin-web` portal at `http://localhost:5174/login` or your production admin URL.

---

## 5. Background Jobs & Reconciliation

The background reconciliation worker automatically starts with the server (`server.js`):
- Runs every **15 minutes** (and on startup).
- Queries pending purchases created over 20 minutes ago.
- Validates order state with Razorpay API (`orders.fetchPayments`).
- If captured payment is verified, idempotently fulfills access or booklet activation.
- If duplicate payments are detected for the same order, flags them for admin review (`isDuplicateCaptureFlagged: true`) without granting duplicate access or silently losing funds.

---

## 6. Business Model & Unresolved Tax Settings

### A. Booklet Creation (Confirmed)
- Charge: Exactly **₹150.00** (15000 paise), INCLUDING GST.
- Breakdown applied:
  - Base Taxable Value: ₹127.12
  - CGST (9%): ₹11.44
  - SGST (9%): ₹11.44
  - Total: ₹150.00
- Stored as an immutable pricing snapshot on each purchase record.

### B. Account Maintenance (Unconfirmed GST Treatment)
- Charge: Exactly **₹100.00** (10000 paise).
- Valid for six calendar months for the **entire account** and **all present and future booklets**.
- **Unresolved Business Setting**: The exact GST treatment (e.g., exempt, composite, or 18% inclusive) has not been confirmed by the business.
  - In accordance with specifications, tax configuration remains explicit.
  - The customer is charged exactly ₹100.
  - No assumed GST rate or compliant tax invoice is issued for maintenance until tax treatment is officially confirmed by company chartered accountants.
