import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket: Socket | null = null;
let reconnectToastId: string | number | undefined;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    if (reconnectToastId !== undefined) {
      toast.success("Reconnected to server", { id: reconnectToastId });
      reconnectToastId = undefined;
    }
  });

  socket.on("connect_error", (err: Error) => {
    console.error("Socket connection error:", err.message);
    if (err.message.includes("jwt")) {
      toast.error("Session expired. Please log in again.");
    }
  });

  socket.on("disconnect", (reason: string) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      toast.error("Disconnected by server");
    } else if (reason !== "io client disconnect") {
      reconnectToastId = toast.loading("Reconnecting...");
    }
  });

  socket.io.on("reconnect_attempt", (attempt: number) => {
    console.log(`Reconnection attempt ${attempt}`);
  });

  socket.io.on("reconnect_failed", () => {
    toast.error("Could not reconnect. Please refresh the page.");
    reconnectToastId = undefined;
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string) => {
  socket?.emit("join_room", roomId);
};

export const leaveRoom = (roomId: string) => {
  socket?.emit("leave_room", roomId);
};

export const sendMessage = (roomId: string, message: string) => {
  socket?.emit("chat_message", { roomId, message });
};

export const sendDrawingEvent = (roomId: string, strokeData: unknown) => {
  socket?.emit("drawing_event", { roomId, strokeData });
};

export const sendClearBoard = (roomId: string) => {
  socket?.emit("clear_board", roomId);
};

export const sendOffer = (to: string, offer: RTCSessionDescriptionInit) => {
  socket?.emit("offer", { to, offer });
};

export const sendAnswer = (to: string, answer: RTCSessionDescriptionInit) => {
  socket?.emit("answer", { to, answer });
};

export const sendIceCandidate = (to: string, candidate: RTCIceCandidateInit) => {
  socket?.emit("ice_candidate", { to, candidate });
};

export const sendScreenShareStarted = (roomId: string) => {
  socket?.emit("screen_share_started", roomId);
};

export const sendScreenShareEnded = (roomId: string) => {
  socket?.emit("screen_share_ended", roomId);
};

export const sendFileShared = (roomId: string, fileData: Record<string, unknown>) => {
  socket?.emit("file_shared", { roomId, fileData });
};
