import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/FadeIn";
import {
  Palette,
  Bell,
  Mic,
  Volume2,
  Camera,
  Globe,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SyncSpace" },
      { name: "description", content: "Preferences for SyncSpace." },
    ],
  }),
  component: Settings,
});

function getTheme(): string {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("syncspace_theme") || "dark";
}

function setTheme(theme: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("syncspace_theme", theme);
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

function Settings() {
  const [open, setOpen] = useState<string | null>("appearance");

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
        <FadeIn>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tune SyncSpace to fit your workflow.</p>
        </FadeIn>

        <div className="mt-8 space-y-3">
          <FadeIn delay={0}>
            <SettingsSection
              id="appearance"
              icon={Palette}
              title="Appearance"
              desc="Theme and density."
              open={open}
              setOpen={setOpen}
            >
              <AppearanceSection />
            </SettingsSection>
          </FadeIn>
          <FadeIn delay={0.03}>
            <SettingsSection
              id="notifications"
              icon={Bell}
              title="Notifications"
              desc="What we ping you about."
              open={open}
              setOpen={setOpen}
            >
              <NotificationsSection />
            </SettingsSection>
          </FadeIn>
          <FadeIn delay={0.06}>
            <SettingsSection
              id="mic"
              icon={Mic}
              title="Microphone"
              desc="Default input and noise cancellation."
              open={open}
              setOpen={setOpen}
            >
              <DeviceSection
                label="Input device"
                options={["Default Microphone", "System Microphone"]}
              />
            </SettingsSection>
          </FadeIn>
          <FadeIn delay={0.09}>
            <SettingsSection
              id="speaker"
              icon={Volume2}
              title="Speaker"
              desc="Default output and volume."
              open={open}
              setOpen={setOpen}
            >
              <DeviceSection label="Output device" options={["Default Speaker", "System Output"]} />
            </SettingsSection>
          </FadeIn>
          <FadeIn delay={0.12}>
            <SettingsSection
              id="camera"
              icon={Camera}
              title="Camera"
              desc="Default video device and quality."
              open={open}
              setOpen={setOpen}
            >
              <DeviceSection label="Camera" options={["Default Camera", "FaceTime HD Camera"]} />
            </SettingsSection>
          </FadeIn>
          <FadeIn delay={0.15}>
            <SettingsSection
              id="language"
              icon={Globe}
              title="Language"
              desc="Interface language and region."
              open={open}
              setOpen={setOpen}
            >
              <DeviceSection
                label="Display language"
                options={[
                  "English (US)",
                  "English (UK)",
                  "Fran\u00e7ais",
                  "Deutsch",
                  "\u0939\u093f\u0928\u094d\u0926\u0940",
                ]}
              />
            </SettingsSection>
          </FadeIn>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsSection({
  id,
  icon: Icon,
  title,
  desc,
  open,
  setOpen,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  open: string | null;
  setOpen: (fn: (o: string | null) => string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      <button
        onClick={() => setOpen((o) => (o === id ? null : id))}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface/40"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open === id ? "rotate-180" : ""
          }`}
        />
      </button>
      {open === id && (
        <div className="border-t border-border bg-surface/30 px-5 py-5">{children}</div>
      )}
    </div>
  );
}

function AppearanceSection() {
  const [theme, setThemeState] = useState(getTheme);

  const handleTheme = (t: string) => {
    setThemeState(t);
    setTheme(t);
  };

  const themes = [
    { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { id: "light", label: "Light", icon: Sun, desc: "Bright and clear" },
    { id: "system", label: "System", icon: Monitor, desc: "Follows your OS" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => handleTheme(t.id)}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
            theme === t.id
              ? "border-primary/60 bg-primary/10"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <div
            className={`grid h-10 w-10 place-items-center rounded-xl ${
              theme === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{t.label}</p>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    meetingInvites: true,
    roomActivity: true,
    fileUploads: false,
    weeklyEmail: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const items: { key: keyof typeof prefs; label: string }[] = [
    { key: "meetingInvites", label: "New meeting invites" },
    { key: "roomActivity", label: "Room activity and mentions" },
    { key: "fileUploads", label: "File uploads in shared rooms" },
    { key: "weeklyEmail", label: "Weekly summary email" },
  ];

  return (
    <div className="space-y-3">
      {items.map((n) => (
        <Row key={n.key} label={n.label}>
          <Toggle on={prefs[n.key]} onClick={() => toggle(n.key)} />
        </Row>
      ))}
    </div>
  );
}

function DeviceSection({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="space-y-3">
      <Row label={label}>
        <select className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Row>
      <Row label="Test">
        <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40">
          Run test
        </button>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
