import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Download, FileStack, Flame, Megaphone, Sparkles, TrendingUp, Users } from "lucide-react";

import { PortalShell } from "@/components/PortalShell";
import { SearchCommand } from "@/components/SearchCommand";
import { ResourceCard } from "@/components/ResourceCard";
import { Eyebrow, MetaChip, SectionHeading } from "@/components/atoms";
import { useLrms } from "@/lib/store";
import { formatNumber, formatRelative } from "@/lib/format";
import { GRADE_LEVELS, LEARNING_AREAS } from "@/lib/taxonomy";

const AREA_ACCENT: Record<string, string> = {
  Filipino: "from-[hsl(8_58%_44%)]/18",
  English: "from-[hsl(210_58%_40%)]/18",
  Mathematics: "from-[hsl(34_68%_52%)]/22",
  Science: "from-[hsl(183_52%_28%)]/18",
  "Araling Panlipunan": "from-[hsl(268_38%_46%)]/16",
  "Edukasyon sa Pagpapakatao": "from-[hsl(150_42%_32%)]/16",
  MAPEH: "from-[hsl(320_38%_44%)]/16",
  "TLE / EPP": "from-[hsl(24_72%_46%)]/18",
  "Reading & Literacy": "from-[hsl(198_48%_38%)]/18",
  Makabansa: "from-[hsl(45_62%_44%)]/20",
};

export default function Home() {
  const navigate = useNavigate();
  const { resources, users, downloadEvents, notifications } = useLrms();
  const [query, setQuery] = useState<string>("");

  const published = useMemo(() => resources.filter((r) => r.status === "published"), [resources]);

  const stats = useMemo(() => {
    const downloads = published.reduce((sum, r) => sum + r.downloads, 0);
    const views = published.reduce((sum, r) => sum + r.views, 0);
    return {
      resources: published.length,
      downloads,
      views,
      contributors: new Set(published.map((r) => r.author)).size,
      schools: new Set(published.map((r) => r.school)).size,
      users: users.length,
      thisMonth: downloadEvents.filter((e) => Date.now() - new Date(e.at).getTime() < 30 * 86400000).length,
    };
  }, [published, users, downloadEvents]);

  const featured = useMemo(
    () => published.filter((r) => r.featured).slice(0, 3),
    [published],
  );
  const trending = useMemo(() => [...published].sort((a, b) => b.downloads - a.downloads).slice(0, 6), [published]);
  const newest = useMemo(
    () => [...published].sort((a, b) => (a.dateUploaded < b.dateUploaded ? 1 : -1)).slice(0, 5),
    [published],
  );

  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    published.forEach((r) => {
      counts[r.learningArea] = (counts[r.learningArea] ?? 0) + 1;
    });
    return counts;
  }, [published]);

  const curriculumNote = notifications.find((n) => n.kind === "curriculum");

  const runSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    navigate(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <PortalShell>
      {/* Hero */}
      <section className="ink-panel relative overflow-hidden">
        <div className="grid-lines absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-verdigris/15 blur-[90px]" />

        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex animate-fade-in items-center gap-3">
              <span className="rule-gold w-10" />
              <Eyebrow className="text-gold-soft">Learning Resource Management System</Eyebrow>
            </div>
            <h1 className="mt-5 animate-fade-rise font-display text-4xl font-bold leading-[1.05] tracking-tight text-parchment md:text-6xl">
              Every quality-assured learning resource of Batangas,
              <span className="text-gold"> in one archive.</span>
            </h1>
            <p className="mt-5 max-w-2xl animate-fade-rise text-[15px] leading-relaxed text-parchment/70 md:text-base">
              Search, preview and download modules, activity sheets, video lessons and contextualized materials mapped
              to MELCs and the MATATAG curriculum — prepared by teachers of the Schools Division Office of Batangas.
            </p>

            <div className="mt-8 animate-fade-rise">
              <SearchCommand
                size="hero"
                value={query}
                onChange={setQuery}
                onSubmit={runSearch}
                placeholder="Try “Taal volcano”, “EN7RC-Ia”, “Grade 9 quadratic”…"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-parchment/45">Popular:</span>
                {["Marungko", "Subli folk dance", "quadratic", "dengue", "MATATAG"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQuery(chip);
                      runSearch(chip);
                    }}
                    className="focus-ring rounded-full border border-parchment/20 px-3 py-1 text-[11px] text-parchment/70 transition-colors hover:border-gold/60 hover:text-gold-soft"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <dl className="mt-14 grid gap-px overflow-hidden rounded-md border border-parchment/12 bg-parchment/8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Published resources", value: stats.resources, icon: FileStack },
              { label: "Total downloads", value: stats.downloads, icon: Download },
              { label: "Contributing schools", value: stats.schools, icon: Users },
              { label: "Downloads this month", value: stats.thisMonth, icon: TrendingUp },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="ink-panel px-5 py-5">
                  <Icon className="h-4 w-4 text-gold" strokeWidth={1.8} />
                  <dd className="tabular mt-3 font-display text-3xl font-bold text-parchment">
                    {formatNumber(stat.value)}
                  </dd>
                  <dt className="mt-1 text-[12px] text-parchment/55">{stat.label}</dt>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* Curriculum ticker */}
      {curriculumNote && (
        <section className="border-b border-gold/30 bg-gold/12">
          <div className="container flex items-center gap-3 py-3">
            <span className="flex shrink-0 items-center gap-2 rounded-sm bg-ink px-2 py-1">
              <Megaphone className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
              <span className="eyebrow text-parchment">Advisory</span>
            </span>
            <p className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">
              <span className="font-semibold text-ink">{curriculumNote.title}.</span> {curriculumNote.body}
            </p>
            <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">
              {formatRelative(curriculumNote.at)}
            </span>
          </div>
        </section>
      )}

      {/* Learning areas */}
      <section className="container py-14">
        <SectionHeading
          eyebrow="Classification"
          title="Browse by learning area"
          action={
            <Link
              to="/browse"
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-[13px] font-semibold text-gold-deep hover:underline"
            >
              Open full catalog <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LEARNING_AREAS.map((area, i) => (
            <Link
              key={area}
              to={`/browse?area=${encodeURIComponent(area)}`}
              style={{ animationDelay: `${i * 35}ms` }}
              className={`plate card-hover group relative animate-fade-rise overflow-hidden p-4`}
            >
              <span
                className={`absolute inset-0 bg-gradient-to-br ${AREA_ACCENT[area] ?? "from-gold/15"} to-transparent opacity-70`}
              />
              <span className="relative flex h-full flex-col">
                <span className="tabular font-display text-2xl font-bold text-ink">{areaCounts[area] ?? 0}</span>
                <span className="mt-1 text-[13px] font-semibold leading-snug text-ink-soft">{area}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-gold-deep opacity-0 transition-opacity group-hover:opacity-100">
                  Browse <ArrowRight className="h-3 w-3" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">By grade level</span>
          {GRADE_LEVELS.map((grade) => (
            <Link
              key={grade}
              to={`/browse?grade=${encodeURIComponent(grade)}`}
              className="focus-ring rounded-sm border border-border bg-card px-2.5 py-1 text-[12px] text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
            >
              {grade === "Kindergarten" ? "Kinder" : grade.replace("Grade ", "G")}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container pb-14">
        <SectionHeading eyebrow="Curated by the division" title="Featured this quarter" />
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((resource, i) => (
            <ResourceCard key={resource.id} resource={resource} index={i} />
          ))}
        </div>
      </section>

      {/* Trending + newest */}
      <section className="container grid gap-8 pb-16 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <SectionHeading
            eyebrow="Download analytics"
            title="Most downloaded resources"
            action={
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-gold-deep" /> updated live
              </span>
            }
          />
          <div className="plate overflow-hidden">
            {trending.map((resource, i) => (
              <div key={resource.id} className="flex items-center">
                <span className="tabular w-10 shrink-0 pl-4 font-display text-lg font-bold text-gold-deep/60">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <ResourceCard resource={resource} variant="row" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Repository activity" title="Recently uploaded" />
          <ol className="plate divide-y divide-border/70 overflow-hidden">
            {newest.map((resource) => (
              <li key={resource.id}>
                <Link to={`/resource/${resource.id}`} className="block px-4 py-3.5 transition-colors hover:bg-gold/6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">{resource.id}</span>
                    <span className="text-[11px] text-muted-foreground">{formatRelative(resource.dateUploaded)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-display text-[14px] font-semibold leading-snug text-ink">
                    {resource.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <MetaChip>{resource.gradeLevel}</MetaChip>
                    <MetaChip tone="gold">{resource.resourceType}</MetaChip>
                  </div>
                </Link>
              </li>
            ))}
          </ol>

          <div className="plate mt-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-gold-deep" />
              <Eyebrow className="text-ink-soft">For teachers</Eyebrow>
            </div>
            <div className="space-y-3 p-4 text-[13px] leading-relaxed text-muted-foreground">
              <p>
                Save resources to <span className="font-semibold text-ink">My Library</span>, organize them into
                collections for Catch-Up Fridays, and rate materials to guide fellow teachers.
              </p>
              <Link
                to="/library"
                className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-[13px] font-semibold text-gold-deep hover:underline"
              >
                Open my library <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PortalShell>
  );
}
