import File from "../models/File.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

function findRoomQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Room.findById(id);
  }
  return Room.findOne({ code: id });
}

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const room = await findRoomQuery(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isParticipant =
      room.ownerId.toString() === req.user._id.toString() ||
      room.participants.includes(req.user._id);

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to upload to this room" });
    }

    const file = await File.create({
      roomId: req.params.id,
      uploaderId: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileURL: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      file: {
        id: file._id,
        fileName: file.originalName,
        fileURL: file.fileURL,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedBy: req.user.name,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoomFiles = async (req, res) => {
  try {
    const room = await findRoomQuery(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const files = await File.find({ roomId: room._id })
      .populate("uploaderId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      files: files.map((f) => ({
        id: f._id,
        fileName: f.originalName,
        fileURL: f.fileURL,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        uploadedBy: f.uploaderId.name,
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(process.cwd(), "uploads", file.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { uploadFile, getRoomFiles, downloadFile };
