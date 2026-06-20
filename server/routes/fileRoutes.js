import express from "express";
import { uploadFile, getRoomFiles, downloadFile } from "../controllers/fileController.js";
import protect from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/:id/files", protect, upload.single("file"), uploadFile);
router.get("/:id/files", protect, getRoomFiles);
router.get("/download/:fileId", protect, downloadFile);

export default router;
