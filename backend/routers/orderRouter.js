import express from "express";
import { allOrders, placeOrder, placeOrderVnpay, userOrders, updateStatus } from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";


const orderRouter = express.Router()
orderRouter.post('/list', adminAuth,allOrders )
orderRouter.post('/status', adminAuth,updateStatus )


orderRouter.post("/place",authUser, placeOrder);
orderRouter.post("/vnpay",authUser, placeOrderVnpay);

orderRouter.post("/userorders",authUser, userOrders);

export default orderRouter;
