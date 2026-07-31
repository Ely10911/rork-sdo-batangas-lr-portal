import {
  AudioLines,
  BookOpen,
  FileText,
  FileType2,
  Image as ImageIcon,
  Presentation,
  Star,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FileKind, ResourceStatus } from "@/lib/types";

const GLYPHS: Record<FileKind, { icon: LucideIcon; tint: string; label: string }> = {
  pdf: { icon: FileText, tint: "text-[hsl(8_58%_46%)]", label: "PDF" },
  docx: { icon: FileType2, tint: "text-[hsl(210_58%_40%)]", label: "DOCX" },
  pptx: { icon: Presentation, tint: "text-[hsl(24_72%_46%)]", label: "PPTX" },
  epub: { icon: BookOpen, tint: "text-[hsl(268_38%_46%)]", label: "EPUB" },
  video: { icon: Video, tint: "text-[hsl(183_52%_30%)]", label: "VIDEO" },
  audio: { icon: AudioLines, tint: "text-[hsl(150_42%_32%)]", label: "AUDIO" },
  image: { icon: ImageIcon, tint: "text-[hsl(320_38%_44%)]", label: "IMAGE" },
};

export function FileGlyph({ kind, className }: { kind: FileKind; className?: string }) {
  const glyph = GLYPHS[kind];
  const Icon = glyph.icon;
  return <Icon className={cn("h-4 w-4", glyph.tint, className)} strokeWidth={1.7} aria-hidden />;
}

export function FileKindTag({ kind, className }: { kind: FileKind; className?: string }) {
  const glyph = GLYPHS[kind];
  const Icon = glyph.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-border/80 bg-background/70 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.12em]",
        glyph.tint,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
      {glyph.label}
    </span>
  );
}

const STATUS_STYLES: Record<ResourceStatus, string> = {
  published: "border-[hsl(150_42%_32%)]/35 bg-[hsl(150_42%_32%)]/12 text-[hsl(150_48%_24%)]",
  pending: "border-gold/45 bg-gold/15 text-gold-deep",
  draft: "border-border bg-muted text-muted-foreground",
  archived: "border-ink/20 bg-ink/8 text-ink-soft",
};

const STATUS_LABEL: Record<ResourceStatus, string> = {
  published: "Published",
  pending: "For QA review",
  draft: "Draft",
  archived: "Archived",
};

export function StatusPill({ status, className }: { status: ResourceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StarRating({
  value,
  count,
  size = 14,
  className,
  onSelect,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
  onSelect?: (stars: number) => void;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex items-center gap-0.5">
        {stars.map((s) => {
          const filled = value >= s - 0.35;
          const star = (
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-transform",
                filled ? "fill-gold text-gold" : "text-ink/25",
                onSelect ? "hover:scale-125" : "",
              )}
              strokeWidth={1.6}
              aria-hidden
            />
          );
          return onSelect ? (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className="focus-ring rounded-sm"
              aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
            >
              {star}
            </button>
          ) : (
            <span key={s}>{star}</span>
          );
        })}
      </span>
      {typeof count === "number" && (
        <span className="tabular text-[11px] text-muted-foreground">
          {value > 0 ? value.toFixed(1) : "—"}
          {count > 0 ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow text-gold-deep", className)}>{children}</p>;
}

export function MetaChip({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "ink" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] leading-tight",
        tone === "default" && "bg-muted text-ink-soft",
        tone === "ink" && "bg-ink/8 text-ink",
        tone === "gold" && "bg-gold/15 text-gold-deep",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-[26px]">{title}</h2>
        <div className="rule-gold mt-2 w-16 origin-left animate-rule-in" />
      </div>
      {action}
    </div>
  );
}
