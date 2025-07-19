import { Router } from "express";
import { ItemController } from "../controllers/item.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();
const controller = new ItemController();
router.use(authenticateToken);

router.post("/create-items", controller.createItem);
router.get("/get-items", controller.getItems);

export default router;
