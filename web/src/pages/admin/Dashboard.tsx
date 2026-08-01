import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileStack,
  Star,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow, StatusPill } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { formatNumber, formatRelative, monthKey, monthLabel } from "@/lib/format";
import { useLrms, useRatingIndex } from "@/lib/store";
import { LEARNING_AREAS } from "@/lib/taxonomy";

const AREA_COLORS = [
  "hsl(34 68% 52%)",
  "hsl(202 58% 24%)",
  "hsl(183 52% 30%)",
  "hsl(8 58% 46%)",
  "hsl(268 38% 46%)",
  "hsl(150 42% 32%)",
  "hsl(24 72% 46%)",
  "hsl(210 58% 40%)",
  "hsl(320 38% 44%)",
  "hsl(45 62% 44%)",
];

function StatTile({
  label,
  value,
  delta,
  icon: Icon,
  tone = "ink",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  tone?: "ink" | "red";
}) {
  return (
    <div className={cn("plate relative overflow-hidden p-5", tone === "red" && "border-red/50 bg-red/8")}>
      <div className="hatch pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="tabular mt-2 font-display text-3xl font-bold text-ink">{value}</p>
          {delta && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(150_48%_28%)]">
              <ArrowUpRight className="h-3 w-3" /> {delta}
            </p>
          )}
        </div>
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-sm border",
            tone === "red" ? "border-red/50 bg-red/20 text-red-dark" : "border-border bg-muted text-ink",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
      </div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 4,
    border: "1px solid hsl(38 20% 84%)",
    background: "hsl(40 50% 98%)",
    fontSize: 12,
    fontFamily: '"Public Sans", sans-serif',
    boxShadow: "0 18px 40px -28px hsl(202 58% 12% / 0.5)",
  },
  labelStyle: { color: "hsl(202 58% 12%)", fontWeight: 600 },
};

export default function AdminDashboard() {
  const { resources, users, downloadEvents, feedback } = useLrms();
  const ratings = useRatingIndex();

  const published = useMemo(() => resources.filter((r) => r.status === "published"), [resources]);
  const pending = useMemo(() => resources.filter((r) => r.status === "pending"), [resources]);
  const drafts = useMemo(() => resources.filter((r) => r.status === "draft"), [resources]);

  const totals = useMemo(() => {
    const downloads = resources.reduce((sum, r) => sum + r.downloads, 0);
    const views = resources.reduce((sum, r) => sum + r.views, 0);
    const ratingValues = Object.values(ratings);
    const avgRating = ratingValues.length
      ? ratingValues.reduce((sum, r) => sum + r.average, 0) / ratingValues.length
      : 0;
    const last30 = downloadEvents.filter((e) => Date.now() - new Date(e.at).getTime() < 30 * 86400000).length;
    return { downloads, views, avgRating, last30 };
  }, [resources, ratings, downloadEvents]);

  const monthly = useMemo(() => {
    const buckets: Record<string, { downloads: number; uploads: number }> = {};
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      buckets[monthKey(d.toISOString())] = { downloads: 0, uploads: 0 };
    }
    downloadEvents.forEach((event) => {
      const key = monthKey(event.at);
      if (buckets[key]) buckets[key].downloads += 1;
    });
    resources.forEach((r) => {
      const key = monthKey(r.dateUploaded);
      if (buckets[key]) buckets[key].uploads += 1;
    });
    return Object.entries(buckets).map(([key, value]) => ({
      month: monthLabel(key),
      downloads: value.downloads,
      uploads: value.uploads,
    }));
  }, [downloadEvents, resources]);

  const areaData = useMemo(
    () =>
      LEARNING_AREAS.map((area) => ({
        area: area.length > 14 ? `${area.slice(0, 13)}…` : area,
        count: published.filter((r) => r.learningArea === area).length,
      })).filter((row) => row.count > 0),
    [published],
  );

  const statusData = useMemo(
    () => [
      { name: "Published", value: published.length, fill: "hsl(150 42% 32%)" },
      { name: "For QA review", value: pending.length, fill: "hsl(34 68% 52%)" },
      { name: "Drafts", value: drafts.length, fill: "hsl(200 14% 55%)" },
      {
        name: "Archived",
        value: resources.filter((r) => r.status === "archived").length,
        fill: "hsl(202 30% 32%)",
      },
    ],
    [published, pending, drafts, resources],
  );

  const topResources = useMemo(() => [...published].sort((a, b) => b.downloads - a.downloads).slice(0, 6), [published]);
  const recentFeedback = useMemo(
    () => [...feedback].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5),
    [feedback],
  );

  return (
    <AdminShell
      title="Division dashboard"
      subtitle="Repository health, utilization and quality-assurance queue at a glance"
      actions={
        <Link
          to="/admin/upload"
          className="focus-ring inline-flex items-center gap-2 rounded-sm bg-red px-3.5 py-2 text-[13px] font-semibold text-red-deep hover:bg-red-soft"
        >
          <UploadCloud className="h-4 w-4" /> Upload resources
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total users" value={formatNumber(users.length)} icon={Users} delta={`${users.filter((u) => u.active).length} active`} />
        <StatTile label="Uploaded resources" value={formatNumber(resources.length)} icon={FileStack} />
        <StatTile label="Published resources" value={formatNumber(published.length)} icon={CheckCircle2} tone="red" />
        <StatTile
          label="Total downloads"
          value={formatNumber(totals.downloads)}
          icon={Download}
          delta={`${formatNumber(totals.last30)} in last 30 days`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total views" value={formatNumber(totals.views)} icon={Eye} />
        <StatTile label="Average rating" value={totals.avgRating.toFixed(2)} icon={Star} />
        <StatTile label="Awaiting QA review" value={formatNumber(pending.length)} icon={Clock3} />
        <StatTile label="Drafts in progress" value={formatNumber(drafts.length)} icon={UploadCloud} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="plate p-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <Eyebrow className="text-red-dark">Utilization trend</Eyebrow>
              <h2 className="mt-1 font-display text-lg font-semibold text-ink">Downloads & uploads per month</h2>
            </div>
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red" /> Downloads
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red" /> Uploads
              </span>
            </div>
          </div>
          <div className="h-[264px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(34 68% 52%)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(34 68% 52%)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="darkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(202 58% 20%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(202 58% 20%)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(38 20% 84%)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stroke="hsl(34 68% 46%)"
                  strokeWidth={2}
                  fill="url(#redFill)"
                  name="Downloads"
                />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  stroke="hsl(202 58% 20%)"
                  strokeWidth={2}
                  fill="url(#darkFill)"
                  name="Uploads"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="plate p-5">
          <Eyebrow className="text-red-dark">Repository status</Eyebrow>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">Resource lifecycle</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke="hsl(40 50% 98%)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {statusData.map((row) => (
              <li key={row.name} className="flex items-center gap-2 text-[12px]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: row.fill }} />
                <span className="flex-1 text-ink">{row.name}</span>
                <span className="tabular font-semibold text-ink">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="plate p-5">
          <Eyebrow className="text-red-dark">Coverage</Eyebrow>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">Published LRs by learning area</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="hsl(38 20% 84%)" strokeDasharray="3 4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="area"
                  width={104}
                  tick={{ fontSize: 11, fill: "hsl(202 58% 18%)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Resources">
                  {areaData.map((entry, i) => (
                    <Cell key={entry.area} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="plate overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
              <Eyebrow className="text-ink">Quality assurance queue</Eyebrow>
              <Link to="/admin/resources" className="text-[12px] font-semibold text-red-dark hover:underline">
                Open registry
              </Link>
            </div>
            <ul className="divide-y divide-border/60">
              {[...pending, ...drafts].slice(0, 4).map((resource) => (
                <li key={resource.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{resource.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {resource.author} · {resource.schools[0] ?? "—"} · {formatRelative(resource.dateUploaded)}
                    </p>
                  </div>
                  <StatusPill status={resource.status} />
                </li>
              ))}
              {pending.length + drafts.length === 0 && (
                <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                  Nothing awaiting review — the queue is clear.
                </li>
              )}
            </ul>
          </div>

          <div className="plate overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <Eyebrow className="text-ink">Most downloaded resources</Eyebrow>
            </div>
            <ol className="divide-y divide-border/60">
              {topResources.map((resource, i) => (
                <li key={resource.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="tabular w-5 font-display text-sm font-bold text-red-dark/70">{i + 1}</span>
                  <Link
                    to={`/resource/${resource.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] text-ink hover:text-red-dark"
                  >
                    {resource.title}
                  </Link>
                  <span className="tabular text-[12px] font-semibold text-ink">{formatNumber(resource.downloads)}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="plate overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <Eyebrow className="text-ink">Latest teacher feedback</Eyebrow>
            </div>
            <ul className="divide-y divide-border/60">
              {recentFeedback.map((item) => {
                const resource = resources.find((r) => r.id === item.resourceId);
                return (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-ink">{item.author}</span>
                      <span className="text-[11px] text-muted-foreground">{formatRelative(item.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{item.comment}</p>
                    {resource && (
                      <Link
                        to={`/resource/${resource.id}`}
                        className="mt-1 block truncate text-[11px] font-medium text-red-dark hover:underline"
                      >
                        {resource.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
