import rateLimit from "express-rate-limit";

/**
 * Rate limiter for the Integration API write endpoints (POST / DELETE / PATCH).
 * Allows up to 60 write requests per 15-minute window per IP.
 */
export const integrationWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  }
});

/**
 * Rate limiter for the Integration API read endpoint (GET).
 * More generous – 300 requests per 15-minute window per IP.
 */
export const integrationReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  }
});
