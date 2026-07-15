import express from "express";

import { addPet,getMyPets,getPetById,updatePet, } from "../controllers/petController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("owner"), addPet);
router.get("/", protect, authorize("owner"), getMyPets);
router.get("/:id",protect,authorize("owner"),getPetById);
router.put("/:id",protect,authorize("owner"),updatePet);


export default router;