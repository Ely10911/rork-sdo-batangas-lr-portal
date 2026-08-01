import { memo, useMemo } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Eyebrow } from "@/components/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { activeFilterCount } from "@/lib/search";
import {
  FILE_KINDS,
  FILE_KIND_LABEL,
  GRADE_LEVELS,
  KEY_STAGES,
  LANGUAGES,
  LEARNING_AREAS,
  QUARTERS,
  RESOURCE_TYPES,
  SCHOOL_NAMES,
  SCHOOL_YEARS,
  SHS_STRANDS,
  SUB_OFFICE_NAMES,
  UPLOAD_WINDOWS,
} from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";
import type { SearchFilters } from "@/lib/types";

interface Props {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
  className?: string;
}

function FilterSelect({
  label,
  value,
  options,
  anyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  anyLabel: string;
  onChange: (value: string) => void;
}) {
  const dirty = value !== "any";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "h-9 rounded-sm border-input bg-card text-[13px] text-ink",
            dirty && "border-red/70 bg-red/8 font-medium",
          )}
        >
          <SelectValue placeholder={anyLabel} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="any">{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

const toOptions = (values: string[]): { value: string; label: string }[] =>
  values.map((v) => ({ value: v, label: v }));

function FilterRailBase({ filters, onChange, onReset, className }: Props) {
  const { resources } = useLrms();

  const subjectOptions = useMemo(() => {
    const filtered = filters.learningArea !== "any"
      ? resources.filter((r) => r.learningArea === filters.learningArea)
      : resources;
    const subjects = Array.from(new Set(filtered.map((r) => r.subject).filter(Boolean)));
    return toOptions(subjects.sort());
  }, [filters.learningArea, resources]);

  const authorOptions = useMemo(
    () => toOptions(Array.from(new Set(resources.map((r) => r.author))).sort()),
    [resources],
  );

  const count = activeFilterCount(filters);

  return (
    <div className={cn("plate overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-red-dark" strokeWidth={1.8} />
          <Eyebrow className="text-ink">Refine results</Eyebrow>
          {count > 0 && (
            <span className="tabular rounded-full bg-red px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {count}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="focus-ring inline-flex items-center gap-1 rounded-sm text-[11px] font-medium text-muted-foreground transition-colors hover:text-red-dark"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="space-y-3.5 p-4">
        <FilterSelect
          label="Learning area"
          value={filters.learningArea}
          anyLabel="All learning areas"
          options={toOptions(LEARNING_AREAS)}
          onChange={(v) => onChange({ learningArea: v, subject: "any" })}
        />
        <FilterSelect
          label="Subject"
          value={filters.subject}
          anyLabel="All subjects"
          options={subjectOptions}
          onChange={(v) => onChange({ subject: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label="Grade level"
            value={filters.gradeLevel}
            anyLabel="All grades"
            options={toOptions(GRADE_LEVELS)}
            onChange={(v) => onChange({ gradeLevel: v })}
          />
          <FilterSelect
            label="Quarter"
            value={filters.quarter}
            anyLabel="All quarters"
            options={QUARTERS.map((q) => ({ value: q, label: q.replace("Quarter", "Q") }))}
            onChange={(v) => onChange({ quarter: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label="Key stage"
            value={filters.keyStage}
            anyLabel="All key stages"
            options={toOptions(KEY_STAGES)}
            onChange={(v) => onChange({ keyStage: v })}
          />
          <FilterSelect
            label="SHS strand"
            value={filters.shsStrand}
            anyLabel="All strands"
            options={toOptions(SHS_STRANDS)}
            onChange={(v) => onChange({ shsStrand: v })}
          />
        </div>
        <FilterSelect
          label="Resource type"
          value={filters.resourceType}
          anyLabel="All resource types"
          options={toOptions(RESOURCE_TYPES)}
          onChange={(v) => onChange({ resourceType: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label="File type"
            value={filters.fileKind}
            anyLabel="All file types"
            options={FILE_KINDS.map((k) => ({ value: k, label: FILE_KIND_LABEL[k] }))}
            onChange={(v) => onChange({ fileKind: v })}
          />
          <FilterSelect
            label="Language"
            value={filters.language}
            anyLabel="All languages"
            options={toOptions(LANGUAGES)}
            onChange={(v) => onChange({ language: v })}
          />
        </div>
        <FilterSelect
          label="Sub-office"
          value={filters.subOffice}
          anyLabel="All sub-offices"
          options={toOptions(SUB_OFFICE_NAMES)}
          onChange={(v) => onChange({ subOffice: v })}
        />
        <FilterSelect
          label="School"
          value={filters.school}
          anyLabel="All schools"
          options={toOptions(SCHOOL_NAMES)}
          onChange={(v) => onChange({ school: v })}
        />
        <FilterSelect
          label="Author"
          value={filters.author}
          anyLabel="All authors"
          options={authorOptions}
          onChange={(v) => onChange({ author: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label="School year"
            value={filters.schoolYear}
            anyLabel="All years"
            options={toOptions(SCHOOL_YEARS)}
            onChange={(v) => onChange({ schoolYear: v })}
          />
          <FilterSelect
            label="Upload date"
            value={filters.uploadedWithin}
            anyLabel="Any time"
            options={UPLOAD_WINDOWS.filter((w) => w.value !== "any")}
            onChange={(v) => onChange({ uploadedWithin: v })}
          />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Competency code
          </span>
          <Input
            value={filters.competencyCode}
            onChange={(event) => onChange({ competencyCode: event.target.value })}
            placeholder="e.g. EN7RC-Ia"
            className={cn(
              "h-9 rounded-sm border-input bg-card font-mono text-[12px]",
              filters.competencyCode && "border-red/70 bg-red/8",
            )}
          />
        </label>
      </div>
    </div>
  );
}

export const FilterRail = memo(FilterRailBase);
