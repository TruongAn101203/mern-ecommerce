import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    let token = req.headers['authorization'];
    console.log('Headers:', req.headers);

    // Trường hợp có 'Bearer <token>'
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided, access denied',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra email + password trong token có khớp env không
    if (
      decoded.email !== process.env.ADMIN_EMAIL ||
      decoded.password !== process.env.ADMIN_PASSWORD
    ) {
      console.log('❌ Invalid admin credentials in token');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token, please login again',
    });
  }
};

export default adminAuth;
