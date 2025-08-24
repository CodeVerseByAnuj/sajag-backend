import { Router } from "express";
import { ItemController } from "../controllers/item.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();
const controller = new ItemController();
router.use(authenticateToken);

router.post("/add-item", controller.createItem);
router.get("/get-items", controller.getItems);
router.get("/get-item/:itemId", controller.getItemById);
router.delete("/delete-item/:itemId", controller.deleteItem);

export default router;
