import { Router } from "express";
import { getGroupImage, getParsedReceipt, createGroup } from "../controllers/groupController";
const router = Router();

router.post('/', createGroup);
router.post('/image', getGroupImage);
router.post('/receipt-parse', getParsedReceipt);

export default router;
