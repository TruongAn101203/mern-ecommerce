import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 8000

// ⚙️ Cấu hình CORS nên đặt ngay sau khi khởi tạo app
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mern-ecommerce-frontend-eight-bay.vercel.app',
  'https://mern-ecommerce-admin-amber.vercel.app',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.get('/', (req, res) => {
  res.status(200).send('API is running...')
})

app.listen(port, () => console.log(`✅ Server running on port ${port}`))