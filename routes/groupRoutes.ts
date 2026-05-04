import { Router } from "express";
import { getGroupImage } from "../controllers/groupController";
const router = Router();

router.post('/image', getGroupImage);

export default router;