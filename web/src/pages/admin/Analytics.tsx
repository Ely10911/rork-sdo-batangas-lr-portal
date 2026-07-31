import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Building2, MapPinned, TrendingUp } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow } from "@/components/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatNumber, formatRelative, monthKey, monthLabel } from "@/lib/format";
import { LEARNING_AREAS, SUB_OFFICE_NAMES } from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";

const tooltipStyle = {
  contentStyle: {
    borderRadius: 4,
    border: "1px solid hsl(38 20% 84%)",
    background: "hsl(40 50% 98%)",
    fontSize: 12,
    fontFamily: '"Public Sans", sans-serif',
  },
  labelStyle: { color: "hsl(202 58% 12%)", fontWeight: 600 },
};

const SUB_OFFICE_COLORS = ["hsl(34 68% 52%)", "hsl(183 52% 30%)", "hsl(8 58% 46%)", "hsl(202 58% 26%)"];

export default function AdminAnalytics() {
  const { resources, users, downloadEvents } = useLrms();
  const [window, setWindow] = useState<string>("365");

  const published = useMemo(() => resources.filter((r) => r.status === "published"), [resources]);

  const events = useMemo(() => {
    const days = Number(window);
    return downloadEvents.filter((event) => Date.now() - new Date(event.at).getTime() <= days * 86400000);
  }, [downloadEvents, window]);

  const monthlyTrend = useMemo(() => {
    const buckets: Record<string, { downloads: number; resources: number }> = {};
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      buckets[monthKey(d.toISOString())] = { downloads: 0, resources: 0 };
    }
    downloadEvents.forEach((event) => {
      const key = monthKey(event.at);
      if (buckets[key]) buckets[key].downloads += 1;
    });
    let cumulative = 0;
    return Object.entries(buckets).map(([key, value]) => {
      cumulative += resources.filter((r) => monthKey(r.dateUploaded) === key).length;
      return { month: monthLabel(key), downloads: value.downloads, growth: cumulative };
    });
  }, [downloadEvents, resources]);

  const bySubOffice = useMemo(
    () =>
      SUB_OFFICE_NAMES.map((office) => ({
        office: office.replace("Sub-Office ", "SO ").split(" – ")[0] + " · " + office.split(" – ")[1],
        downloads: events.filter((e) => e.subOffice === office).length,
        resources: published.filter((r) => r.subOffice === office).length,
      })),
    [events, published],
  );

  const bySchool = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      counts[event.school] = (counts[event.school] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([school, downloads]) => ({ school, downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10);
  }, [events]);

  const areaTrends = useMemo(
    () =>
      LEARNING_AREAS.map((area) => {
        const items = published.filter((r) => r.learningArea === area);
        const downloads = items.reduce((sum, r) => sum + r.downloads, 0);
        return {
          area: area.length > 12 ? `${area.slice(0, 11)}…` : area,
          downloads,
          resources: items.length,
        };
      }).filter((row) => row.resources > 0),
    [published],
  );

  const leastAccessed = useMemo(
    () => [...published].sort((a, b) => a.downloads - b.downloads).slice(0, 6),
    [published],
  );
  const mostDownloaded = useMemo(
    () => [...published].sort((a, b) => b.downloads - a.downloads).slice(0, 6),
    [published],
  );

  const utilization = useMemo(() => {
    const total = published.length;
    const used = published.filter((r) => r.downloads > 0).length;
    const dormant = published.filter((r) => r.downloads < 40).length;
    const activeUsers = users.filter((u) => Date.now() - new Date(u.lastActive).getTime() < 30 * 86400000).length;
    const growth = resources.filter((r) => Date.now() - new Date(r.dateUploaded).getTime() < 90 * 86400000).length;
    return {
      rate: total ? Math.round((used / total) * 100) : 0,
      dormant,
      activeUsers,
      growth,
      avgPerResource: total ? Math.round(published.reduce((sum, r) => sum + r.downloads, 0) / total) : 0,
    };
  }, [published, users, resources]);

  return (
    <AdminShell
      title="Analytics"
      subtitle="Resource utilization, geographic reach and learning-area trends"
      actions={
        <Select value={window} onValueChange={setWindow}>
          <SelectTrigger className="h-9 w-[152px] rounded-sm text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last quarter</SelectItem>
            <SelectItem value="365">Last school year</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Utilization rate", value: `${utilization.rate}%`, hint: "of published LRs downloaded" },
          { label: "Active users (30d)", value: formatNumber(utilization.activeUsers), hint: `of ${users.length} accounts` },
          { label: "Avg. downloads / LR", value: formatNumber(utilization.avgPerResource), hint: "lifetime average" },
          { label: "Resource growth (90d)", value: `+${formatNumber(utilization.growth)}`, hint: "new uploads" },
          { label: "Low-access LRs", value: formatNumber(utilization.dormant), hint: "under 40 downloads" },
        ].map((tile) => (
          <div key={tile.label} className="plate p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{tile.label}</p>
            <p className="tabular mt-2 font-display text-2xl font-bold text-ink">{tile.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{tile.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="plate p-5">
          <Eyebrow className="text-gold-deep">Monthly usage</Eyebrow>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">Downloads vs. cumulative resource growth</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="hsl(38 20% 84%)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="downloads"
                  name="Downloads"
                  stroke="hsl(34 68% 48%)"
                  strokeWidth={2.4}
                  dot={{ r: 2.5, fill: "hsl(34 68% 48%)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="growth"
                  name="Cumulative uploads"
                  stroke="hsl(183 52% 30%)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="plate p-5">
          <Eyebrow className="text-gold-deep">Learning area trends</Eyebrow>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">Demand profile</h2>
          <div className="mt-2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={areaTrends} outerRadius="72%">
                <PolarGrid stroke="hsl(38 20% 80%)" />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: "hsl(202 58% 20%)" }} />
                <Radar
                  name="Downloads"
                  dataKey="downloads"
                  stroke="hsl(34 68% 48%)"
                  fill="hsl(34 68% 52%)"
                  fillOpacity={0.32}
                />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="plate p-5">
          <Eyebrow className="flex items-center gap-1.5 text-gold-deep">
            <MapPinned className="h-3.5 w-3.5" /> Geographic reach
          </Eyebrow>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">Downloads by sub-office</h2>
          <div className="mt-4 h-[248px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubOffice} margin={{ top: 4, right: 10, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="hsl(38 20% 84%)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="office" tick={{ fontSize: 10, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(200 14% 42%)" }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="downloads" name="Downloads" radius={[3, 3, 0, 0]}>
                  {bySubOffice.map((entry, i) => (
                    <Cell key={entry.office} fill={SUB_OFFICE_COLORS[i % SUB_OFFICE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="plate overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <Building2 className="h-3.5 w-3.5 text-gold-deep" />
            <Eyebrow className="text-ink-soft">Downloads by school (top 10)</Eyebrow>
          </div>
          <ol className="divide-y divide-border/60">
            {bySchool.map((row, i) => {
              const max = bySchool[0]?.downloads || 1;
              return (
                <li key={row.school} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="tabular w-5 font-display text-sm font-bold text-gold-deep/70">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink">{row.school}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-700"
                        style={{ width: `${(row.downloads / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="tabular text-[12px] font-semibold text-ink">{formatNumber(row.downloads)}</span>
                </li>
              );
            })}
            {bySchool.length === 0 && (
              <li className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                No download activity in the selected window.
              </li>
            )}
          </ol>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <RankPanel
          title="Most downloaded resources"
          tone="up"
          rows={mostDownloaded.map((r) => ({
            id: r.id,
            title: r.title,
            meta: `${r.gradeLevel} · ${r.learningArea} · ${formatRelative(r.dateUploaded)}`,
            value: r.downloads,
          }))}
        />
        <RankPanel
          title="Least accessed resources"
          tone="down"
          rows={leastAccessed.map((r) => ({
            id: r.id,
            title: r.title,
            meta: `${r.school} · uploaded ${formatRelative(r.dateUploaded)}`,
            value: r.downloads,
          }))}
        />
      </div>
    </AdminShell>
  );
}

function RankPanel({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: { id: string; title: string; meta: string; value: number }[];
  tone: "up" | "down";
}) {
  const Icon = tone === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="plate overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        {tone === "up" ? (
          <TrendingUp className="h-3.5 w-3.5 text-gold-deep" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
        )}
        <Eyebrow className="text-ink-soft">{title}</Eyebrow>
      </div>
      <ol className="divide-y divide-border/60">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link to={`/resource/${row.id}`} className="block truncate text-[13px] font-medium text-ink hover:text-gold-deep">
                {row.title}
              </Link>
              <p className="truncate text-[11px] text-muted-foreground">{row.meta}</p>
            </div>
            <span
              className={cn(
                "tabular inline-flex items-center gap-1 text-[12px] font-semibold",
                tone === "up" ? "text-[hsl(150_48%_28%)]" : "text-destructive",
              )}
            >
              <Icon className="h-3 w-3" /> {formatNumber(row.value)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
