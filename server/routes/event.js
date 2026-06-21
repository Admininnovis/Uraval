import express from 'express';
import { body } from 'express-validator';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addEventEntry,
  updateEventEntry,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('eventName').trim().notEmpty().withMessage('Event name is required'),
    body('eventType').notEmpty().withMessage('Event type is required'),
    body('eventDate').isISO8601().withMessage('Valid event date is required'),
  ],
  createEvent
);

router.get('/', getEvents);
router.get('/:id', getEventById);

router.put(
  '/:id',
  [
    body('eventName').optional().trim(),
    body('eventType').optional(),
    body('eventDate').optional().isISO8601(),
  ],
  updateEvent
);

router.delete('/:id', deleteEvent);

router.post(
  '/:eventId/entries',
  [
    body('personId').notEmpty().withMessage('Person ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
  ],
  addEventEntry
);

router.put(
  '/:eventId/entries/:entryId',
  [
    body('amount').optional().isNumeric(),
  ],
  updateEventEntry
);

export default router;
