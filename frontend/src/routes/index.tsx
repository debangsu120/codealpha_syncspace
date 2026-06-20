import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Video,
  MessageSquare,
  PenTool,
  FileText,
  Mic,
  MicOff,
  Phone,
  ScreenShare,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SyncSpace — Collaborate Together. Meet Smarter." },
      {
        name: "description",
        content:
          "Premium video calls, whiteboards, chat and file sharing in one place. Built for modern teams.",
      },
      { property: "og:title", content: "SyncSpace — Collaborate Together. Meet Smarter." },
      {
        property: "og:description",
        content: "Video calls, whiteboards, chat and file sharing in one premium platform.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background flourishes */}
      <div className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-40" />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 10%, rgba(110,235,131,0.10), transparent 60%), radial-gradient(50% 40% at 85% 80%, rgba(99,102,241,0.08), transparent 60%)",
        }}
      />

      <Header />

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-xl">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-2.5 w-2.5" />
              </span>
              v2.0 — Now with AI meeting notes
            </div>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Collaborate <span className="text-primary">Together.</span>
              <br />
              Meet Smarter.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Video calls, whiteboards, chat and file sharing in one place. Built for teams that ship.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-12px_rgba(110,235,131,0.7)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Start Meeting
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
              >
                <Play className="h-4 w-4" /> Watch Demo
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <span>Trusted by teams at</span>
              {["Vercel", "Linear", "Stripe", "Notion", "Figma"].map((b) => (
                <span key={b} className="font-medium tracking-wide text-foreground/70">
                  {b}
                </span>
              ))}
            </div>
          </motion.div>

          <HeroMockup />
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything your team needs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A single workspace for meetings, brainstorms and async work.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Video, title: "HD Video Calls", desc: "Crystal clear meetings with active speaker focus." },
            { icon: PenTool, title: "Whiteboard", desc: "Sketch ideas together on an infinite canvas." },
            { icon: MessageSquare, title: "Live Chat", desc: "Threaded messages, reactions and code blocks." },
            { icon: FileText, title: "Shared Files", desc: "Drag, drop, share. Versioned by default." },
          ].map((f) => (
            <div
              key={f.title}
              className="hover-lift rounded-[20px] border border-border bg-card p-6"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="text-[10px] font-bold">S</span>
            </div>
            <span>SyncSpace</span>
          </div>
          <div>© 2026 SyncSpace. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-sm font-bold">S</span>
          </div>
          <span className="font-semibold tracking-tight">SyncSpace</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#demo" className="hover:text-foreground">Product</a>
          <a href="#demo" className="hover:text-foreground">Features</a>
          <a href="#demo" className="hover:text-foreground">Pricing</a>
          <a href="#demo" className="hover:text-foreground">Changelog</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroMockup() {
  const tiles = [
    { name: "Heather", initials: "HR", hue: "from-rose-400/30 to-orange-400/20", speaking: true },
    { name: "Gerald", initials: "GJ", hue: "from-amber-300/30 to-yellow-500/20" },
    { name: "Mira", initials: "MK", hue: "from-emerald-400/25 to-teal-400/20" },
    { name: "Debangsu", initials: "D", hue: "from-indigo-400/25 to-violet-500/20" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative"
    >
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-primary/10 via-transparent to-indigo-500/10 blur-2xl" />
      <div className="glass-strong overflow-hidden rounded-[24px] shadow-2xl">
        {/* macOS chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-muted-foreground">SyncSpace · Design Sync</span>
        </div>
        {/* video grid */}
        <div className="grid grid-cols-2 gap-3 p-3">
          {tiles.map((t, i) => (
            <div
              key={t.name}
              className={`relative aspect-[4/3] overflow-hidden rounded-[16px] border ${
                t.speaking ? "border-primary shadow-[0_0_24px_-6px_rgba(110,235,131,0.6)]" : "border-border"
              } bg-gradient-to-br ${t.hue}`}
            >
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-card/60 text-xl font-semibold backdrop-blur-xl">
                  {t.initials}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium backdrop-blur-md">
                {i % 2 === 0 ? <Mic className="h-3 w-3 text-primary" /> : <MicOff className="h-3 w-3 text-muted-foreground" />}
                {t.name}
              </div>
            </div>
          ))}
        </div>
        {/* control bar */}
        <div className="flex items-center justify-center gap-2 border-t border-border bg-surface/60 px-4 py-3">
          {[Mic, Video, ScreenShare, MessageSquare].map((Icon, i) => (
            <button
              key={i}
              className="grid h-10 w-10 place-items-center rounded-full bg-card text-muted-foreground hover:bg-border hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button className="ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90">
            <Phone className="h-4 w-4 rotate-[135deg]" /> Leave
          </button>
        </div>
      </div>
    </motion.div>
  );
}
