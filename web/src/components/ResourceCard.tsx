import { memo } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Download, Eye } from "lucide-react";

import { FileKindTag, MetaChip, StarRating, StatusPill } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { formatNumber, formatRelative, formatSize } from "@/lib/format";
import { useLrms, useRatingIndex } from "@/lib/store";
import type { LearningResource } from "@/lib/types";

interface Props {
  resource: LearningResource;
  variant?: "grid" | "row";
  showStatus?: boolean;
  index?: number;
}

function ResourceCardBase({ resource, variant = "grid", showStatus = false, index = 0 }: Props) {
  const { bookmarks, toggleBookmark } = useLrms();
  const ratings = useRatingIndex();
  const rating = ratings[resource.id] ?? { average: 0, count: 0 };
  const saved = bookmarks.includes(resource.id);

  const bookmarkButton = (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        toggleBookmark(resource.id);
      }}
      aria-label={saved ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-sm border transition-colors",
        saved ? "border-gold bg-gold/20 text-gold-deep" : "border-border bg-background/60 text-muted-foreground hover:border-gold/60 hover:text-gold-deep",
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-gold text-gold-deep")} strokeWidth={1.8} />
    </button>
  );

  if (variant === "row") {
    return (
      <Link
        to={`/resource/${resource.id}`}
        className="group flex items-start gap-4 border-b border-border/70 px-4 py-4 transition-colors last:border-b-0 hover:bg-gold/5"
      >
        <div className="mt-0.5 flex flex-col items-center gap-2">
          <FileKindTag kind={resource.fileKind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">{resource.id}</span>
            {showStatus && <StatusPill status={resource.status} />}
          </div>
          <h3 className="mt-1 truncate font-display text-base font-semibold text-ink group-hover:text-gold-deep">
            {resource.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground">
            {resource.gradeLevel} · {resource.learningArea} · {resource.quarter} · {resource.school}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-5 text-[12px] text-muted-foreground sm:flex">
          <span className="tabular inline-flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> {formatNumber(resource.downloads)}
          </span>
          <StarRating value={rating.average} count={rating.count} size={12} />
        </div>
        {bookmarkButton}
      </Link>
    );
  }

  return (
    <Link
      to={`/resource/${resource.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="plate card-hover group flex animate-fade-rise flex-col overflow-hidden"
    >
      <div className="relative flex items-start justify-between gap-3 border-b border-border/70 bg-gradient-to-br from-muted/60 to-background px-4 py-3">
        <div className="hatch pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-wrap items-center gap-2">
          <FileKindTag kind={resource.fileKind} />
          <MetaChip tone="ink">{resource.quarter.replace("Quarter", "Q")}</MetaChip>
          {resource.featured && <MetaChip tone="gold">Featured</MetaChip>}
        </div>
        <div className="relative">{bookmarkButton}</div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          {resource.id} · {resource.competencyCode}
        </span>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[17px] font-semibold leading-snug text-ink transition-colors group-hover:text-gold-deep">
          {resource.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{resource.learningCompetency}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <MetaChip>{resource.gradeLevel}</MetaChip>
          <MetaChip>{resource.learningArea}</MetaChip>
          <MetaChip>{resource.resourceType}</MetaChip>
        </div>

        <div className="mt-auto pt-4">
          {showStatus && (
            <div className="mb-2">
              <StatusPill status={resource.status} />
            </div>
          )}
          <div className="flex items-center justify-between border-t border-dashed border-border pt-3 text-[11px] text-muted-foreground">
            <StarRating value={rating.average} count={rating.count} size={12} />
            <span className="tabular flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {formatNumber(resource.views)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> {formatNumber(resource.downloads)}
              </span>
            </span>
          </div>
          <p className="mt-2 truncate text-[11px] text-muted-foreground/80">
            {formatSize(resource.fileSizeKB)} · {resource.language} · {formatRelative(resource.dateUploaded)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export const ResourceCard = memo(ResourceCardBase);
