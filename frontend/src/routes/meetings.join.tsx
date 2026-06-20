import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/FadeIn";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Video, Mic, ScreenShare } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/meetings/join")({
  head: () => ({
    meta: [
      { title: "Join Meeting — SyncSpace" },
      { name: "description", content: "Enter a room code to join." },
    ],
  }),
  component: JoinMeeting,
});

function JoinMeeting() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter a room code");
      return;
    }

    setLoading(true);

    try {
      const data = await api.post(`/api/rooms/${code.trim()}/join`, {
        password: password || undefined,
      });

      toast.success("Joined room successfully");
      navigate({ to: "/room", search: { id: data.room.id, code: data.room.code } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join room");
      toast.error(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen px-6 py-12 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <div className="glass rounded-[24px] p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]">
              <p className="text-sm text-primary">Join a meeting</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Hop into a room
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the code your host shared with you.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <Field label="Room code">
                  <input
                    placeholder="DSN-204"
                    className="input tracking-[0.3em] uppercase text-center text-lg font-medium"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password (optional)">
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Joining..." : "Join meeting"}
                  {!loading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have a code?{" "}
                <Link to="/meetings/create" className="text-primary hover:underline">
                  Create a room
                </Link>
              </p>
            </div>
          </FadeIn>

          <Illustration />
        </div>
      </div>
      <style>{`
        .input{ width:100%; border-radius:12px; border:1px solid var(--border); background:rgba(17,24,39,0.7); padding:12px 14px; font-size:14px; color: var(--foreground); outline:none; transition:border-color .2s, box-shadow .2s; }
        .input:focus{ border-color: color-mix(in oklab, var(--primary) 60%, transparent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent); }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Illustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative hidden h-[460px] lg:block"
    >
      <div className="absolute -inset-10 -z-10 rounded-[60px] bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 blur-2xl" />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="glass-strong absolute left-6 top-6 w-56 rounded-[20px] p-4"
      >
        <div className="aspect-video rounded-xl bg-gradient-to-br from-rose-400/30 to-orange-400/20" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium">Heather R.</span>
          <Mic className="h-3.5 w-3.5 text-primary" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="glass-strong absolute right-2 top-24 w-64 rounded-[20px] p-4"
      >
        <div className="aspect-video rounded-xl bg-gradient-to-br from-amber-300/30 to-yellow-500/20" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium">Gerald J.</span>
          <ScreenShare className="h-3.5 w-3.5 text-primary" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="glass-strong absolute bottom-6 left-20 w-72 rounded-[20px] p-4"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Video className="h-3.5 w-3.5 text-primary" /> Design Sync · DSN-204
        </div>
        <div className="mt-2 text-sm font-medium">4 people are waiting</div>
        <div className="mt-3 flex -space-x-2">
          {[
            "from-rose-400/40 to-orange-400/40",
            "from-amber-300/40 to-yellow-500/40",
            "from-emerald-400/40 to-teal-400/40",
            "from-indigo-400/40 to-violet-500/40",
          ].map((c, i) => (
            <div
              key={i}
              className={`h-7 w-7 rounded-full border-2 border-card bg-gradient-to-br ${c}`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
