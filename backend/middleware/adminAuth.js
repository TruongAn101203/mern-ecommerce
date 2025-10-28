import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    console.log("\n===============================");
    console.log("🟢 ADMIN AUTH CHECK START");

    let token = req.headers['authorization'];
    console.log("🔹 Raw Authorization header:", token);

    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    if (!token) {
      console.log("❌ No token found in request headers");
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🧩 Decoded token:", decoded);

    if (!decoded.isAdmin) {
      console.log("❌ Token does not belong to admin user");
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    req.user = decoded;
    console.log("✅ ADMIN AUTH SUCCESS, continuing to controller...");
    console.log("===============================\n");

    next();
  } catch (error) {
    console.error("❌ Admin Auth Error:", error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export default adminAuth;
