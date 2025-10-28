import express from "express";
import {
  allOrders,
  placeOrder,
  placeOrderVnpay,
  userOrders,
  updateStatus
} from "../controllers/orderController.js";

import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// 🧭 Admin routes
orderRouter.get("/list", adminAuth, allOrders);
orderRouter.patch("/status", adminAuth, updateStatus);

// 🛒 User routes
orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/vnpay", authUser, placeOrderVnpay);
orderRouter.get("/userorders", authUser, userOrders);

export default orderRouter;
