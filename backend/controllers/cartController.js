import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    const userId = req.user?.id;

    if (!userId || !itemId || !size) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    // Lấy thông tin sản phẩm
    const product = await productModel.findById(itemId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Khởi tạo cartData nếu chưa có
    if (!user.cartData) {
      user.cartData = {};
    }

    // Khởi tạo sản phẩm trong giỏ hàng nếu chưa có
    if (!user.cartData[itemId]) {
      user.cartData[itemId] = {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image[0],
          // Thêm các thông tin khác nếu cần
        },
        sizes: {}
      };
    }

    // Cập nhật số lượng cho size tương ứng
    if (!user.cartData[itemId].sizes[size]) {
      user.cartData[itemId].sizes[size] = 0;
    }
    user.cartData[itemId].sizes[size] += 1;

    // Đánh dấu là đã thay đổi để lưu vào database
    user.markModified('cartData');
    await user.save();

    res.json({ 
      success: true, 
      message: "Đã thêm vào giỏ hàng",
      cartData: user.cartData 
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Failed to add item to cart" });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCart = async (req, res) => {
  try {
    const { itemId, size, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId || !itemId || !size) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Khởi tạo cartData nếu chưa có
    if (!user.cartData) {
      user.cartData = {};
    }

    // Nếu số lượng <= 0, xóa sản phẩm
    if (quantity <= 0) {
      if (user.cartData[itemId]?.sizes?.[size]) {
        delete user.cartData[itemId].sizes[size];
        
        // Nếu không còn size nào, xóa luôn sản phẩm
        if (Object.keys(user.cartData[itemId].sizes).length === 0) {
          delete user.cartData[itemId];
        }
      }
    } else {
      // Cập nhật số lượng
      if (!user.cartData[itemId]) {
        // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
        const product = await productModel.findById(itemId);
        if (!product) {
          return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        
        user.cartData[itemId] = {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image[0],
          },
          sizes: {}
        };
      }
      
      if (!user.cartData[itemId].sizes) user.cartData[itemId].sizes = {};
      user.cartData[itemId].sizes[size] = quantity;
    }

    // Đánh dấu là đã thay đổi để lưu vào database
    user.markModified('cartData');
    await user.save();
    
    res.json({ 
      success: true, 
      message: "Cập nhật giỏ hàng thành công",
      cartData: user.cartData 
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi cập nhật giỏ hàng",
      error: error.message 
    });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    const userId = req.user?.id;

    if (!userId || !itemId || !size) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra xem sản phẩm có tồn tại trong giỏ hàng không
    if (user.cartData[itemId]?.[size]) {
      delete user.cartData[itemId][size];
      
      // Nếu không còn size nào cho sản phẩm này, xóa luôn itemId
      if (Object.keys(user.cartData[itemId]).length === 0) {
        delete user.cartData[itemId];
      }

      await user.save();
      return res.json({ 
        success: true, 
        message: "Đã xóa sản phẩm khỏi giỏ hàng",
        cartData: user.cartData
      });
    }

    res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng" });
  }
};

// Lấy giỏ hàng của người dùng
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log(`🔄 [getUserCart] Fetching cart for user: ${userId}`);
    
    if (!userId) {
      console.error("❌ [getUserCart] Missing user ID");
      return res.status(400).json({ success: false, message: "Thiếu thông tin người dùng" });
    }

    const user = await userModel.findById(userId).lean();
    if (!user) {
      console.error(`❌ [getUserCart] User not found: ${userId}`);
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Đảm bảo cartData tồn tại
    const cartData = user.cartData || {};
    console.log(`📦 [getUserCart] Raw cart data:`, JSON.stringify(cartData, null, 2));

    // Làm sạch dữ liệu cart
    const cleanedCartData = {};
    
    for (const [itemId, itemData] of Object.entries(cartData)) {
      if (!itemData || !itemData.sizes || Object.keys(itemData.sizes).length === 0) {
        console.log(`⚠️ [getUserCart] Skipping invalid cart item: ${itemId}`, itemData);
        continue;
      }
      
      // Đảm bảo mỗi item có đủ thông tin sản phẩm
      if (!itemData.product) {
        console.log(`⚠️ [getUserCart] Fetching missing product data for: ${itemId}`);
        try {
          const product = await productModel.findById(itemId).lean();
          if (product) {
            itemData.product = {
              _id: product._id,
              name: product.name,
              price: product.price,
              image: product.image?.[0] || ''
            };
          }
        } catch (err) {
          console.error(`❌ [getUserCart] Error fetching product ${itemId}:`, err);
          continue;
        }
      }
      
      // Chỉ giữ lại các size có số lượng > 0
      const validSizes = {};
      for (const [size, quantity] of Object.entries(itemData.sizes)) {
        if (quantity > 0) {
          validSizes[size] = quantity;
        }
      }
      
      if (Object.keys(validSizes).length > 0) {
        cleanedCartData[itemId] = {
          ...itemData,
          sizes: validSizes
        };
      }
    }

    console.log(`✅ [getUserCart] Returning cleaned cart data`);
    
    res.json({ 
      success: true, 
      cartData: cleanedCartData,
      message: "Lấy giỏ hàng thành công"
    });
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi lấy thông tin giỏ hàng",
      error: error.message 
    });
  }
};
