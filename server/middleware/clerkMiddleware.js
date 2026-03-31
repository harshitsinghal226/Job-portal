import { clerk } from '../config/clerk.js';
import { User } from '../models/index.js';

export const protectUser = async (req, res, next) => {
  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Clerk
    try {
      const decoded = await clerk.verifyToken(token);

      if (!decoded) {
        console.error('Token verification failed: No decoded data');
        return res.status(401).json({
          success: false,
          message: "Invalid token"
        });
      }
      req.auth = { userId: decoded.sub };
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: error.message
      });
    }

    // Find user in our database
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please complete profile setup."
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
};
