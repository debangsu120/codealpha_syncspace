import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/FadeIn";
import { useState } from "react";
import { Lock, Users, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/meetings/create")({
  head: () => ({
    meta: [
      { title: "Create Meeting — SyncSpace" },
      { name: "description", content: "Spin up a new meeting room in seconds." },
    ],
  }),
  component: CreateMeeting,
});

function CreateMeeting() {
  const [name, setName] = useState("");
  const [isPrivate, setPrivate] = useState(true);
  const [password, setPassword] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("4");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.post("/api/rooms", {
        name: name || "Untitled Room",
        isPrivate,
        password: isPrivate ? password : undefined,
      });

      toast.success("Room created successfully");
      navigate({ to: "/room", search: { id: data.room.id, code: data.room.code } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      toast.error(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(50% 35% at 50% 0%, rgba(110,235,131,0.10), transparent 70%)",
          }}
        />
        <FadeIn className="w-full max-w-[560px]">
          <div className="glass rounded-[24px] p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> New room
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create a meeting</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Set up your room. You can change these later.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <Field label="Room name">
                <input
                  className="input"
                  placeholder="Design Sync · Week 24"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Private room</p>
                    <p className="text-xs text-muted-foreground">Only invited people can join</p>
                  </div>
                </div>
                <Toggle on={isPrivate} onChange={setPrivate} />
              </div>

              {isPrivate && (
                <Field label="Password">
                  <input
                    type="password"
                    className="input"
                    placeholder="Set a room password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isPrivate}
                  />
                </Field>
              )}

              <Field label="Maximum participants">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    className="input pl-9 appearance-none"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  >
                    <option value="4">4 participants</option>
                    <option value="8">8 participants</option>
                    <option value="16">16 participants</option>
                    <option value="32">32 participants</option>
                    <option value="0">Unlimited</option>
                  </select>
                </div>
              </Field>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Room"}
                </button>
                <Link
                  to="/dashboard"
                  className="flex-1 rounded-xl border border-border bg-card/60 py-2.5 text-center text-sm font-medium hover:border-primary/40"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </FadeIn>
      </div>
      <style>{`
        .input{ width:100%; border-radius:12px; border:1px solid var(--border); background:rgba(17,24,39,0.7); padding:10px 14px; font-size:14px; color: var(--foreground); outline:none; transition:border-color .2s, box-shadow .2s; }
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

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${on ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
