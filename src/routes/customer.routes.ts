import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireEmailVerification } from "../middlewares/verifyEmail.middleware";
import { customerLimiter } from "../middlewares/rateLimiter.middleware";
import { upload } from "../utils/multer.util";

const router = Router();
const customerController = new CustomerController();

router.use(authenticateToken);
router.use(requireEmailVerification);

router.post("/create-customer",customerLimiter,customerController.submitCustomer);
router.get("/", customerController.getCustomer);
router.get("/:customerId", customerController.getCustomerById);
router.delete("/delete-customer/:customerId", customerController.deleteCustomer);

export default router;
