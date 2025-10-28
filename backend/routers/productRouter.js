import express from "express";
import { addProduct, listProducts, removeProduct, singleProduct, updateProduct } from "../controllers/productController.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";

const router = express.Router(); // ✅ BẮT BUỘC phải có dòng này!

// Routes
router.post("/add", adminAuth, express.json(), addProduct);
router.get("/list", listProducts);
router.post("/remove", adminAuth, removeProduct);
router.post("/single", singleProduct);
router.put("/update/:id", adminAuth, upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
]), updateProduct);

export default router;
