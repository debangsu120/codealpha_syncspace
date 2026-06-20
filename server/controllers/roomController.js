import Room from "../models/Room.js";
import Message from "../models/Message.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

function findRoomQuery(id, selectFields = "") {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Room.findById(id).select(selectFields);
  }
  return Room.findOne({ code: id }).select(selectFields);
}

const createRoom = async (req, res) => {
  try {
    const { name, isPrivate, password } = req.body;

    const roomData = {
      name: name || "Untitled Room",
      ownerId: req.user._id,
      participants: [req.user._id],
      isPrivate: isPrivate || false,
    };

    if (isPrivate && password) {
      const salt = await bcrypt.genSalt(10);
      roomData.password = await bcrypt.hash(password, salt);
    }

    const room = await Room.create(roomData);

    res.status(201).json({
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        ownerId: room.ownerId,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { ownerId: req.user._id },
        { participants: req.user._id },
      ],
    })
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await findRoomQuery(req.params.id, "+password")
      .populate("ownerId", "name email")
      .populate("participants", "name email");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.isPrivate) {
      const { password } = req.query;
      if (!password) {
        return res.status(403).json({ message: "Password required", requiresPassword: true });
      }
      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) {
        return res.status(403).json({ message: "Incorrect password" });
      }
    }

    res.status(200).json({
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        ownerId: room.ownerId,
        participants: room.participants,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await findRoomQuery(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the host can end this meeting" });
    }

    await Room.findByIdAndDelete(room._id);
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const room = await findRoomQuery(req.params.id, "+password");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.isPrivate) {
      const { password } = req.body;
      if (!password) {
        return res.status(403).json({ message: "Password required" });
      }
      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) {
        return res.status(403).json({ message: "Incorrect password" });
      }
    }

    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }

    res.status(200).json({
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        ownerId: room.ownerId,
        isPrivate: room.isPrivate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const room = await findRoomQuery(req.params.id, "_id");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const { before, limit = 50 } = req.query;
    const query = { roomId: room._id };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate("senderId", "name email")
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createRoom, getRooms, getRoom, deleteRoom, joinRoom, getMessages };
