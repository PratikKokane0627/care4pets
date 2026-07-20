import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createProduct, getAllProducts,getProductById,
} from "../controllers/productController.js";


const router = express.Router();

router.get("/",getAllProducts);
router.post("/",protect,authorize("admin"),createProduct);

router.get("/:id", getProductById);


export default router;