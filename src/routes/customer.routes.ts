import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireEmailVerification } from "../middlewares/verifyEmail.middleware.js";
import { customerLimiter } from "../middlewares/rateLimiter.middleware.js";
import { upload } from "../utils/multer.util.js";

const router = Router();
const customerController = new CustomerController();

router.use(authenticateToken);
router.use(requireEmailVerification);

router.post("/create-customer",customerController.submitCustomer);
router.get("/", customerController.getCustomer);
router.get("/:customerId", customerController.getCustomerById);
router.delete("/delete-customer/:customerId", customerController.deleteCustomer);

export default router;
