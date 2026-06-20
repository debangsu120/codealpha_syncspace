import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/FadeIn";
import {
  Video,
  FileText,
  PenTool,
  MessageSquare,
  Camera,
  KeyRound,
  Loader2,
  Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — SyncSpace" },
      { name: "description", content: "Manage your SyncSpace profile." },
    ],
  }),
  component: Profile,
});

const activity = [
  { icon: Video, title: "Joined a meeting", time: "Recently" },
  { icon: FileText, title: "Uploaded a file", time: "Yesterday" },
  { icon: PenTool, title: "Used the whiteboard", time: "2 days ago" },
  { icon: MessageSquare, title: "Sent a message", time: "3 days ago" },
];

function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put(`/api/users/${user.id}`, { name, email });
      setSaveMsg("Profile updated");
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setChangingPw(true);
    setPwMsg("");
    try {
      await api.put(`/api/users/${user.id}/password`, { currentPassword, newPassword });
      setPwMsg("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      setPwMsg(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setChangingPw(false);
    }
  };

  const getInitials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        <FadeIn>
          <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-8">
            <div
              className="absolute inset-0 -z-10 opacity-60"
              style={{ background: "var(--gradient-radial)" }}
            />
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative">
                <div className="grid h-24 w-24 place-items-center rounded-[20px] bg-gradient-to-br from-primary/40 to-indigo-500/40 text-3xl font-bold">
                  {user ? getInitials(user.name) : "?"}
                </div>
                <button className="absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground hover:bg-primary/90">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">{user?.name || "Loading..."}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <FadeIn delay={0.05}>
            <div className="rounded-[20px] border border-border bg-card p-6">
              <h2 className="font-semibold">Personal information</h2>
              <p className="text-xs text-muted-foreground">Update your account details.</p>
              <form onSubmit={handleUpdateProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                {saveMsg && (
                  <p
                    className={`sm:col-span-2 text-sm ${saveMsg.includes("updated") ? "text-primary" : "text-destructive"}`}
                  >
                    {saveMsg}
                  </p>
                )}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </FadeIn>

          <div className="space-y-6">
            <FadeIn delay={0.1}>
              <div className="rounded-[20px] border border-border bg-card p-6">
                <h2 className="font-semibold">Change password</h2>
                <p className="text-xs text-muted-foreground">Keep your account secure.</p>
                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                  <Field label="Current password">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </Field>
                  <Field label="New password">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      required
                      minLength={6}
                    />
                  </Field>
                  {pwMsg && (
                    <p
                      className={`text-sm ${pwMsg.includes("updated") ? "text-primary" : "text-destructive"}`}
                    >
                      {pwMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={changingPw}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm hover:border-primary/40 disabled:opacity-50"
                  >
                    {changingPw ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    {changingPw ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-[20px] border border-border bg-card p-6">
                <h2 className="font-semibold">Recent activity</h2>
                <p className="text-xs text-muted-foreground">Your recent actions.</p>
                <ol className="mt-6 space-y-5">
                  {activity.map((a, i) => (
                    <li key={i} className="relative flex gap-3 pl-2">
                      {i < activity.length - 1 && (
                        <span className="absolute left-[18px] top-9 h-full w-px bg-border" />
                      )}
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-primary">
                        <a.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
      <style>{`
        .input{ width:100%; border-radius:12px; border:1px solid var(--border); background:var(--card); padding:10px 14px; font-size:14px; color:var(--foreground); outline:none; transition:border-color .2s, box-shadow .2s; }
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
