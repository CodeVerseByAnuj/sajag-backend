import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authLimiter } from "../middlewares/rateLimiter.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();
const authController = new AuthController();

// Apply rate limiting to all auth routes
// router.use(authLimiter);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.get("/refresh-token",authenticateToken , authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/resend-verification", authController.resendVerification);

export default router;
