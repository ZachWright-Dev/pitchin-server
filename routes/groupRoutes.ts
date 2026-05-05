import { Router } from "express";
import { getGroupImage, getParsedReceipt } from "../controllers/groupController";
const router = Router();

router.post('/image', getGroupImage);
router.post('/receipt-parse', getParsedReceipt);

export default router;
