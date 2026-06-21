import express from 'express';
import { body } from 'express-validator';
import {
  createLedgerEntry,
  getLedgerEntries,
  getPersonLedger,
  updateLedgerEntry,
} from '../controllers/ledgerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('personId').notEmpty().withMessage('Person ID is required'),
    body('eventName').trim().notEmpty().withMessage('Event name is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
  ],
  createLedgerEntry
);

router.get('/', getLedgerEntries);
router.get('/person/:personId', getPersonLedger);

router.put(
  '/:entryId',
  [
    body('eventName').optional().trim(),
    body('amount').optional().isNumeric(),
    body('date').optional().isISO8601(),
  ],
  updateLedgerEntry
);

export default router;
