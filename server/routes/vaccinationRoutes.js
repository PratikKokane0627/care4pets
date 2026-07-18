import express from "express";
import { createVaccination,getMyVaccinations, } from "../controllers/vaccinationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),createVaccination);
router.get('/',protect,authorize("owner"),getMyVaccinations);

export default router;