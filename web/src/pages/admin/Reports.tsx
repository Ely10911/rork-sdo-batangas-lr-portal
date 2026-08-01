import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Printer, ScrollText } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow } from "@/components/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportCsv, exportExcel, exportPdf, type ReportTable } from "@/lib/exporters";
import { formatDate, formatNumber, monthKey, monthLabel } from "@/lib/format";
import { DIVISION, GRADE_LEVELS, LEARNING_AREAS, SUB_OFFICE_NAMES, subOfficeFor } from "@/lib/taxonomy";
import { useLrms, useRatingIndex } from "@/lib/store";

type ReportKey =
  | "by-subject"
  | "by-grade"
  | "by-district"
  | "by-school"
  | "downloads-monthly"
  | "active-users"
  | "utilization"
  | "most-viewed";

const REPORTS: { key: ReportKey; label: string; blurb: string }[] = [
  { key: "by-subject", label: "Total LR by learning area & subject", blurb: "Coverage of the repository per learning area." },
  { key: "by-grade", label: "LR by grade level", blurb: "Distribution across Kinder to Grade 12." },
  { key: "by-district", label: "LR by district / sub-office", blurb: "Contribution per sub-office and district." },
  { key: "by-school", label: "LR by school", blurb: "School-level contribution and utilization." },
  { key: "downloads-monthly", label: "Downloads per month", blurb: "Rolling 12-month download volume." },
  { key: "active-users", label: "Active users", blurb: "Registered accounts and last activity." },
  { key: "utilization", label: "Resource utilization", blurb: "Views, downloads and conversion per resource." },
  { key: "most-viewed", label: "Most viewed resources", blurb: "Top resources by preview views." },
];

export default function AdminReports() {
  const { resources, users, downloadEvents } = useLrms();
  const ratings = useRatingIndex();
  const [key, setKey] = useState<ReportKey>("by-subject");

  const published = useMemo(() => resources.filter((r) => r.status === "published"), [resources]);

  const table = useMemo<ReportTable>(() => {
    const stamp = `Generated ${formatDate(new Date().toISOString())} · ${DIVISION}`;

    if (key === "by-subject") {
      const rows = LEARNING_AREAS.map((area) => {
        const items = published.filter((r) => r.learningArea === area);
        const downloads = items.reduce((sum, r) => sum + r.downloads, 0);
        const subjects = new Set(items.map((r) => r.subject));
        return [area, subjects.size, items.length, downloads, items.length ? Math.round(downloads / items.length) : 0];
      });
      return {
        title: "Total Learning Resources by Learning Area",
        subtitle: stamp,
        columns: ["Learning area", "Subjects covered", "Published LRs", "Total downloads", "Avg. downloads / LR"],
        rows,
      };
    }

    if (key === "by-grade") {
      return {
        title: "Learning Resources by Grade Level",
        subtitle: stamp,
        columns: ["Grade level", "Key stage", "Published LRs", "Downloads", "Views"],
        rows: GRADE_LEVELS.map((grade) => {
          const items = published.filter((r) => r.gradeLevel === grade);
          return [
            grade,
            items[0]?.keyStage ?? "—",
            items.length,
            items.reduce((sum, r) => sum + r.downloads, 0),
            items.reduce((sum, r) => sum + r.views, 0),
          ];
        }),
      };
    }

    if (key === "by-district") {
      const rows: (string | number)[][] = [];
      SUB_OFFICE_NAMES.forEach((office) => {
        const items = published.filter((r) => r.subOffices.includes(office));
        if (items.length === 0) return;
        rows.push([
          office,
          items[0]?.subOffices[0] ?? office,
          items.length,
          items.reduce((sum, r) => sum + r.downloads, 0),
          downloadEvents.filter((e) => e.subOffices.includes(office)).length,
        ]);
      });
      return {
        title: "Learning Resources by Sub-Office",
        subtitle: stamp,
        columns: ["Sub-office", "Published LRs", "LR downloads", "Sub-office download events"],
        rows,
      };
    }

    if (key === "by-school") {
      const schools = Array.from(new Set(published.flatMap((r) => r.schools)));
      return {
        title: "Learning Resources by School",
        subtitle: stamp,
        columns: ["School", "Sub-office", "Published LRs", "Downloads", "Avg. rating"],
        rows: schools.map((school) => {
          const items = published.filter((r) => r.schools.includes(school));
          const rated = items.filter((r) => ratings[r.id]);
          const avg = rated.length
            ? rated.reduce((sum, r) => sum + (ratings[r.id]?.average ?? 0), 0) / rated.length
            : 0;
          return [
            school,
            subOfficeFor(school),
            items[0]?.subOffices[0] ?? "—",
            items.length,
            items.reduce((sum, r) => sum + r.downloads, 0),
            avg ? avg.toFixed(2) : "—",
          ];
        }),
      };
    }

    if (key === "downloads-monthly") {
      const buckets: Record<string, number> = {};
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date();
        d.setMonth(d.getMonth() - i, 1);
        buckets[monthKey(d.toISOString())] = 0;
      }
      downloadEvents.forEach((event) => {
        const k = monthKey(event.at);
        if (k in buckets) buckets[k] += 1;
      });
      const entries = Object.entries(buckets);
      return {
        title: "Downloads per Month (Rolling 12 Months)",
        subtitle: stamp,
        columns: ["Month", "Downloads", "Unique resources", "Change vs. previous month"],
        rows: entries.map(([k, value], i) => {
          const unique = new Set(downloadEvents.filter((e) => monthKey(e.at) === k).map((e) => e.resourceId)).size;
          const prev = i > 0 ? entries[i - 1][1] : 0;
          const delta = prev ? `${(((value - prev) / prev) * 100).toFixed(1)}%` : "—";
          return [monthLabel(k), value, unique, delta];
        }),
      };
    }

    if (key === "active-users") {
      return {
        title: "Registered Users and Activity",
        subtitle: stamp,
        columns: ["User ID", "Name", "Username", "Role", "School", "Sub-office", "Status", "Last active"],
        rows: users.map((user) => [
          user.id,
          user.name,
          user.username,
          user.role === "admin" ? "System Administrator" : "Viewer",
          user.school,
          user.subOffice,
          user.active ? "Active" : "Deactivated",
          formatDate(user.lastActive),
        ]),
      };
    }

    if (key === "most-viewed") {
      return {
        title: "Most Viewed Learning Resources",
        subtitle: stamp,
        columns: ["Rank", "Resource ID", "Title", "Learning area", "Grade", "Views", "Downloads"],
        rows: [...published]
          .sort((a, b) => b.views - a.views)
          .slice(0, 25)
          .map((r, i) => [i + 1, r.id, r.title, r.learningArea, r.gradeLevel, r.views, r.downloads]),
      };
    }

    return {
      title: "Resource Utilization Report",
      subtitle: stamp,
      columns: [
        "Resource ID",
        "Title",
        "Learning area",
        "Grade",
        "Type",
        "Views",
        "Downloads",
        "Download rate",
        "Rating",
      ],
      rows: [...published]
        .sort((a, b) => b.downloads - a.downloads)
        .map((r) => [
          r.id,
          r.title,
          r.learningArea,
          r.gradeLevel,
          r.resourceType,
          r.views,
          r.downloads,
          r.views ? `${((r.downloads / r.views) * 100).toFixed(1)}%` : "—",
          ratings[r.id] ? (ratings[r.id]?.average ?? 0).toFixed(2) : "—",
        ]),
    };
  }, [key, published, users, downloadEvents, ratings]);

  const fileBase = `SDO-Batangas-LRMS-${key}`;

  return (
    <AdminShell
      title="Reports"
      subtitle="Generate division-level reports and export to Excel, CSV or PDF"
      actions={
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => {
              exportExcel(table, fileBase);
              toast.success("Excel workbook downloaded");
            }}
            className="focus-ring inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-card px-3 py-2 text-[12px] font-medium text-ink hover:border-gold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button
            type="button"
            onClick={() => {
              exportCsv(table, fileBase);
              toast.success("CSV file downloaded");
            }}
            className="focus-ring inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-card px-3 py-2 text-[12px] font-medium text-ink hover:border-gold"
          >
            <FileText className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={() => exportPdf(table)}
            className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-3 py-2 text-[12px] font-semibold text-gold-deep hover:bg-gold-soft"
          >
            <Printer className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[290px_1fr]">
        <aside className="space-y-3">
          <div className="plate overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <Eyebrow className="text-ink">Standard reports</Eyebrow>
            </div>
            <ul className="p-2">
              {REPORTS.map((report) => (
                <li key={report.key}>
                  <button
                    type="button"
                    onClick={() => setKey(report.key)}
                    className={cn(
                      "w-full rounded-sm px-3 py-2.5 text-left transition-colors",
                      key === report.key ? "bg-gold text-white" : "hover:bg-muted",
                    )}
                  >
                    <span className="block text-[13px] font-medium">{report.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px]",
                        key === report.key ? "text-white/60" : "text-muted-foreground",
                      )}
                    >
                      {report.blurb}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="plate p-4 sm:hidden">
            <Eyebrow className="text-ink">Export</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportExcel(table, fileBase)}
                className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px]"
              >
                Excel
              </button>
              <button
                type="button"
                onClick={() => exportCsv(table, fileBase)}
                className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px]"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportPdf(table)}
                className="rounded-sm bg-gold px-3 py-1.5 text-[12px] font-semibold text-gold-deep"
              >
                PDF
              </button>
            </div>
          </div>
        </aside>

        <section className="plate print-area overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-muted/40 px-5 py-4">
            <div>
              <Eyebrow className="text-gold-deep">Republic of the Philippines · Department of Education</Eyebrow>
              <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-bold text-ink">
                <ScrollText className="h-4 w-4 text-gold-deep" /> {table.title}
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{table.subtitle}</p>
            </div>
            <p className="tabular text-[12px] text-muted-foreground">
              {formatNumber(table.rows.length)} row{table.rows.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="max-h-[640px] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0">
                <tr className="bg-gold text-white">
                  {table.columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className={cn("border-b border-border/60", i % 2 === 1 && "bg-muted/30")}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={cn(
                          "px-3 py-2 text-[12.5px] text-ink",
                          typeof cell === "number" && "tabular font-medium text-ink",
                        )}
                      >
                        {typeof cell === "number" ? formatNumber(cell) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.rows.length === 0 && (
                  <tr>
                    <td colSpan={table.columns.length} className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                      No data available for this report yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
