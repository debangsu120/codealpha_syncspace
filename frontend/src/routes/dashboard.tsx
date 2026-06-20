import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/FadeIn";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Video,
  Clock,
  FileText,
  Plus,
  LogIn,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  Search,
  Bell,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SyncSpace" },
      { name: "description", content: "Your meetings, rooms and activity at a glance." },
    ],
  }),
  component: Dashboard,
});

interface Room {
  _id: string;
  name: string;
  code: string;
  ownerId: { _id: string; name: string; email: string } | string;
  participants: string[];
  isPrivate: boolean;
  createdAt: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await api.get("/api/rooms");
        setRooms(data.rooms);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        toast.error("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getOwnerName = (ownerId: Room["ownerId"]) => {
    if (typeof ownerId === "object" && ownerId?.name) return ownerId.name;
    return "You";
  };

  const isOwner = (room: Room) => {
    if (!user) return false;
    if (typeof room.ownerId === "object") return room.ownerId._id === user.id;
    return room.ownerId === user.id;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back, <span className="text-primary">{user?.name || "User"}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground backdrop-blur-xl md:flex">
              <Search className="h-4 w-4" />
              <input
                placeholder="Search rooms, files…"
                className="w-56 bg-transparent outline-none placeholder:text-muted-foreground/70"
              />
              <kbd className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/60 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-400/30 to-violet-500/30 text-sm font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <FadeIn className="mb-8 grid gap-3 sm:grid-cols-3">
          <QuickAction to="/meetings/create" icon={Plus} label="Create Room" tone="primary" />
          <QuickAction to="/meetings/join" icon={LogIn} label="Join Room" />
          <QuickAction to="/meetings/create" icon={Calendar} label="Schedule Meeting" />
        </FadeIn>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Rooms", value: rooms.length.toString(), change: "Active", icon: Video },
            {
              label: "Your Rooms",
              value: rooms.filter(isOwner).length.toString(),
              change: "Created",
              icon: Clock,
            },
            {
              label: "Joined Rooms",
              value: rooms.filter((r) => !isOwner(r)).length.toString(),
              change: "Participating",
              icon: FileText,
            },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.05}>
              <div className="hover-lift rounded-[20px] border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <TrendingUp className="h-3 w-3" /> {s.change}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Rooms */}
        <FadeIn delay={0.1} className="mt-8">
          <div className="rounded-[20px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold">Your Rooms</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No rooms yet. Create your first room!
                </p>
                <Link
                  to="/meetings/create"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Create Room
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium">Room</th>
                      <th className="px-6 py-3 font-medium">Host</th>
                      <th className="px-6 py-3 font-medium">Code</th>
                      <th className="px-6 py-3 font-medium">Created</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr
                        key={room._id}
                        className="border-t border-border transition-colors hover:bg-surface/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">{room.name}</div>
                          {room.isPrivate && (
                            <span className="text-xs text-muted-foreground">Private</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {isOwner(room) ? "You" : getOwnerName(room.ownerId)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-surface px-2 py-1 rounded">
                            {room.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(room.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/room"
                            search={{ id: room._id, code: room.code }}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary"
                          >
                            Join
                          </Link>
                          <button className="ml-1 inline-grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </AppShell>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string;
  icon: typeof Plus;
  label: string;
  tone?: "primary";
}) {
  const base =
    "hover-lift flex items-center justify-between rounded-[20px] border p-5 text-left transition-all";
  return (
    <Link
      to={to as "/meetings/create"}
      className={
        tone === "primary"
          ? `${base} border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5`
          : `${base} border-border bg-card`
      }
    >
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Action</div>
        <div className="mt-1 text-lg font-semibold">{label}</div>
      </div>
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl ${
          tone === "primary" ? "bg-primary text-primary-foreground" : "bg-surface text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </Link>
  );
}
