import crypto from 'crypto';
import querystring from 'querystring';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js'; // ⚠️ nếu bạn có dùng userModel trong vnpayReturn

// Helper để sắp xếp key object
const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj).sort().forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
};

// =========================
// ✅ TẠO URL THANH TOÁN
// =========================
const createPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, bankCode = '', language = 'vn' } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    // Check required environment variables
    if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
      console.error('Missing VNP_TMN_CODE or VNP_HASH_SECRET environment variables');
      return res.status(500).json({ success: false, message: 'Payment configuration error' });
    }

    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnpTmnCode = process.env.VNP_TMN_CODE;
    const vnpHashSecret = process.env.VNP_HASH_SECRET;
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    const createDate = new Date();
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ensure amount is a valid number
    const finalAmount = Math.round(Number(order.amount) || 0);
    if (finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    // Format date in Vietnam timezone (GMT+7)
    const vietnamTime = new Date(createDate.getTime() + 7 * 60 * 60 * 1000);
    const dateFormat = 
      vietnamTime.getFullYear().toString() +
      ((vietnamTime.getMonth() + 1).toString().padStart(2, '0')) +
      vietnamTime.getDate().toString().padStart(2, '0') +
      vietnamTime.getHours().toString().padStart(2, '0') +
      vietnamTime.getMinutes().toString().padStart(2, '0') +
      vietnamTime.getSeconds().toString().padStart(2, '0');

    // Generate a unique TxnRef with timestamp
    const txnRef = `${orderId}_${dateFormat}`.substring(0, 50);

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpTmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: encodeURIComponent(`Thanh toan don hang ${orderId}`),
      vnp_OrderType: '200000',
      vnp_Amount: (finalAmount * 100).toString(),
      vnp_ReturnUrl: encodeURIComponent(`${process.env.FRONTEND_URL}/vnpay-return`),
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: dateFormat,
    };

    if (bankCode) vnp_Params.vnp_BankCode = bankCode;

    // Sort parameters before signing
    const sortedParams = sortObject(vnp_Params);
    
    // Create the signing data (must be sorted and properly encoded)
    let signData = '';
    const entries = Object.entries(sortedParams);
    entries.forEach(([key, value], index) => {
      signData += `${key}=${value}`;
      if (index < entries.length - 1) {
        signData += '&';
      }
    });

    // Create secure hash
    const hmac = crypto.createHmac('sha512', vnpHashSecret);
    const secured = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Build final URL (parameters must be properly encoded)
    let queryUrl = '';
    entries.forEach(([key, value], index) => {
      queryUrl += `${key}=${encodeURIComponent(value)}`;
      if (index < entries.length - 1) {
        queryUrl += '&';
      }
    });

    const paymentUrl = `${vnpUrl}?${queryUrl}&vnp_SecureHash=${secured}`;

    return res.json({ success: true, paymentUrl });
  } catch (error) {
    console.error('createPaymentUrl error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// ✅ XỬ LÝ KHI VNPAY TRẢ VỀ
// =========================
const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const vnpHashSecret = process.env.VNP_HASH_SECRET;
    const sorted = sortObject(vnp_Params);
    const signData = querystring.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const vnpRspCode = vnp_Params.vnp_ResponseCode;
    const txRef = vnp_Params.vnp_TxnRef;

    if (secureHash === signed) {
      const order = await orderModel.findById(txRef);
      if (order) {
        order.payment = vnpRspCode === '00';
        order.status = vnpRspCode === '00' ? 'Processing' : 'Payment Failed';
        await order.save();
      }

      const frontendUrl = process.env.FRONTEND_URL;
      return res.redirect(`${frontendUrl}/vnpay-return?vnp_ResponseCode=${vnpRspCode}&vnp_TxnRef=${txRef}`);
    } else {
      return res.status(400).send('Invalid signature');
    }
  } catch (error) {
    console.error('vnpayReturn error:', error);
    return res.status(500).send('Error handling VNPAY return');
  }
};

// ✅ EXPORT
export { createPaymentUrl, vnpayReturn };
