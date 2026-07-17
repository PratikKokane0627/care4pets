import express from "express";

import { addPet,getMyPets,getPetById,updatePet,deletePet,uploadPetImage,getPetMedicalHistory, } from "../controllers/petController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("owner"), addPet);
router.get("/", protect, authorize("owner"), getMyPets);

router.put("/:id/image",protect,authorize("owner"),upload.single("image"),uploadPetImage);

router.get("/:id",protect,authorize("owner"),getPetById);
router.put("/:id",protect,authorize("owner"),updatePet);
router.delete("/:id",protect,authorize("owner"),deletePet);
router.get("/:id/medical-history",protect,authorize("owner", "vet", "admin"),getPetMedicalHistory);

export default router;