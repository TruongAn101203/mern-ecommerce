import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// ⚙️ Cấu hình Cloudinary với .env
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ⚙️ Thiết lập CloudinaryStorage để multer upload trực tiếp lên cloud
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mern-ecommerce', // 📁 thư mục trong Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto' }], // tuỳ chọn: nén ảnh nhẹ
  },
});

const upload = multer({ storage });

export default upload;
