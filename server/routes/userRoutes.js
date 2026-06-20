import express from "express";
import { getUser, updateUser, updatePassword } from "../controllers/userController.js";
import protect from "../middlewares/auth.js";

const router = express.Router();

router.get("/:id", protect, getUser);
router.put("/:id", protect, updateUser);
router.put("/:id/password", protect, updatePassword);

export default router;
