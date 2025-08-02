import { Router } from "express";
import { ItemController } from "../controllers/item.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { PaymentController } from '../controllers/payment.controler';


const router = Router();
const controller = new PaymentController();
router.use(authenticateToken);

router.post('/payment', controller.makePayment);
router.get('/payment/:itemId', controller.getPaymentHistory);

export default router;