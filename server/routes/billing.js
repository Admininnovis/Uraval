import express from 'express';
import {
  getAccessStatus,
  createMaintenancePurchase,
  createBookletPurchase,
  verifyPayment,
  recoverPurchaseStatus,
  getUserPurchases,
  getReceipt,
  handleWebhook,
} from '../controllers/billingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Webhook endpoint: open to provider, rawBody handled at app level or parsed
router.post('/webhook', handleWebhook);

// Protected user routes
router.use(protect);

router.get('/access-status', getAccessStatus);
router.get('/access', getAccessStatus);
router.post('/maintenance-purchase', createMaintenancePurchase);
router.post('/booklet-purchase', createBookletPurchase);
router.post('/verify-payment', verifyPayment);
router.post('/verify', verifyPayment);
router.post('/recover/:purchaseId', recoverPurchaseStatus);
router.get('/purchases/:purchaseId/recover', recoverPurchaseStatus);
router.get('/purchases', getUserPurchases);
router.get('/receipt/:id', getReceipt);

export default router;
