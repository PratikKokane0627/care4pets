import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { applyAsVet, createVet ,getAllVets, getVetById, getMyVetProfile, updateMyVetProfile, updateMyVetAvailability, uploadMyVetImage, deleteMyVetImage, updateVet, uploadVetImage,updateAvailability,getAvailability,} from "../controllers/vetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get('/', getAllVets);
router.post("/apply", applyAsVet);
router.post("/", protect, authorize("admin"), createVet);

router.get("/me", protect, authorize("vet"), getMyVetProfile);
router.put("/me", protect, authorize("vet"), updateMyVetProfile);
router.put("/me/availability", protect, authorize("vet"), updateMyVetAvailability);
router.put("/me/image", protect, authorize("vet"), upload.single("image"), uploadMyVetImage);
router.delete("/me/image", protect, authorize("vet"), deleteMyVetImage);

router.put("/:id/image",protect,authorize("vet", "admin"),upload.single("image"),uploadVetImage);

router.get("/:id", getVetById);
router.put("/:id",protect, authorize("vet", "admin"), updateVet);
router.put("/:id/availability",protect,authorize("vet","admin"),updateAvailability);
router.get("/:id/availability",getAvailability);


export default router;
