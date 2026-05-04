import { Router } from 'express';
import { getUserImage } from '../controllers/userController';

const router = Router();
router.post('/image', getUserImage);

export default router;
