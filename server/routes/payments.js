import { Router } from 'express';
import auth from '../middleware/auth.js';
import { listPayments, createPayment } from '../controllers/paymentsController.js';

const router = Router();

router.use(auth);

router.get('/', listPayments);
router.post('/', createPayment);

export default router;


