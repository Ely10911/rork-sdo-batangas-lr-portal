import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, UserCheck, UserRound, UserX } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { SUB_OFFICE_NAMES } from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";

export default function AdminUsers() {
  const { users, resources, toggleUserActive } = useLrms();
  const [query, setQuery] = useState<string>("");
  const [office, setOffice] = useState<string>("all");
  const [role, setRole] = useState<string>("all");

  const rows = useMemo(
    () =>
      users.filter((user) => {
        if (office !== "all" && user.subOffice !== office) return false;
        if (role !== "all" && user.role !== role) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return (
            user.name.toLowerCase().includes(q) ||
            user.username.toLowerCase().includes(q) ||
            user.school.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [users, office, role, query],
  );

  const uploadsByAuthor = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.author] = (counts[r.author] ?? 0) + 1;
    });
    return counts;
  }, [resources]);

  const active = users.filter((u) => u.active).length;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <AdminShell title="User management" subtitle="Accounts with access to the division learning resource portal">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total users", value: formatNumber(users.length), icon: UserRound },
          { label: "Active accounts", value: formatNumber(active), icon: UserCheck },
          { label: "System administrators", value: formatNumber(admins), icon: ShieldCheck },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className="plate flex items-center gap-4 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-sm border border-border bg-muted text-ink">
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{tile.label}</p>
                <p className="tabular font-display text-2xl font-bold text-ink">{tile.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="plate mt-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, username or school…"
            className="h-9 rounded-sm pl-9 text-[13px]"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9 w-[176px] rounded-sm text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">System Administrator</SelectItem>
            <SelectItem value="viewer">Viewer / Public user</SelectItem>
          </SelectContent>
        </Select>
        <Select value={office} onValueChange={setOffice}>
          <SelectTrigger className="h-9 w-[220px] rounded-sm text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sub-offices</SelectItem>
            {SUB_OFFICE_NAMES.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="plate mt-4 overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <Eyebrow className="text-ink">Accounts · {rows.length}</Eyebrow>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="bg-red text-white">
                {["User", "Role", "School", "Sub-office", "Uploads", "Last active", "Status"].map((head) => (
                  <th key={head} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id} className="border-b border-border/60 transition-colors hover:bg-red/5">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red text-[11px] font-bold text-white">
                        {user.name
                          .split(" ")
                          .filter((part) => /^[A-Za-z]/.test(part))
                          .slice(-2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {user.id} · {user.username}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium",
                        user.role === "admin"
                          ? "border-red/50 bg-red/15 text-red-dark"
                          : "border-border bg-muted text-ink",
                      )}
                    >
                      {user.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                      {user.role === "admin" ? "Administrator" : "Viewer"}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-3 py-3 text-[12.5px] text-ink">
                    <span className="block truncate">{user.school}</span>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-muted-foreground">{user.subOffice}</td>
                  <td className="tabular px-3 py-3 text-[12.5px] font-medium text-ink">
                    {formatNumber(uploadsByAuthor[user.name] ?? 0)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-muted-foreground">
                    <span className="block">{formatDate(user.lastActive)}</span>
                    <span className="block text-[11px]">{formatRelative(user.lastActive)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        toggleUserActive(user.id);
                        toast.success(`${user.name} ${user.active ? "deactivated" : "reactivated"}`);
                      }}
                      className={cn(
                        "focus-ring inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        user.active
                          ? "border-[hsl(150_42%_32%)]/40 bg-[hsl(150_42%_32%)]/12 text-[hsl(150_48%_26%)] hover:border-destructive/50 hover:text-destructive"
                          : "border-border bg-muted text-muted-foreground hover:border-red/60 hover:text-red-dark",
                      )}
                    >
                      {user.active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      {user.active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                    No accounts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Administrator credentials are provisioned by the Information and Communications Technology Unit. Viewer accounts
        are created automatically when teachers register through the public portal.
      </p>
    </AdminShell>
  );
}
