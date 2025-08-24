import { Router } from "express";
import { ItemController } from "../controllers/item.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { PaymentController } from '../controllers/payment.controler.js';


const router = Router();
const controller = new PaymentController();

// Public endpoint for interest calculation (no auth required)
router.post('/calculate-interest', controller.calculateInterest);

// Protected endpoints
router.use(authenticateToken);
router.post('/payment', controller.makePayment);
router.get('/payment/:itemId', controller.getPaymentHistory);
router.get('/interest-status/:itemId', controller.getCurrentInterestStatus);

export default router;