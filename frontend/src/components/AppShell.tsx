import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Video,
  Users,
  Layers,
  FileText,
  Settings,
  UserCircle,
  LogOut,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/meetings/create", icon: Plus, label: "Create" },
  { to: "/meetings/join", icon: Video, label: "Join" },
  { to: "/room", icon: Users, label: "Room" },
  { to: "/whiteboard", icon: Layers, label: "Whiteboard" },
  { to: "/files", icon: FileText, label: "Files" },
];

const bottomNav = [
  { to: "/profile", icon: UserCircle, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[70px] flex-col items-center justify-between border-r border-border bg-surface/60 py-5 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/dashboard"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_24px_-6px_rgba(110,235,131,0.6)]"
            aria-label="SyncSpace"
          >
            <span className="text-lg font-bold">S</span>
          </Link>
          <div className="mt-3 flex flex-col items-center gap-1.5">
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/dashboard" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  title={n.label}
                  className={`group relative grid h-11 w-11 place-items-center rounded-xl transition-all duration-200 ease-out hover:bg-card ${
                    active ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-x-[6px] -translate-y-1/2 rounded-r bg-primary" />
                  )}
                  <n.icon className="h-[18px] w-[18px]" />
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          {bottomNav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                title={n.label}
                className={`grid h-11 w-11 place-items-center rounded-xl transition-all duration-200 ease-out hover:bg-card ${
                  active ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <n.icon className="h-[18px] w-[18px]" />
              </Link>
            );
          })}
          <Link
            to="/"
            title="Sign out"
            className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-all duration-200 ease-out hover:bg-card hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </aside>
      <main className="ml-[70px] flex-1">{children}</main>
    </div>
  );
}
