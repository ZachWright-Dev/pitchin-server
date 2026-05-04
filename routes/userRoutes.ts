import { Router } from 'express';
import { getUserImage, getGroupOverview } from '../controllers/userController';

const router = Router();
router.post('/image', getUserImage);
router.post('/group-overview', getGroupOverview);

export default router;
