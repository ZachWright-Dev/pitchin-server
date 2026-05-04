import { Router } from 'express';
import { getDashboardInfo } from '../controllers/dashboardController';

const router = Router();

router.post('/', getDashboardInfo);

export default router;