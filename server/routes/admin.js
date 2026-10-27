import express from 'express';
import {
  adminLogin,
  getAdminOverview,
  getAdminUsers,
  getAdminUserDetails,
  getAdminBooklets,
  getAdminPayments,
  exportPaymentsCsv,
  getAdminInvoices,
  getAdminInvoicesAllByMonth,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/checkAccess.js';

const router = express.Router();

// Public Admin Login
router.post('/login', adminLogin);

// Protected Admin Endpoints
router.use(protect);
router.use(requireAdmin);

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserDetails);
router.get('/booklets', getAdminBooklets);
router.get('/payments', getAdminPayments);
router.get('/payments/export', exportPaymentsCsv);
router.get('/invoices', getAdminInvoices);
router.get('/invoices/all-by-month', getAdminInvoicesAllByMonth);

export default router;
