import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/FadeIn";
import {
  Download,
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  Search,
  Upload,
  MoreHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "Files — SyncSpace" },
      { name: "description", content: "Shared files across your rooms." },
    ],
  }),
  component: Files,
});

const files = [
  { name: "design-system.fig", uploader: "Heather Rosenbaum", date: "Jun 18, 2026", size: "12.4 MB", type: "design", icon: FileImage, hue: "from-rose-400/30 to-orange-400/20" },
  { name: "Q3-roadmap.pdf", uploader: "Gerald Jones", date: "Jun 17, 2026", size: "2.1 MB", type: "doc", icon: FileText, hue: "from-amber-300/30 to-yellow-500/20" },
  { name: "kickoff.mp4", uploader: "Mira Kapoor", date: "Jun 16, 2026", size: "84.6 MB", type: "video", icon: FileVideo, hue: "from-indigo-400/30 to-violet-500/20" },
  { name: "metrics-q2.xlsx", uploader: "Debangsu", date: "Jun 14, 2026", size: "412 KB", type: "sheet", icon: FileSpreadsheet, hue: "from-emerald-400/30 to-teal-400/20" },
  { name: "hero-mockup.png", uploader: "Heather Rosenbaum", date: "Jun 12, 2026", size: "2.8 MB", type: "image", icon: FileImage, hue: "from-rose-400/30 to-pink-500/20" },
  { name: "contract-draft.pdf", uploader: "Legal Team", date: "Jun 11, 2026", size: "612 KB", type: "doc", icon: FileText, hue: "from-amber-300/30 to-orange-400/20" },
  { name: "demo-recording.mp4", uploader: "Gerald Jones", date: "Jun 09, 2026", size: "146 MB", type: "video", icon: FileVideo, hue: "from-indigo-400/30 to-blue-500/20" },
  { name: "okrs.xlsx", uploader: "Mira Kapoor", date: "Jun 08, 2026", size: "98 KB", type: "sheet", icon: FileSpreadsheet, hue: "from-emerald-400/30 to-cyan-400/20" },
];

function Files() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Shared Files</h1>
            <p className="mt-1 text-sm text-muted-foreground">Everything your team has shared in rooms.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground backdrop-blur-xl">
              <Search className="h-4 w-4" />
              <input placeholder="Search files…" className="w-48 bg-transparent outline-none" />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
              <Upload className="h-4 w-4" /> Upload
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((f, i) => (
            <FadeIn key={f.name} delay={i * 0.03}>
              <div className="hover-lift group flex h-full flex-col rounded-[20px] border border-border bg-card p-4">
                <div className={`relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br ${f.hue}`}>
                  <div className="absolute inset-0 grid place-items-center">
                    <f.icon className="h-10 w-10 text-foreground/80" />
                  </div>
                  <button className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/50 text-muted-foreground opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:text-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-4 flex-1">
                  <h3 className="truncate text-sm font-semibold">{f.name}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{f.uploader}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{f.date} · {f.size}</p>
                </div>
                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface/50 py-2 text-xs font-medium hover:border-primary/40 hover:text-primary">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
