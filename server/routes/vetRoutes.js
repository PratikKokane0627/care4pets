import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { createVet ,getAllVets, getVetById,updateVet, uploadVetImage,} from "../controllers/vetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get('/', getAllVets);
router.post("/", protect, authorize("admin"), createVet);


router.put("/:id/image",protect,authorize("vet", "admin"),upload.single("image"),uploadVetImage);

router.get("/:id", getVetById);
router.put("/:id",protect, authorize("vet", "admin"), updateVet);



export default router;