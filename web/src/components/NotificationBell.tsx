import { Link } from "react-router-dom";
import { BellRing, BookPlus, Megaphone, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import { useLrms } from "@/lib/store";
import type { NotificationKind } from "@/lib/types";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  resource: BookPlus,
  curriculum: Megaphone,
  system: ShieldCheck,
};

export function NotificationBell({ tone = "ink" }: { tone?: "ink" | "light" }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useLrms();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className={cn(
            "focus-ring relative grid h-9 w-9 place-items-center rounded-sm border transition-colors",
            tone === "light"
              ? "border-white/20 bg-white/5 text-white hover:border-red/60"
              : "border-border bg-card text-ink hover:border-red/60",
          )}
        >
          <BellRing className="h-4 w-4" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 animate-pulse-dot place-items-center rounded-full bg-red px-1 text-[9px] font-bold text-red-deep">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] overflow-hidden rounded-md border-border p-0">
        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5">
          <p className="eyebrow text-ink">In-app notifications</p>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="focus-ring rounded-sm text-[11px] font-medium text-red-dark hover:underline"
          >
            Mark all read
          </button>
        </div>
        <ul className="max-h-[380px] divide-y divide-border/70 overflow-y-auto">
          {notifications.length === 0 && (
            <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">No notifications yet.</li>
          )}
          {notifications.map((note) => {
            const Icon = KIND_ICON[note.kind];
            const inner = (
              <div className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-red/6", !note.read && "bg-red/8")}>
                <span
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-sm border",
                    note.kind === "curriculum"
                      ? "border-red/50 bg-red/15 text-red-dark"
                      : note.kind === "system"
                        ? "border-red-soft/40 bg-red-soft/10 text-red-soft"
                        : "border-border bg-muted text-ink",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-ink">{note.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{note.body}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
                    {formatRelative(note.at)}
                  </p>
                </div>
                {!note.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red" />}
              </div>
            );
            return (
              <li key={note.id}>
                {note.resourceId ? (
                  <Link to={`/resource/${note.resourceId}`} onClick={() => markNotificationRead(note.id)}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={() => markNotificationRead(note.id)} className="w-full text-left">
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
