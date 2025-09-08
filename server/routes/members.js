import { Router } from 'express';
import auth from '../middleware/auth.js';
import { listMembers, createMember, getMember, updateMember, deleteMember, setSubscription } from '../controllers/membersController.js';

const router = Router();

router.use(auth);

router.get('/', listMembers);
router.post('/', createMember);
router.get('/:id', getMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);
router.post('/:id/subscription', setSubscription);

export default router;


