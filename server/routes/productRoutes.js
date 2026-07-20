import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createProduct, getAllProducts,getProductById, updateProduct, deleteProduct,uploadProductImages,deleteProductImage,updateProductStock, getProductDashboard,
} from "../controllers/productController.js";


const router = express.Router();

router.get("/",getAllProducts);
router.post("/",protect,authorize("admin"),createProduct);
router.get("/admin/dashboard",protect,authorize("admin"),getProductDashboard);

router.post("/:id/images", protect,authorize("admin"),upload.array("images", 5),uploadProductImages);
router.delete("/:id/images",protect,authorize("admin"),deleteProductImage);
router.patch("/:id/stock",protect,authorize("admin"), updateProductStock);
router.get("/:id", getProductById);
router.put("/:id",protect,authorize("admin"),updateProduct);
router.delete("/:id",protect,authorize("admin"),deleteProduct);


export default router;