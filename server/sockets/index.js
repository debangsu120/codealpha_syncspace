import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import env from "../config/env.js";

const onlineUsers = new Map();

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("User not found"));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    onlineUsers.set(socket.user._id.toString(), socket.id);

    socket.rooms.forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);

      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      const existingParticipants = [];
      if (roomSockets) {
        for (const sid of roomSockets) {
          if (sid === socket.id) continue;
          const s = io.sockets.sockets.get(sid);
          if (s?.user) {
            existingParticipants.push({
              userId: s.user._id.toString(),
              name: s.user.name,
              socketId: sid,
            });
          }
        }
      }

      socket.emit("room_participants", existingParticipants);

      socket.to(roomId).emit("user_joined", {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        socketId: socket.id,
      });
      console.log(`${socket.user.name} joined room: ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user_left", {
        userId: socket.user._id.toString(),
        name: socket.user.name,
      });
      console.log(`${socket.user.name} left room: ${roomId}`);
    });

    socket.on("chat_message", async ({ roomId, message }) => {
      try {
        const saved = await Message.create({
          roomId,
          senderId: socket.user._id,
          content: message,
        });

        const populated = await saved.populate("senderId", "name email");

        io.to(roomId).emit("chat_message", {
          userId: populated.senderId._id.toString(),
          name: populated.senderId.name,
          message: populated.content,
          timestamp: populated.createdAt.toISOString(),
          messageId: populated._id.toString(),
        });
      } catch (error) {
        console.error("Failed to save message:", error.message);
        socket.emit("chat_error", { message: "Failed to send message" });
      }
    });

    socket.on("drawing_event", ({ roomId, strokeData }) => {
      socket.to(roomId).emit("drawing_event", {
        userId: socket.user._id,
        strokeData,
      });
    });

    socket.on("clear_board", (roomId) => {
      socket.to(roomId).emit("clear_board");
    });

    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", {
        from: socket.id,
        offer,
      });
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", {
        from: socket.id,
        answer,
      });
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      io.to(to).emit("ice_candidate", {
        from: socket.id,
        candidate,
      });
    });

    socket.on("screen_share_started", (roomId) => {
      socket.to(roomId).emit("screen_share_started", {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on("screen_share_ended", (roomId) => {
      socket.to(roomId).emit("screen_share_ended", {
        userId: socket.user._id,
      });
    });

    socket.on("file_shared", ({ roomId, fileData }) => {
      socket.to(roomId).emit("file_shared", {
        ...fileData,
        uploadedBy: socket.user.name,
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.user._id.toString());
      socket.rooms.forEach((roomId) => {
        if (roomId === socket.id) return;
        socket.to(roomId).emit("user_left", {
          userId: socket.user._id.toString(),
          name: socket.user.name,
        });
      });
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

export { initializeSocket, onlineUsers };
