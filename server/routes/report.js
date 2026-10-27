import express from 'express';
import {
  getBalanceReport,
  getEventReport,
  getPersonReport,
  getVillageReport,
  getDashboardStats,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { requireActiveAccountAccess } from '../middleware/checkAccess.js';

const router = express.Router();

router.use(protect);
router.use(requireActiveAccountAccess);

router.get('/balance', getBalanceReport);
router.get('/events', getEventReport);
router.get('/persons', getPersonReport);
router.get('/villages', getVillageReport);
router.get('/dashboard', getDashboardStats);

export default router;
