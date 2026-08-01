import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, SearchX, SlidersHorizontal, X } from "lucide-react";

import { PortalShell } from "@/components/PortalShell";
import { SearchCommand } from "@/components/SearchCommand";
import { FilterRail } from "@/components/FilterRail";
import { ResourceCard } from "@/components/ResourceCard";
import { Eyebrow } from "@/components/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EMPTY_FILTERS, activeFilterCount, searchResources } from "@/lib/search";
import { SORT_OPTIONS } from "@/lib/taxonomy";
import { useLrms, useRatingIndex } from "@/lib/store";
import { formatNumber } from "@/lib/format";
import type { SearchFilters, SortKey } from "@/lib/types";

const PAGE_SIZE = 12;

const FILTER_LABELS: Partial<Record<keyof SearchFilters, string>> = {
  learningArea: "Learning area",
  gradeLevel: "Grade",
  quarter: "Quarter",
  subject: "Subject",
  keyStage: "Key stage",
  shsStrand: "Strand",
  resourceType: "Type",
  fileKind: "File",
  language: "Language",
  school: "School",
  subOffice: "Sub-office",
  schoolYear: "School year",
  author: "Author",
  uploadedWithin: "Uploaded",
  competencyCode: "Competency",
};

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const { resources } = useLrms();
  const ratingIndex = useRatingIndex();

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...EMPTY_FILTERS,
    query: params.get("q") ?? "",
    learningArea: params.get("area") ?? "any",
    gradeLevel: params.get("grade") ?? "any",
    resourceType: params.get("type") ?? "any",
  }));
  const [draftQuery, setDraftQuery] = useState<string>(filters.query);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [visible, setVisible] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.query) next.set("q", filters.query);
    if (filters.learningArea !== "any") next.set("area", filters.learningArea);
    if (filters.gradeLevel !== "any") next.set("grade", filters.gradeLevel);
    if (filters.resourceType !== "any") next.set("type", filters.resourceType);
    setParams(next, { replace: true });
  }, [filters.query, filters.learningArea, filters.gradeLevel, filters.resourceType, setParams]);

  const patch = useCallback((update: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setVisible(PAGE_SIZE);
  }, []);

  const reset = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS });
    setDraftQuery("");
    setVisible(PAGE_SIZE);
  }, []);

  const results = useMemo(
    () => searchResources(resources, filters, { ratingIndex }),
    [resources, filters, ratingIndex],
  );

  const chips = useMemo(
    () =>
      (Object.keys(FILTER_LABELS) as (keyof SearchFilters)[])
        .filter((key) => {
          const value = filters[key];
          return typeof value === "string" && value && value !== "any";
        })
        .map((key) => ({ key, label: FILTER_LABELS[key] ?? key, value: String(filters[key]) })),
    [filters],
  );

  const rail = <FilterRail filters={filters} onChange={patch} onReset={reset} />;

  return (
    <PortalShell>
      <section className="ink-panel relative overflow-hidden border-b border-gold-deep/40">
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="container relative py-10">
          <Eyebrow className="text-gold-soft">Advanced search engine</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Learning resource catalog</h1>
          <p className="mt-2 max-w-2xl text-[13px] text-white/60">
            Search across {formatNumber(resources.filter((r) => r.status === "published").length)} published resources by
            keyword, competency code, learning area, author, school and more.
          </p>
          <div className="mt-6 max-w-3xl">
            <SearchCommand
              size="hero"
              value={draftQuery}
              onChange={setDraftQuery}
              onSubmit={(value) => patch({ query: value })}
            />
          </div>
        </div>
      </section>

      <div className="container grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{rail}</div>
        </aside>

        <div className="min-w-0">
          <div className="plate mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
            <p className="text-[13px] text-ink">
              <span className="tabular font-display text-xl font-bold">{formatNumber(results.length)}</span>{" "}
              <span className="text-muted-foreground">
                result{results.length === 1 ? "" : "s"}
                {filters.query && (
                  <>
                    {" "}
                    for <span className="font-medium text-ink">“{filters.query}”</span>
                  </>
                )}
              </span>
            </p>

            <div className="ml-auto flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="focus-ring inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-ink lg:hidden"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                    {activeFilterCount(filters) > 0 && (
                      <span className="tabular rounded-full bg-gold px-1.5 text-[10px] text-white">
                        {activeFilterCount(filters)}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] overflow-y-auto bg-background p-4">
                  {rail}
                </SheetContent>
              </Sheet>

              <Select value={filters.sort} onValueChange={(value) => patch({ sort: value as SortKey })}>
                <SelectTrigger className="h-9 w-[168px] rounded-sm border-input bg-card text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex overflow-hidden rounded-sm border border-border">
                {(["grid", "list"] as const).map((mode) => {
                  const Icon = mode === "grid" ? LayoutGrid : List;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setLayout(mode)}
                      aria-label={`${mode} view`}
                      className={cn(
                        "grid h-9 w-9 place-items-center transition-colors",
                        layout === mode ? "bg-gold text-white" : "bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => patch({ [chip.key]: chip.key === "competencyCode" ? "" : "any" } as Partial<SearchFilters>)}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/12 px-2.5 py-1 text-[11px] text-gold-deep transition-colors hover:bg-gold/20"
                >
                  <span className="font-semibold">{chip.label}:</span> {chip.value}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={reset}
                className="focus-ring rounded-full px-2 py-1 text-[11px] text-muted-foreground underline hover:text-ink"
              >
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="plate flex flex-col items-center gap-3 px-6 py-16 text-center">
              <SearchX className="h-8 w-8 text-gold-deep" strokeWidth={1.6} />
              <h2 className="font-display text-xl font-semibold text-ink">No matching resources</h2>
              <p className="max-w-md text-[13px] text-muted-foreground">
                Try a broader keyword, remove a filter, or search by competency code (for example{" "}
                <span className="font-mono text-ink">M9AL-Ig-2</span>).
              </p>
              <button
                type="button"
                onClick={reset}
                className="focus-ring mt-2 rounded-sm bg-gold px-4 py-2 text-[13px] font-medium text-white hover:bg-gold-deep"
              >
                Reset search
              </button>
            </div>
          ) : layout === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.slice(0, visible).map((resource, i) => (
                <ResourceCard key={resource.id} resource={resource} index={i} />
              ))}
            </div>
          ) : (
            <div className="plate overflow-hidden">
              {results.slice(0, visible).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} variant="row" />
              ))}
            </div>
          )}

          {visible < results.length && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="focus-ring rounded-sm border border-gold/25 bg-card px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-gold hover:text-gold-deep"
              >
                Load {Math.min(PAGE_SIZE, results.length - visible)} more resources
              </button>
              <p className="tabular text-[11px] text-muted-foreground">
                Showing {visible} of {results.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
