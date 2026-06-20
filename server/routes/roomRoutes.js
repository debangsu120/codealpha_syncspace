import express from "express";
import {
  createRoom,
  getRooms,
  getRoom,
  deleteRoom,
  joinRoom,
  getMessages,
} from "../controllers/roomController.js";
import protect from "../middlewares/auth.js";

const router = express.Router();

router.get("/", protect, getRooms);
router.post("/", protect, createRoom);
router.get("/:id", protect, getRoom);
router.delete("/:id", protect, deleteRoom);
router.post("/:id/join", protect, joinRoom);
router.get("/:id/messages", protect, getMessages);

export default router;
