import express from "express";

import { addPet,getMyPets,getPetById, } from "../controllers/petController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("owner"), addPet);
router.get("/", protect, authorize("owner"), getMyPets);
router.get("/:id",protect,authorize("owner"),getPetById);

export default router;