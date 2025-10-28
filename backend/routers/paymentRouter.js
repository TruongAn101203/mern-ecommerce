import express from 'express';
import { createPaymentUrl, vnpayReturn } from '../controllers/paymentController.js';
import authUser from '../middleware/auth.js';

const router = express.Router();

// Create VNPAY payment URL (frontend calls this)
router.post('/create_payment_url', authUser, createPaymentUrl);
// Backwards/alternative route name used by some frontends
router.post('/create-vnpay-url', authUser, createPaymentUrl);

// VNPay will redirect back to this endpoint after payment
router.get('/vnpay_return', vnpayReturn);

export default router;
