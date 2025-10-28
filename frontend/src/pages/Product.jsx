import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, cartItems = {}, backendUrl } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  const buildSrc = (path) => {
    if (!path) return '';
    try {
      if (/^https?:\/\//i.test(path)) return path;
    } catch (e) {}
    const normalized = String(path).replace(/\\\\/g, '/').replace(/^\//, '');
    const base = (backendUrl || 'http://localhost:8000').replace(/\/$/, '');
    return `${base}/${normalized}`;
  };

  const fetchProductData = () => {
    const foundProduct = products.find((item) => item._id === productId);
    if (foundProduct) {
      setProductData(foundProduct);
      setImage(buildSrc(foundProduct.image && foundProduct.image[0] ? foundProduct.image[0] : ''));
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [products, productId]);

  if (!productData) {
    return <div className="flex justify-center items-center h-64">Loading product...</div>;
  }

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Product section */}
      <div className="flex flex-row gap-8 max-w-6xl mx-auto w-full justify-center items-start">

        {/* Thumbnails (left) */}
        <div className="flex flex-col gap-3 w-[100px] h-[600px] overflow-y-auto items-center">
          {productData.image.map((img, index) => (
            <img
              key={index}
              src={buildSrc(img)}
              alt={`${productData.name} ${index + 1}`}
              className={`w-[90px] h-[110px] object-cover rounded-md cursor-pointer border-2 transition-all duration-300 ${
                selectedImageIndex === index
                  ? "border-blue-500 scale-105"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() => {
                setSelectedImageIndex(index);
                setImage(buildSrc(img));
              }}
            />
          ))}
        </div>

        {/* Main image (center) */}
        <div className="flex justify-center items-center flex-1">
          <img
            src={image}
            alt={productData.name}
            className="w-[400px] h-[600px] object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Product details (right) */}
        <div className="flex flex-col max-w-lg flex-1">
          <h1 className="text-3xl font-semibold mb-4">{productData.name}</h1>
          {productData.description && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Product Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{productData.description}</p>
            </div>
          )}

          <span className="text-2xl font-bold text-blue-600 mb-4">
            {currency}{productData.price}
          </span>

{/* Select Size */}
<div className="flex flex-col gap-4 my-8">
  <p>Select Size</p>
  <div className="flex gap-2 flex-wrap">
    {productData.sizes.map((item, index) => (
      <button
        key={index}
        type="button"
        onClick={() => {
          // Toggle selection LOCALLY (click selected => bỏ chọn). Không gọi addToCart ở đây.
          setSelectedSize(prev => (prev === item ? '' : item));
        }}
        className={`min-w-[50px] py-2 px-4 rounded-md font-medium transition-all duration-200 ${
          selectedSize === item
            ? 'bg-orange-500 text-white shadow-md transform scale-105'
            : 'bg-white border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
        }`}
      >
        {item}
      </button>
    ))}
  </div>
</div>

{/* Add to cart */}
<button
  onClick={() => {
    // Nếu chưa chọn size, báo lỗi (toast nằm trong ShopContext.addToCart cũng sẽ kiểm tra,
    // nhưng chúng ta có thể check nhanh ở đây để UX mượt).
    if (!selectedSize) {
      // Nếu muốn dùng toast từ ShopContext, import toast ở file này và dùng:
      // import { toast } from 'react-toastify';
      // toast.error('Vui lòng chọn kích thước');
      // hoặc gọi addToCart và để context báo lỗi:
      addToCart(productData._id, selectedSize);
      return;
    }
    // Gọi addToCart — giờ hàm sẽ chỉ **thêm/increment**, không xóa.
    addToCart(productData._id, selectedSize);
  }}
  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-300"
>
  Add to Cart
</button>

        </div>
      </div>

      {/* Description Section */}
      <div className="w-full max-w-6xl mt-20 px-4 mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Product Details</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {productData.description ? (
            <p className="text-gray-700 whitespace-pre-line">{productData.description}</p>
          ) : (
            <p className="text-gray-500">No description available for this product.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
