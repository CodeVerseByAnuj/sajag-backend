import { Router } from "express";
import { FormController } from "../controllers/form.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireEmailVerification } from "../middlewares/verifyEmail.middleware";
import { formLimiter } from "../middlewares/rateLimiter.middleware";
import { upload } from "../utils/multer.util";

const router = Router();
const formController = new FormController();

// Apply authentication and email verification to all form routes
router.use(authenticateToken);
router.use(requireEmailVerification);

router.post(
  "/submit",
  formLimiter,
  upload.single("file"),
  formController.submitForm,
);
router.get("/", formController.getForm);
router.delete("/", formController.deleteForm);

export default router;
