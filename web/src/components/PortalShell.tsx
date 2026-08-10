import { Link, NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { BookMarked, Compass, LayoutDashboard, LibraryBig, LogOut, Radio, ShieldCheck } from "lucide-react";

import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import { useLrms } from "@/lib/store";
import { DIVISION, LEGACY_LR_URL } from "@/lib/taxonomy";
import { formatNumber } from "@/lib/format";

const NAV = [
  { to: "/", label: "Home", icon: Compass },
  { to: "/browse", label: "Browse catalog", icon: LibraryBig },
  { to: "/library", label: "My library", icon: BookMarked },
];

function DivisionSeal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/60 bg-gold-deep",
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-[3px] rounded-full border border-gold/25" />
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold" fill="none" strokeWidth={1.6} stroke="currentColor">
        <path d="M4 18.5V6.2c2.6-1 5.4-1 8 .3 2.6-1.3 5.4-1.3 8-.3v12.3c-2.6-1-5.4-1-8 .3-2.6-1.3-5.4-1.3-8-.3Z" />
        <path d="M12 6.5V19" />
        <path d="m7.4 13.6 2.1-2.6 1.5 1.8" className="text-gold-soft" />
      </svg>
    </span>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { session, logout, resources, bookmarks, activeUsers, totalVisitors } = useLrms();
  const location = useLocation();

  const published = useMemo(() => resources.filter((r) => r.status === "published"), [resources]);
  const totalDownloads = useMemo(() => published.reduce((sum, r) => sum + r.downloads, 0), [published]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Republic banner */}
      <div className="ink-panel border-b border-gold-deep/40 text-white/70">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-1.5">
          <p className="eyebrow">Republic of the Philippines · Department of Education · Region IV-A CALABARZON</p>
          <p className="eyebrow hidden sm:block">
            {formatNumber(published.length)} published LRs · {formatNumber(totalDownloads)} downloads
          </p>
          {activeUsers > 0 && (
            <p className="eyebrow hidden items-center gap-1.5 text-gold-soft sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              {formatNumber(activeUsers)} online now · {formatNumber(totalVisitors)} total visitors
            </p>
          )}
          {activeUsers === 0 && totalVisitors > 0 && (
            <p className="eyebrow hidden sm:block">
              <Radio className="mr-1 inline h-3 w-3 text-gold/60" />
              {formatNumber(totalVisitors)} total visitors
            </p>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="container flex items-center gap-4 py-3">
          <Link to="/" className="focus-ring flex items-center gap-3 rounded-sm">
            <DivisionSeal />
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-bold tracking-tight text-ink">
                Learning Resource Portal
              </span>
              <span className="block text-[11px] text-muted-foreground">{DIVISION}</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "focus-ring inline-flex items-center gap-2 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors",
                      isActive ? "bg-gold text-white" : "text-ink hover:bg-muted",
                    )
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  {item.label}
                  {item.to === "/library" && bookmarks.length > 0 && (
                    <span className="tabular rounded-full bg-gold/25 px-1.5 text-[10px] font-bold text-gold-deep">
                      {bookmarks.length}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <NotificationBell />
            {session?.role === "admin" ? (
              <>
                <Link
                  to="/admin"
                  className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-3 py-2 text-[13px] font-semibold text-gold-deep transition-colors hover:bg-gold-soft"
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                  <span className="hidden sm:inline">Admin console</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  className="focus-ring grid h-9 w-9 place-items-center rounded-sm border border-border bg-card text-ink hover:border-destructive/60 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="focus-ring inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-card px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
                <span className="hidden sm:inline">Administrator login</span>
                <span className="sm:hidden">Login</span>
              </Link>
            )}
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-border/70 px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-sm px-3 py-1.5 text-[12px] font-medium",
                  isActive ? "bg-gold text-white" : "text-ink hover:bg-muted",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="ink-panel mt-16 text-white/70">
        <div className="container grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <DivisionSeal />
              <span className="font-display text-lg font-bold text-white">Learning Resource Portal</span>
            </div>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed">
              The official Learning Resource Management System of the {DIVISION}. Quality-assured, contextualized and
              curriculum-aligned materials for every learner in the province.
            </p>
            <p className="mt-4 text-[12px] text-white/45">
              Kumintang Ibaba, Batangas City, Batangas · (043) 722-1234 · batangas.province@deped.gov.ph
            </p>
          </div>
          <div>
            <p className="eyebrow text-gold-soft">Portal</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-gold-soft">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/login" className="transition-colors hover:text-gold-soft">
                  Administrator login
                </Link>
              </li>
              <li>
                <a
                  href={LEGACY_LR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gold-soft"
                >
                  Legacy LR portal (Wix)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-gold-soft">Governance</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li>Curriculum Implementation Division</li>
              <li>Learning Resource Management Section</li>
              <li>DepEd Order No. 001, s. 2024 compliant</li>
              <li>Data Privacy Act of 2012 compliant</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container flex flex-wrap items-center justify-between gap-2 py-4 text-[11px] text-white/45">
            <span>© {new Date().getFullYear()} Schools Division Office of Batangas. All rights reserved.</span>
            <span>LRMS v2.6 · Learning Resource Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
