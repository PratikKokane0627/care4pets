import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createProduct, getAllProducts,
} from "../controllers/productController.js";


const router = express.Router();

router.get("/",getAllProducts);
router.post("/",protect,authorize("admin"),createProduct);


export default router;