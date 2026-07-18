import express from "express";
import { createVaccination,getMyVaccinations,getVaccinationById, updateVaccination, } from "../controllers/vaccinationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),createVaccination);
router.get('/',protect,authorize("owner"),getMyVaccinations);

router.get("/:id",protect,authorize("owner"),getVaccinationById);
router.put("/:id",protect,authorize("owner"),updateVaccination);

export default router;