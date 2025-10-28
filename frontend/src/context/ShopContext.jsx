import { createContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const currency = "$";
  const delivery_fee = 10;
  // Ensure backend URL doesn't end with a trailing slash to avoid double // when building endpoints
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    // Load cart từ localStorage để tránh bị mất khi re-render
    const stored = localStorage.getItem("cartData");
    return stored ? JSON.parse(stored) : {};
  });
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const cartLoaded = useRef(false); // tránh double fetch từ Strict Mode

  // 🧺 Đồng bộ localStorage mỗi khi cartItems thay đổi
  useEffect(() => {
    localStorage.setItem("cartData", JSON.stringify(cartItems));
  }, [cartItems]);

  // 🛍 Fetch sản phẩm
  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    }
  };

  // 🧩 Fetch giỏ hàng từ server
  const getCartData = async () => {
    if (!token || cartLoaded.current) return;
    cartLoaded.current = true; // chặn gọi trùng

    console.log("🟡 [getCartData] Fetching cart with token:", token);
    try {
      const res = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          token: token,
        },
        withCredentials: true,
      });

      console.log("🔵 [getCartData] Server response:", res.data);

      if (res.data.success) {
        console.log("🟢 [getCartData] Setting cart data:", res.data.cartData);
        const cartData = res.data.cartData || {};
        console.log("📦 [getCartData] Cart data to set:", JSON.stringify(cartData, null, 2));
        setCartItems(cartData);
        
        // Log current state after setting
        setTimeout(() => {
          console.log("🔄 [getCartData] Current cartItems state:", cartItems);
        }, 1000);
      } else {
        console.error("🔴 [getCartData] Error from server:", res.data.message);
        toast.error(res.data.message || "Không thể tải giỏ hàng");
      }
    } catch (err) {
      console.error("🔴 Lỗi getCartData:", err.response?.data || err.message);
    }
  };


  const addToCart = async (itemId, size) => {
    if (!size) return toast.error("Vui lòng chọn kích thước");

    console.log("🛒 [addToCart] Starting to add item:", { itemId, size });
    console.log("📦 [addToCart] Current cartItems before update:", cartItems);

    const newCart = { ...cartItems };
    if (!newCart[itemId]) {
      console.log("➕ [addToCart] New item, initializing in cart");
      // Initialize with proper structure matching backend
      const product = products.find(p => p._id === itemId);
      if (!product) {
        console.error("Product not found:", itemId);
        return toast.error("Sản phẩm không tồn tại");
      }
      newCart[itemId] = {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image?.[0] || ''
        },
        sizes: {}
      };
    }
    
    // Ensure sizes object exists
    if (!newCart[itemId].sizes) {
      newCart[itemId].sizes = {};
    }
    
    // Update quantity for specific size
    const currentQty = newCart[itemId].sizes[size] || 0;
    newCart[itemId].sizes[size] = currentQty + 1;
    
    console.log("🔄 [addToCart] Updated cart before setState:", newCart);
    setCartItems(newCart);

    // Show success message
    toast.success("Đã thêm vào giỏ hàng");

    if (!token) {
      console.log("🔐 [addToCart] No token, saving to localStorage only");
      return toast.error("Vui lòng đăng nhập để lưu giỏ hàng");
    }

    try {
      console.log("📡 [addToCart] Sending to server...");
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        { itemId, size },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            token,
          },
          withCredentials: true,
        }
      );
      
      console.log("✅ [addToCart] Server response:", response.data);
      
      // Force refresh cart data from server
      console.log("🔄 [addToCart] Refreshing cart data from server...");
      await getCartData();
    } catch (error) {
      console.error("Error addToCart:", error.response?.data || error);
    }
  };


  const getCartAmount = () => {
    if (!cartItems) return 0;
    
    let total = 0;
    for (const itemId in cartItems) {
      const item = cartItems[itemId];
      if (item && item.product && item.sizes) {
        const product = products.find(p => p._id === itemId) || item.product;
        for (const size in item.sizes) {
          const quantity = parseInt(item.sizes[size]) || 0;
          total += (product.price || 0) * quantity;
        }
      }
    }
    console.log('💰 Cart total amount:', total);
    return total;
  };

  
  const getCartCount = () => {
    if (!cartItems) return 0;
    
    let count = 0;
    for (const itemId in cartItems) {
      const item = cartItems[itemId];
      if (item && item.sizes) {
        for (const size in item.sizes) {
          count += parseInt(item.sizes[size]) || 0;
        }
      }
    }
    console.log('🛒 Cart item count:', count);
    return count;
  };


  const updateQuantity = async (itemId, size, quantity) => {
    try {
      // Create a copy of current cart items
      const updatedCart = { ...cartItems };
      
      // If quantity is 0 or less, remove the item
      if (quantity <= 0) {
        if (updatedCart[itemId]?.sizes?.[size]) {
          delete updatedCart[itemId].sizes[size];
          
          // If no sizes left, remove the item completely
          if (Object.keys(updatedCart[itemId].sizes).length === 0) {
            delete updatedCart[itemId];
          }
        }
      } else {
        // Update quantity
        if (!updatedCart[itemId]) {
          updatedCart[itemId] = {
            product: products.find(p => p._id === itemId),
            sizes: {}
          };
        }
        updatedCart[itemId].sizes = {
          ...updatedCart[itemId].sizes,
          [size]: quantity
        };
      }
      
      // Update local state
      setCartItems(updatedCart);
      
      // Sync with server if authenticated
      if (token) {
        await axios.put(
          `${backendUrl}/api/cart/update`,
          { itemId, size, quantity },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'token': token
            }
          }
        );
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật giỏ hàng");
      // Revert to previous state on error
      setCartItems({ ...cartItems });
    }
  }
  const getUserCart = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'token': token
        }
      });
      
      if (response.data.success) {
        // Use cartData from response if available, otherwise use empty object
        const cartData = response.data.cartData || {};
        setCartItems(cartData);
      } else {
        console.error("Failed to load cart:", response.data.message);
        toast.error(response.data.message || "Không thể tải giỏ hàng");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  }


  
    useEffect(() => {
      getProductsData();
    }, []);

    useEffect(() => {
      if(!token && localStorage.getItem("token")){
        setToken(localStorage.getItem("token"));
        getUserCart( localStorage.getItem("token"));
      }
    }, []);



  const removeFromCart = async (itemId, size) => {
    const newCart = { ...cartItems };
    if (newCart[itemId]?.[size]) {
      delete newCart[itemId][size];
      // Remove the itemId if no sizes left
      if (Object.keys(newCart[itemId]).length === 0) {
        delete newCart[itemId];
      }
      setCartItems(newCart);

      if (token) {
        try {
          await axios.post(
            `${backendUrl}/api/cart/update`,
            { itemId, size, quantity: 0 }, // Set quantity to 0 to remove
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                token,
              },
            }
          );
        } catch (error) {
          console.error("Error removing from cart:", error);
          toast.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng");
        }
      }
    }
  };

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
  };

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
