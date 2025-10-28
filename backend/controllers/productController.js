import productModel from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";

// ============================
// ADD PRODUCT
// ============================
const addProduct = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.price) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    // Get images from request body
    let images = [];
    if (Array.isArray(req.body.images)) {
      images = req.body.images.filter(img => img); // Filter out any null/undefined
    }

    // Kiểm tra images có phải mảng hợp lệ không
    if (!Array.isArray(images) || images.length === 0) {
      
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    // ✅ Create new product
    const newProduct = new productModel({
      name: req.body.name,
      description: req.body.description || "",
      category: req.body.category || "Men",
      subCategory: req.body.subCategory || "Topwear",
      price: parseFloat(req.body.price) || 0,
      sizes: Array.isArray(req.body.sizes) ? req.body.sizes : (typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : []), 
      bestseller: req.body.bestseller === "true",
      // Lỗi nằm ở đây: Đã đổi 'images' thành 'image: images' để khớp với productModel.js
      image: images, // <-- ĐÃ SỬA: Đảm bảo tên trường là 'image' (số ít)
      date: Date.now(),
    });

    await newProduct.save();
    res.json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
};


// ============================
// LIST PRODUCTS
// ============================

const listProducts = async (req, res) => { 
  try {
    const products = await productModel.find({});
    // Thay đổi data: products thành products để khớp với frontend (List.jsx)
    res.json({ success: true, products }); 
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// ============================
// REMOVE PRODUCT
// ============================
const removeProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    await productModel.findByIdAndDelete(productId);
    res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to remove product" });
  }
};

// ============================
// SINGLE PRODUCT
// ============================
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// ============================
// UPDATE PRODUCT
// ============================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, subCategory, sizes, bestseller } =
      req.body;

    console.log("🟡 [PUT] Update request:", {
      id,
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      files: req.files ? Object.keys(req.files) : "No files",
    });

    let product = await productModel.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.sizes =
      typeof sizes === "string" ? JSON.parse(sizes) : sizes || product.sizes;
    product.bestseller = bestseller === "true";
    product.date = Date.now();
    
    // Logic cập nhật ảnh khi dùng multer (files)
    if (req.files) {
      const image1 = req.files.image1 ? req.files.image1[0]?.path : null;
      const image2 = req.files.image2 ? req.files.image2[0]?.path : null;
      const image3 = req.files.image3 ? req.files.image3[0]?.path : null;
      const image4 = req.files.image4 ? req.files.image4[0]?.path : null;

      const newImages = [...product.image];
      if (image1) newImages[0] = image1;
      if (image2) newImages[1] = image2;
      if (image3) newImages[2] = image3;
      if (image4) newImages[3] = image4;
      product.image = newImages.filter(img => img); // Lọc bỏ null
    } else if (req.body.image && Array.isArray(req.body.image)) {
        
        product.image = req.body.image.filter(img => img);
    }


    await product.save();
    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct };
