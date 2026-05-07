import { Router } from "express";
import { getGroupImage, getParsedReceipt, createGroup, getGroupMembers, getReceiptData } from "../controllers/groupController";
const router = Router();

router.post('/', createGroup);
router.post('/image', getGroupImage);
router.post('/receipt-parse', getParsedReceipt);
router.post('/members', getGroupMembers);
router.post('/receipt-data', getReceiptData);

export default router;
