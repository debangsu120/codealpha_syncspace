import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MessageSquare,
  ScreenShare,
  PenTool,
  FileText,
  Circle,
  Settings,
  Phone,
  Signal,
  Users,
  Send,
  Plus,
  Pin,
  Loader2,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRoom } from "@/lib/room";
import { api } from "@/lib/api";
import { useWebRTC } from "@/lib/webrtc";
import {
  connectSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  getSocket,
} from "@/lib/socket";

export const Route = createFileRoute("/room")({
  head: () => ({
    meta: [
      { title: "Meeting Room — SyncSpace" },
      { name: "description", content: "Live meeting room." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
    code: (search.code as string) || "",
  }),
  component: Room,
});

interface ParticipantData {
  userId: string;
  name: string;
  socketId?: string;
}

interface MessageData {
  userId: string;
  name: string;
  message: string;
  timestamp: string;
  messageId?: string;
}

const HUES = [
  "from-rose-400/40 to-orange-400/30",
  "from-amber-300/40 to-yellow-500/30",
  "from-emerald-400/35 to-teal-400/30",
  "from-indigo-400/35 to-violet-500/30",
  "from-pink-400/35 to-rose-500/30",
  "from-cyan-400/35 to-blue-500/30",
];

function Room() {
  const { id, code } = Route.useSearch();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { setCurrentRoom, participants, addParticipant, removeParticipant, setParticipants } =
    useRoom();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomName, setRoomName] = useState("");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [tab, setTab] = useState<"chat" | "participants" | "files" | "whiteboard">("chat");
  const [showSidebar, setShowSidebar] = useState(true);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Acquire media and store in ref + state; stop tracks on unmount
  useEffect(() => {
    let mounted = true;
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
          setLocalStream(stream);
          toast.warning("Camera not available. Joining with audio only.");
        } catch {
          if (mounted) {
            localStreamRef.current = null;
            setLocalStream(null);
            toast.error("No camera or microphone detected. You can still chat.");
          }
        }
      }
    };
    getMedia();
    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  const { remoteStreams, toggleAudio, toggleVideo, shareScreen, stopScreenShare, cleanup } =
    useWebRTC(id || "", localStream, participants);

  useEffect(() => {
    if (!id || !token) {
      setError("No room ID provided");
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const data = await api.get(`/api/rooms/${id}`);
        setCurrentRoom(data.room);
        setRoomName(data.room.name);

        const history = await api.get(`/api/rooms/${id}/messages`);
        setMessages(
          history.messages.map(
            (m: {
              senderId: { _id: string; name: string };
              content: string;
              createdAt: string;
              _id: string;
            }) => ({
              userId: m.senderId._id,
              name: m.senderId.name,
              message: m.content,
              timestamp: m.createdAt,
              messageId: m._id,
            }),
          ),
        );

        const socket = connectSocket(token);

        socket.on("connect", () => {
          joinRoom(id);
        });

        if (socket.connected) {
          joinRoom(id);
        }

        socket.on("room_participants", (existing: ParticipantData[]) => {
          setParticipants([]);
          existing.forEach((p) => addParticipant(p));
          if (user) {
            addParticipant({ userId: user.id, name: user.name });
          }
        });

        socket.on("user_joined", ({ userId, name }: ParticipantData) => {
          addParticipant({ userId, name });
          toast.info(`${name} joined the room`);
        });

        socket.on("user_left", ({ userId }: { userId: string }) => {
          removeParticipant(userId);
        });

        socket.on("chat_message", (msg: MessageData) => {
          setMessages((prev) => {
            if (prev.some((m) => m.messageId === msg.messageId)) return prev;
            return [...prev, msg];
          });
        });

        setLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to join room";
        setError(msg);
        toast.error(msg);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (id) leaveRoom(id);
      const socket = getSocket();
      if (socket) {
        socket.off("connect");
        socket.off("room_participants");
        socket.off("user_joined");
        socket.off("user_left");
        socket.off("chat_message");
      }
    };
  }, [id, token, user, setCurrentRoom, addParticipant, removeParticipant, setParticipants]);

  const handleLeave = useCallback(() => {
    if (id) leaveRoom(id);
    // Stop all media tracks via ref (always current)
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    // Stop screen share tracks
    screenShareStream?.getTracks().forEach((t) => t.stop());
    setScreenShareStream(null);
    setSharing(false);
    cleanup();
    disconnectSocket();
    setCurrentRoom(null);
    setParticipants([]);
    navigate({ to: "/dashboard" });
  }, [id, navigate, setCurrentRoom, setParticipants, cleanup, screenShareStream]);

  const handleToggleShare = useCallback(async () => {
    if (sharing) {
      await stopScreenShare();
      setScreenShareStream(null);
      setSharing(false);
    } else {
      const stream = await shareScreen();
      if (stream) {
        setScreenShareStream(stream);
        setSharing(true);
        toast.success("Screen sharing started");
      } else {
        toast.error("Screen sharing was cancelled or failed");
      }
    }
  }, [sharing, shareScreen, stopScreenShare]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !id) return;
    sendMessage(id, messageInput.trim());
    setMessageInput("");
  };

  const handleToggleMic = useCallback(() => {
    if (!localStreamRef.current?.getAudioTracks().length) {
      toast.error("No microphone available");
      return;
    }
    setMic((v) => {
      const next = !v;
      toggleAudio(next);
      return next;
    });
  }, [toggleAudio]);

  const handleToggleCam = useCallback(() => {
    if (!localStreamRef.current?.getVideoTracks().length) {
      toast.error("No camera available");
      return;
    }
    setCam((v) => {
      const next = !v;
      toggleVideo(next);
      return next;
    });
  }, [toggleVideo]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getHue = (index: number) => HUES[index % HUES.length];

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allParticipants: {
    userId: string;
    name: string;
    me?: boolean;
    remoteStream?: MediaStream;
  }[] = [
    ...(user ? [{ userId: user.id, name: user.name, me: true }] : []),
    ...participants
      .filter((p) => p.userId !== user?.id)
      .map((p) => {
        const remote = Array.from(remoteStreams.values()).find((r) => r.userId === p.userId);
        return { ...p, remoteStream: remote?.stream };
      }),
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-surface/60 px-3 py-2 backdrop-blur-xl sm:px-5 sm:py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"
          >
            <span className="text-sm font-bold">S</span>
          </Link>
          <div>
            <h1 className="text-sm font-semibold">{roomName || "Room"}</h1>
            <p className="text-xs text-muted-foreground">
              {code} · {allParticipants.length} participant
              {allParticipants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-4 text-xs text-muted-foreground md:flex">
          {sharing && (
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-2 py-1 text-primary">
              <ScreenShare className="h-3.5 w-3.5" />
              <span>Sharing screen</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Signal className="h-3.5 w-3.5 text-primary" />
            <span>Connected</span>
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="inline-flex items-center gap-2 rounded-xl bg-destructive px-3.5 py-2 text-sm font-medium text-white hover:bg-destructive/90"
        >
          <Phone className="h-4 w-4 rotate-[135deg] hidden sm:inline" />
          <span className="hidden sm:inline">Leave</span>
          <Phone className="h-4 w-4 rotate-[135deg] sm:hidden" />
        </button>
      </header>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="relative flex-1 overflow-hidden">
          {sharing && screenShareStream ? (
            <div className="flex h-full flex-col">
              {/* Screen share takes full width */}
              <div className="flex-1 p-2 sm:p-4">
                <ScreenShareTile stream={screenShareStream} />
              </div>
              {/* Participants strip at bottom */}
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-surface/40 px-2 py-2 sm:px-4 sm:py-3">
                {allParticipants.map((p, i) => (
                  <div key={p.userId} className="h-20 w-28 shrink-0 sm:h-28 sm:w-40">
                    <Tile
                      name={p.name}
                      initials={getInitials(p.name)}
                      hue={getHue(i)}
                      myCam={p.me ? cam : true}
                      myMic={p.me ? mic : true}
                      me={p.me}
                      remoteStream={p.remoteStream}
                      localStream={p.me && localStream ? localStream : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid h-full gap-2 p-2 grid-cols-1 sm:gap-3 sm:grid-cols-2 sm:p-4">
              {allParticipants.map((p, i) => (
                <Tile
                  key={p.userId}
                  name={p.name}
                  initials={getInitials(p.name)}
                  hue={getHue(i)}
                  myCam={p.me ? cam : true}
                  myMic={p.me ? mic : true}
                  me={p.me}
                  remoteStream={p.remoteStream}
                  localStream={p.me && localStream ? localStream : undefined}
                />
              ))}
            </div>
          )}

          {/* Floating toolbar */}
          <FloatingToolbar
            mic={mic}
            cam={cam}
            sharing={sharing}
            onMic={handleToggleMic}
            onCam={handleToggleCam}
            onShare={handleToggleShare}
            onTab={(t) => {
              setTab(t);
              setShowSidebar(true);
            }}
            onLeave={handleLeave}
          />
        </div>

        {/* Sidebar — desktop: side panel, mobile: bottom sheet */}
        {/* Desktop sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hidden w-[340px] flex-col border-l border-border bg-surface/60 backdrop-blur-xl lg:flex"
            >
              <SidebarContent
                tab={tab}
                setTab={setTab}
                messages={messages}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                onSend={handleSendMessage}
                currentUserId={user?.id}
                allParticipants={allParticipants}
                roomId={id}
                onClose={() => setShowSidebar(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile sidebar — bottom sheet */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 z-30 flex h-[70vh] flex-col rounded-t-2xl border-t border-border bg-surface backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-center pt-2">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                tab={tab}
                setTab={setTab}
                messages={messages}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                onSend={handleSendMessage}
                currentUserId={user?.id}
                allParticipants={allParticipants}
                roomId={id}
                onClose={() => setShowSidebar(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SidebarContent({
  tab,
  setTab,
  messages,
  messageInput,
  setMessageInput,
  onSend,
  currentUserId,
  allParticipants,
  roomId,
  onClose,
}: {
  tab: "chat" | "participants" | "files" | "whiteboard";
  setTab: (t: "chat" | "participants" | "files" | "whiteboard") => void;
  messages: MessageData[];
  messageInput: string;
  setMessageInput: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  currentUserId?: string;
  allParticipants: { userId: string; name: string; me?: boolean; remoteStream?: MediaStream }[];
  roomId?: string;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        <div className="flex gap-1">
          {(["chat", "participants", "files", "whiteboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="hidden rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground lg:block"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "chat" && (
          <ChatPanel
            messages={messages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSend={onSend}
            currentUserId={currentUserId}
          />
        )}
        {tab === "participants" && <ParticipantsPanel participants={allParticipants} />}
        {tab === "files" && <FilesPanel roomId={roomId} />}
        {tab === "whiteboard" && <WhiteboardPanel roomId={roomId} />}
      </div>
    </>
  );
}

function Tile({
  name,
  initials,
  hue,
  myCam,
  myMic,
  me,
  remoteStream,
  localStream,
}: {
  name: string;
  initials: string;
  hue: string;
  myCam: boolean;
  myMic: boolean;
  me?: boolean;
  remoteStream?: MediaStream;
  localStream?: MediaStream;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const stream = me ? localStream : remoteStream;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [me, localStream, remoteStream]);

  const showVideo = me ? myCam : !!remoteStream;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-border bg-gradient-to-br ${hue}`}
    >
      {showVideo ? (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={me}
            className="h-full w-full object-contain"
          />
          {!me && !remoteStream && (
            <div className="absolute inset-0 grid place-items-center bg-surface/80">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-card/60 text-2xl font-semibold backdrop-blur-xl">
                {initials}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-surface/80">
          <div className="text-center">
            <VideoOff className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">Camera off</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-medium backdrop-blur-md sm:bottom-3 sm:left-3 sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-xs">
        {myMic ? (
          <Mic className="h-3 w-3 text-primary" />
        ) : (
          <MicOff className="h-3 w-3 text-destructive" />
        )}
        <span className="max-w-[80px] truncate">{name}</span>
        {me && <span className="text-muted-foreground">(you)</span>}
      </div>
      <button className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-lg bg-black/55 text-muted-foreground backdrop-blur-md hover:text-foreground sm:bottom-3 sm:right-3 sm:h-8 sm:w-8">
        <Pin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
}

function ScreenShareTile({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-border bg-black">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-contain" />
      <div className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
        <ScreenShare className="h-3.5 w-3.5" />
        Your screen
      </div>
    </div>
  );
}

function FloatingToolbar({
  mic,
  cam,
  sharing,
  onMic,
  onCam,
  onShare,
  onTab,
  onLeave,
}: {
  mic: boolean;
  cam: boolean;
  sharing: boolean;
  onMic: () => void;
  onCam: () => void;
  onShare: () => void;
  onTab: (t: "chat" | "participants" | "files" | "whiteboard") => void;
  onLeave: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 sm:bottom-5"
    >
      <div
        className="flex items-center gap-0.5 rounded-full border border-border p-1 shadow-2xl sm:gap-1 sm:p-1.5"
        style={{ background: "rgba(17,24,39,0.92)", backdropFilter: "blur(24px)" }}
      >
        <ToolBtn active={mic} onClick={onMic} title={mic ? "Mute" : "Unmute"} danger={!mic}>
          {mic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </ToolBtn>
        <ToolBtn
          active={cam}
          onClick={onCam}
          title={cam ? "Stop video" : "Start video"}
          danger={!cam}
        >
          {cam ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => onTab("chat")} title="Chat">
          <MessageSquare className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={onShare} title="Share screen" share={sharing}>
          <ScreenShare className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => onTab("whiteboard")} title="Whiteboard">
          <PenTool className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => onTab("files")} title="Files">
          <FileText className="h-4 w-4" />
        </ToolBtn>
        <span className="hidden sm:inline">
          <ToolBtn title="Record">
            <Circle className="h-4 w-4 text-destructive" />
          </ToolBtn>
          <ToolBtn title="Settings">
            <Settings className="h-4 w-4" />
          </ToolBtn>
        </span>
        <Divider />
        <button
          onClick={onLeave}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-destructive px-3 text-xs font-medium text-white transition-colors hover:bg-destructive/90 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Phone className="h-4 w-4 rotate-[135deg]" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </motion.div>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
  active = true,
  danger,
  share,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
  share?: boolean;
}) {
  const base =
    "grid h-9 w-9 place-items-center rounded-full transition-all duration-200 ease-out sm:h-10 sm:w-10";
  const cls = danger
    ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
    : share
      ? "bg-primary text-primary-foreground"
      : active
        ? "text-foreground hover:bg-card"
        : "text-muted-foreground hover:bg-card";
  return (
    <button onClick={onClick} title={title} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}
function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border sm:mx-1 sm:h-6" />;
}

function ChatPanel({
  messages,
  messageInput,
  setMessageInput,
  onSend,
  currentUserId,
}: {
  messages: MessageData[];
  messageInput: string;
  setMessageInput: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  currentUserId?: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getHue = (index: number) => HUES[index % HUES.length];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((m, i) => {
          const isMe = m.userId === currentUserId;
          return (
            <div key={i} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br ${getHue(i)} text-xs font-semibold`}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[78%] ${isMe ? "text-right" : ""}`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{m.name}</span>
                  <span>·</span>
                  <span>
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`mt-1 inline-block rounded-2xl px-3.5 py-2 text-sm ${
                    isMe ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  {m.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-border p-3">
        <form
          onSubmit={onSend}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
        >
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Send a message…"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button
            type="submit"
            className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ParticipantsPanel({
  participants,
}: {
  participants: { userId: string; name: string; me?: boolean }[];
}) {
  const getHue = (index: number) => HUES[index % HUES.length];

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="uppercase tracking-wider">In room · {participants.length}</span>
        <button className="inline-flex items-center gap-1 text-primary hover:underline">
          <Plus className="h-3 w-3" /> Invite
        </button>
      </div>
      <ul className="space-y-1">
        {participants.map((p, i) => (
          <li
            key={p.userId}
            className="flex items-center justify-between rounded-xl p-2 hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${getHue(i)} text-xs font-semibold`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {p.name} {p.me && <span className="text-xs text-muted-foreground">(you)</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mic className="h-3.5 w-3.5 text-primary" />
              <Users className="h-3.5 w-3.5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilesPanel({ roomId }: { roomId?: string }) {
  const [files, setFiles] = useState<
    {
      id: string;
      fileName: string;
      fileURL: string;
      fileSize: number;
      mimeType: string;
      uploadedBy: string;
      createdAt: string;
    }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roomId) return;
    api
      .get(`/api/files/${roomId}/files`)
      .then((data) => setFiles(data.files))
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleFileShared = (file: {
      id: string;
      fileName: string;
      fileURL: string;
      fileSize: number;
      mimeType: string;
      uploadedBy: string;
      createdAt: string;
    }) => {
      setFiles((prev) => {
        if (prev.some((f) => f.id === file.id)) return prev;
        return [file, ...prev];
      });
    };

    socket.on("file_shared", handleFileShared);
    return () => {
      socket.off("file_shared", handleFileShared);
    };
  }, [roomId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = typeof window !== "undefined" ? localStorage.getItem("syncspace_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/files/${roomId}/files`,
        {
          method: "POST",
          headers,
          body: formData,
        },
      );

      const data = await res.json();
      if (res.ok) {
        setFiles((prev) => [data.file, ...prev]);
      }
    } catch {
      // upload failed silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("sheet")) return "📊";
    if (mimeType.includes("zip")) return "📦";
    return "📎";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !roomId}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Upload file
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No files shared yet.</p>
        )}
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors hover:bg-card/50"
          >
            <span className="text-lg">{getFileIcon(f.mimeType)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(f.fileSize)} · {f.uploadedBy}
              </p>
            </div>
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${f.fileURL}`}
              download
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
              title="Download"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhiteboardPanel({ roomId }: { roomId?: string }) {
  return (
    <div className="p-4">
      <div className="grid-bg aspect-[4/5] rounded-xl border border-border bg-surface/40" />
      <Link
        to="/whiteboard"
        search={{ roomId }}
        className="mt-3 block rounded-xl bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open full whiteboard
      </Link>
    </div>
  );
}
