import rateLimit from "express-rate-limit";

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Strict limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});

// Form submission limiter
export const customerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 3 form submissions per hour
  message: "Too many form submissions, please try again later.",
});
