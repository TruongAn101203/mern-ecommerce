import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routers/userRouter.js'
import productRouter from './routers/productRouter.js'
import cartRouter from './routers/cartRoute.js'
import orderRouter from './routers/orderRouter.js'
import paymentRouter from './routers/paymentRouter.js'

const app = express()

// ✅ Kết nối database & cloudinary
connectDB()
connectCloudinary()

// ✅ Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mern-ecommerce-frontend-eight-bay.vercel.app',
  'https://mern-ecommerce-admin-amber.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  optionsSuccessStatus: 204
}));

// ✅ Static + API
app.use('/uploads', express.static('uploads'))
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/payment', paymentRouter)

app.get('/', (req, res) => {
  res.status(200).send('API is running...')
})

app.listen(port, () => console.log(`✅ Server running on port ${port}`))