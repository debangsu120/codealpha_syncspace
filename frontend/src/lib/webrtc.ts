import { useRef, useCallback, useEffect, useState } from "react";
import {
  getSocket,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  sendScreenShareStarted,
  sendScreenShareEnded,
} from "@/lib/socket";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface RemoteStream {
  stream: MediaStream;
  userId: string;
  name: string;
}

export function useWebRTC(
  roomId: string,
  localStream: MediaStream | null,
  participants: { userId: string; name: string; socketId?: string }[],
) {
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());

  const addRemoteStream = useCallback(
    (socketId: string, userId: string, name: string, stream: MediaStream) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(socketId, { stream, userId, name });
        return next;
      });
    },
    [],
  );

  const removeRemoteStream = useCallback((socketId: string) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (socketId: string, userId: string, name: string, initiator: boolean) => {
      const existing = pcsRef.current.get(socketId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcsRef.current.set(socketId, pc);

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          addRemoteStream(socketId, userId, name, stream);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(socketId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          pc.close();
          pcsRef.current.delete(socketId);
          removeRemoteStream(socketId);
        }
      };

      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              sendOffer(socketId, pc.localDescription);
            }
          })
          .catch((err) => console.error("Error creating offer:", err));
      }

      return pc;
    },
    [localStream, addRemoteStream, removeRemoteStream],
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOffer = async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const participant = participants.find((p) => p.socketId === from);
      const pc = createPeerConnection(
        from,
        participant?.userId || "",
        participant?.name || "",
        false,
      );
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendAnswer(from, pc.localDescription!);
    };

    const handleAnswer = async ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = pcsRef.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = pcsRef.current.get(from);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      const entry = Array.from(pcsRef.current.entries()).find(([sid]) => {
        const remote = remoteStreams.get(sid);
        return remote?.userId === userId;
      });
      if (entry) {
        const [socketId, pc] = entry;
        pc.close();
        pcsRef.current.delete(socketId);
        removeRemoteStream(socketId);
      }
    };

    const handleRoomParticipants = (
      existing: { userId: string; name: string; socketId: string }[],
    ) => {
      existing.forEach((p) => {
        if (p.socketId && !pcsRef.current.has(p.socketId)) {
          createPeerConnection(p.socketId, p.userId, p.name, true);
        }
      });
    };

    const handleUserJoined = ({
      userId,
      name,
      socketId,
    }: {
      userId: string;
      name: string;
      socketId: string;
    }) => {
      if (socketId && !pcsRef.current.has(socketId)) {
        createPeerConnection(socketId, userId, name, true);
      }
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("user_left", handleUserLeft);
    socket.on("user_joined", handleUserJoined);
    socket.on("room_participants", handleRoomParticipants);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("user_left", handleUserLeft);
      socket.off("user_joined", handleUserJoined);
      socket.off("room_participants", handleRoomParticipants);
    };
  }, [participants, createPeerConnection, removeRemoteStream, remoteStreams]);

  useEffect(() => {
    const pcs = pcsRef.current;
    return () => {
      pcs.forEach((pc) => pc.close());
      pcs.clear();
    };
  }, []);

  useEffect(() => {
    if (!localStream) return;
    pcsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        const existing = senders.find((s) => s.track?.kind === track.kind);
        if (existing) {
          existing.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  const toggleAudio = useCallback(
    (enabled: boolean) => {
      localStream?.getAudioTracks().forEach((t) => {
        t.enabled = enabled;
      });
    },
    [localStream],
  );

  const toggleVideo = useCallback(
    (enabled: boolean) => {
      localStream?.getVideoTracks().forEach((t) => {
        t.enabled = enabled;
      });
    },
    [localStream],
  );

  const stopScreenShare = useCallback(async () => {
    if (!localStream) return;
    const cameraTrack = localStream.getVideoTracks()[0];

    pcsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    });

    if (roomId) sendScreenShareEnded(roomId);
  }, [localStream, roomId]);

  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      if (roomId) sendScreenShareStarted(roomId);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      return screenStream;
    } catch {
      return null;
    }
  }, [roomId, stopScreenShare]);

  return { remoteStreams, toggleAudio, toggleVideo, shareScreen, stopScreenShare };
}
