import express from 'express';
import { body } from 'express-validator';
import {
  createPerson,
  getPeople,
  getPersonById,
  updatePerson,
  deletePerson,
  searchPeople,
  mergePeople,
  splitPerson,
} from '../controllers/personController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('village').trim().notEmpty().withMessage('Village is required'),
    body('mobile').optional().trim(),
  ],
  createPerson
);

router.post('/merge', mergePeople);
router.get('/', getPeople);
router.get('/search', searchPeople);
router.get('/:id', getPersonById);
router.post('/:id/split', splitPerson);

router.put(
  '/:id',
  [
    body('name').optional().trim(),
    body('village').optional().trim(),
    body('mobile').optional().trim(),
  ],
  updatePerson
);

router.delete('/:id', deletePerson);

export default router;
