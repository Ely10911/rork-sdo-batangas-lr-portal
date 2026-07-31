import { Link, NavLink, Navigate } from "react-router-dom";
import {
  BarChart3,
  FileStack,
  Gauge,
  Globe,
  LogOut,
  ScrollText,
  UploadCloud,
  Users,
} from "lucide-react";

import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import { useLrms } from "@/lib/store";

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: Gauge, end: true },
  { to: "/admin/resources", label: "Resource registry", icon: FileStack, end: false },
  { to: "/admin/upload", label: "Upload & drafts", icon: UploadCloud, end: false },
  { to: "/admin/reports", label: "Reports", icon: ScrollText, end: false },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, end: false },
  { to: "/admin/users", label: "User management", icon: Users, end: false },
];

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { session, logout, resources } = useLrms();

  if (session?.role !== "admin") return <Navigate to="/login" replace />;

  const pending = resources.filter((r) => r.status === "pending").length;
  const drafts = resources.filter((r) => r.status === "draft").length;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="ink-panel sticky top-0 hidden h-screen w-[254px] shrink-0 flex-col border-r border-ink-soft/40 lg:flex">
        <div className="border-b border-parchment/10 px-5 py-5">
          <p className="eyebrow text-gold-soft">SDO Batangas</p>
          <p className="mt-1 font-display text-[17px] font-bold leading-tight text-parchment">LRMS Admin Console</p>
          <p className="mt-1 text-[11px] text-parchment/45">Curriculum Implementation Division</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const badge = item.to === "/admin/resources" ? pending : item.to === "/admin/upload" ? drafts : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "focus-ring group flex items-center gap-3 rounded-sm px-3 py-2.5 text-[13px] font-medium transition-all",
                    isActive
                      ? "bg-gold text-ink-deep shadow-inset"
                      : "text-parchment/70 hover:bg-parchment/8 hover:text-parchment",
                  )
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.9} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="tabular rounded-full bg-parchment/15 px-1.5 text-[10px] font-bold text-parchment">
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-parchment/10 px-3 py-4">
          <Link
            to="/"
            className="focus-ring flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-parchment/70 transition-colors hover:text-gold-soft"
          >
            <Globe className="h-4 w-4" strokeWidth={1.8} /> View public portal
          </Link>
          <button
            type="button"
            onClick={logout}
            className="focus-ring mt-1 flex w-full items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-parchment/70 transition-colors hover:text-destructive"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-4 px-5 py-4 lg:px-8">
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-gold-deep">Administrator</p>
              <h1 className="mt-0.5 truncate font-display text-xl font-bold text-ink md:text-2xl">{title}</h1>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <NotificationBell />
              <div className="hidden items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-bold text-parchment">
                  LA
                </span>
                <span className="leading-tight">
                  <span className="block text-[12px] font-semibold text-ink">{session.name}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">{session.username}</span>
                </span>
              </div>
            </div>
          </div>

          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-border/70 px-5 py-2 lg:hidden">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-sm px-3 py-1.5 text-[12px] font-medium",
                    isActive ? "bg-ink text-parchment" : "text-ink-soft hover:bg-muted",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
