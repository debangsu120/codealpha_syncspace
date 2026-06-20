import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Participant {
  userId: string;
  name: string;
  socketId?: string;
}

interface RoomData {
  id: string;
  name: string;
  code: string;
  ownerId: string | { _id: string; name: string; email: string };
  isPrivate: boolean;
  participants: Participant[];
}

interface RoomContextType {
  currentRoom: RoomData | null;
  participants: Participant[];
  setCurrentRoom: (room: RoomData | null) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  setParticipants: (participants: Participant[]) => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const addParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => {
      if (prev.find((p) => p.userId === participant.userId)) return prev;
      return [...prev, participant];
    });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        participants,
        setCurrentRoom,
        addParticipant,
        removeParticipant,
        setParticipants,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
