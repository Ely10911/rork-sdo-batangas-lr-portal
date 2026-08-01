import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Eyebrow } from "@/components/atoms";
import { resolvePublicUrl } from "@/lib/cloud";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { FILE_KIND_LABEL } from "@/lib/taxonomy";
import type { LearningResource } from "@/lib/types";

interface Props {
  resource: LearningResource;
}

/** Returns the effective preview URL — link-based resources use linkUrl, storage-based use publicUrl. */
function usePreviewUrl(resource: LearningResource): string | null {
  return useMemo(() => {
    if (resource.linkUrl) return resource.linkUrl;
    return resolvePublicUrl(resource.storagePath);
  }, [resource.linkUrl, resource.storagePath]);
}

/** Detects YouTube/Vimeo embed URLs. */
function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const ytList = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytList) return url;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** Builds the deterministic page/slide outline that the in-browser viewer renders. */
function buildOutline(resource: LearningResource): { heading: string; body: string[] }[] {
  const activity = resource.language === "Filipino" ? "Gawain" : "Activity";
  const base = [
    {
      heading: "Title Page",
      body: [
        resource.division,
        `${resource.gradeLevel} · ${resource.learningArea}`,
        resource.title,
        `${resource.resourceType} — ${resource.quarter}`,
        `Prepared by ${resource.author}, ${resource.school}`,
      ],
    },
    {
      heading: "Learning Competency",
      body: [
        `Code: ${resource.competencyCode}`,
        resource.learningCompetency,
        `Reference: ${resource.melcReference}`,
        "At the end of this material, the learner is expected to demonstrate mastery of the competency above through guided and independent practice.",
      ],
    },
    {
      heading: "What I Need to Know",
      body: [
        resource.description,
        "Read the discussion carefully before proceeding to the exercises. Answer all items in your notebook or answer sheet.",
      ],
    },
    {
      heading: `${activity} 1 — Let's Try`,
      body: [
        "Directions: Study each item and write the letter of the correct answer.",
        "1. Which statement best describes the concept presented in the lesson?",
        "2. Give one real-life example from your own community.",
        "3. Explain your answer briefly in two to three sentences.",
      ],
    },
    {
      heading: `${activity} 2 — Deepen`,
      body: [
        "Directions: Complete the graphic organizer using the concepts discussed.",
        "Reflect: How can you apply this competency inside and outside the classroom?",
      ],
    },
    {
      heading: "Assessment & Answer Key",
      body: [
        "A 10-item mastery check with rubric is provided for teacher use.",
        `Quality assured by the ${resource.division} — Curriculum Implementation Division.`,
        `Copyright: ${resource.copyright}`,
      ],
    },
  ];
  const totalPages = Math.max(resource.pages || 6, 6);
  const out = [...base];
  while (out.length < Math.min(totalPages, 14)) {
    const n = out.length - 4;
    out.splice(out.length - 1, 0, {
      heading: `${activity} ${n + 1} — Practice Set`,
      body: [
        "Directions: Answer the exercises that follow. Show your solution or reasoning.",
        `Item set ${n + 1} focuses on ${resource.subject.toLowerCase()} within ${resource.quarter.toLowerCase()}.`,
        "Teacher's note: allow learners to work in pairs before independent practice.",
      ],
    });
  }
  return out;
}

function DocumentSurface({ resource }: Props) {
  const outline = useMemo(() => buildOutline(resource), [resource]);
  const [page, setPage] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const current = outline[page];
  const previewUrl = usePreviewUrl(resource);

  // Render the real PDF in an iframe when a link is available.
  if (previewUrl && resource.fileKind === "pdf") {
    return (
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
          <Eyebrow className="text-ink">{FILE_KIND_LABEL[resource.fileKind]} viewer</Eyebrow>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink hover:border-red/60"
          >
            <ExternalLink className="h-3 w-3" /> Open in new tab
          </a>
        </div>
        <div className="flex max-h-[600px] justify-center overflow-auto bg-red/5 p-5">
          <iframe
            key={previewUrl}
            src={previewUrl}
            title={`Preview of ${resource.title}`}
            className="h-[600px] w-full max-w-[820px] rounded-sm border border-border bg-white shadow-lift"
          />
        </div>
      </div>
    );
  }

  // For DOCX/EPUB with a link, show an "open externally" prompt.
  if (previewUrl && (resource.fileKind === "docx" || resource.fileKind === "epub")) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
          <Eyebrow className="text-ink">{FILE_KIND_LABEL[resource.fileKind]} preview</Eyebrow>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink hover:border-red/60"
          >
            <ExternalLink className="h-3 w-3" /> Open file
          </a>
        </div>
        <div className="flex max-h-[560px] justify-center overflow-auto bg-red/5 p-5">
          <div className="w-full max-w-[520px] animate-fade-in rounded-sm border border-border bg-white p-8 shadow-lift">
            <div className="flex items-center justify-between border-b border-red/40 pb-2">
              <span className="eyebrow text-red-dark">{resource.division}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{resource.id}</span>
            </div>
            <h4 className="mt-5 font-display text-xl font-semibold leading-tight text-ink">{resource.title}</h4>
            <p className="mt-3 text-[13px] leading-relaxed text-ink">
              {FILE_KIND_LABEL[resource.fileKind]} file linked from an external source. Click "Open file" above to view
              the full document in a new tab.
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-5 inline-flex items-center gap-2 rounded-sm bg-red px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-dark"
            >
              <ExternalLink className="h-4 w-4" /> Open {resource.fileKind.toUpperCase()}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eyebrow className="text-ink">{FILE_KIND_LABEL[resource.fileKind]} viewer</Eyebrow>
          <span className="tabular text-[11px] text-muted-foreground">
            Page {page + 1} of {outline.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-ink hover:border-red/60"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="tabular w-12 text-center text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-ink hover:border-red/60"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="focus-ring ml-2 grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-ink hover:border-red/60 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(outline.length - 1, p + 1))}
            disabled={page === outline.length - 1}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-ink hover:border-red/60 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex max-h-[560px] justify-center overflow-auto bg-red/5 p-5">
        <div
          key={page}
          style={{ transform: `scale(${zoom})` }}
          className="w-full max-w-[520px] origin-top animate-fade-in rounded-sm border border-border bg-white p-8 shadow-lift transition-transform"
        >
          <div className="flex items-center justify-between border-b border-red/40 pb-2">
            <span className="eyebrow text-red-dark">{resource.division}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{resource.id}</span>
          </div>
          <h4 className="mt-5 font-display text-xl font-semibold leading-tight text-ink">{current.heading}</h4>
          <div className="paper-lines mt-4 space-y-3">
            {current.body.map((line, i) => (
              <p key={i} className="text-[13px] leading-7 text-ink">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
            <span>{resource.competencyCode}</span>
            <span>
              {resource.gradeLevel} · {resource.quarter}
            </span>
            <span className="tabular">{page + 1}</span>
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-border bg-muted/40 px-4 py-3">
        {outline.map((section, i) => (
          <button
            key={section.heading}
            type="button"
            onClick={() => setPage(i)}
            className={cn(
              "focus-ring flex h-16 w-12 shrink-0 flex-col justify-between rounded-sm border p-1 text-left transition-all",
              i === page ? "border-red bg-card shadow-plate" : "border-border/70 bg-card/60 hover:border-red/50",
            )}
            aria-label={`Go to page ${i + 1}`}
          >
            <span className="h-0.5 w-6 bg-red/30" />
            <span className="space-y-0.5">
              <span className="block h-0.5 w-full bg-red/12" />
              <span className="block h-0.5 w-4/5 bg-red/12" />
              <span className="block h-0.5 w-full bg-red/12" />
            </span>
            <span className="tabular text-[9px] text-muted-foreground">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SlideSurface({ resource }: Props) {
  const outline = useMemo(() => buildOutline(resource), [resource]);
  const [slide, setSlide] = useState<number>(0);
  const current = outline[slide];
  const previewUrl = usePreviewUrl(resource);

  // If there's a link (e.g. Google Slides), embed it.
  if (previewUrl) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
          <Eyebrow className="text-ink">PowerPoint preview</Eyebrow>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink hover:border-red/60"
          >
            <ExternalLink className="h-3 w-3" /> Open in new tab
          </a>
        </div>
        <div className="bg-red/5 p-5">
          <iframe
            key={previewUrl}
            src={previewUrl}
            title={`Preview of ${resource.title}`}
            className="aspect-[16/9] w-full max-w-[720px] mx-auto rounded-sm border border-border bg-white shadow-lift"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <Eyebrow className="text-ink">PowerPoint preview</Eyebrow>
        <span className="tabular text-[11px] text-muted-foreground">
          Slide {slide + 1} / {outline.length}
        </span>
      </div>
      <div className="bg-red/5 p-5">
        <div
          key={slide}
          className="red-panel relative mx-auto aspect-[16/9] w-full max-w-[720px] animate-fade-in overflow-hidden rounded-sm shadow-lift"
        >
          <div className="grid-lines absolute inset-0 opacity-60" />
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red via-red-soft to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-8">
            <div>
              <p className="eyebrow text-red-soft">
                {resource.learningArea} · {resource.gradeLevel}
              </p>
              <h4 className="mt-3 max-w-[80%] font-display text-2xl font-semibold leading-tight text-white md:text-3xl">
                {current.heading}
              </h4>
            </div>
            <ul className="space-y-2">
              {current.body.slice(0, 4).map((line, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-white/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                  <span className="line-clamp-2">{line}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-white/15 pt-3 text-[10px] text-white/50">
              <span>{resource.competencyCode}</span>
              <span>
                {resource.author} · {resource.school}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-border bg-muted/40 px-4 py-3">
        {outline.map((section, i) => (
          <button
            key={section.heading}
            type="button"
            onClick={() => setSlide(i)}
            className={cn(
              "focus-ring red-panel h-12 w-20 shrink-0 rounded-sm border p-1.5 text-left transition-all",
              i === slide ? "border-red" : "border-transparent opacity-60 hover:opacity-100",
            )}
            aria-label={`Go to slide ${i + 1}`}
          >
            <span className="block truncate text-[8px] font-medium text-white/90">{section.heading}</span>
            <span className="mt-1 block h-0.5 w-8 bg-red/70" />
          </button>
        ))}
      </div>
    </div>
  );
}

function useSimulatedPlayback(duration: number): {
  playing: boolean;
  position: number;
  toggle: () => void;
  reset: () => void;
  seek: (value: number) => void;
} {
  const [playing, setPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const frame = useRef<number>(0);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const delta = (now - last.current) / 1000;
      last.current = now;
      setPosition((p) => {
        const next = p + delta;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [playing, duration]);

  return {
    playing,
    position,
    toggle: () => {
      setPosition((p) => (p >= duration ? 0 : p));
      setPlaying((p) => !p);
    },
    reset: () => {
      setPlaying(false);
      setPosition(0);
    },
    seek: (value: number) => setPosition(Math.max(0, Math.min(duration, value))),
  };
}

function VideoSurface({ resource }: Props) {
  const duration = resource.durationSec || 480;
  const { playing, position, toggle, reset, seek } = useSimulatedPlayback(duration);
  const progress = (position / duration) * 100;
  const previewUrl = usePreviewUrl(resource);

  const chapters = useMemo(
    () => buildOutline(resource).slice(0, 5).map((s, i) => ({ label: s.heading, at: (duration / 5) * i })),
    [resource, duration],
  );

  // When a link is available, embed the video (YouTube/Vimeo → embed, direct → <video>).
  if (previewUrl) {
    const embedUrl = toEmbedUrl(previewUrl);
    if (embedUrl) {
      return (
        <div>
          <div className="relative aspect-video w-full overflow-hidden bg-red-deep">
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`Preview of ${resource.title}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="space-y-3 border-t border-border bg-muted/40 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {chapters.map((chapter) => (
                <span
                  key={chapter.label}
                  className="rounded-sm border border-border bg-card px-2 py-1 text-[11px] text-ink"
                >
                  {formatDuration(chapter.at)} · {chapter.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }
    // Direct video file URL
    return (
      <div>
        <div className="relative aspect-video w-full overflow-hidden bg-red-deep">
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            className="h-full w-full"
            aria-label={`Preview of ${resource.title}`}
          />
        </div>
        <div className="space-y-3 border-t border-border bg-muted/40 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {chapters.map((chapter) => (
              <span
                key={chapter.label}
                className="rounded-sm border border-border bg-card px-2 py-1 text-[11px] text-ink"
              >
                {formatDuration(chapter.at)} · {chapter.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden bg-red-deep">
        <div className="red-panel absolute inset-0" />
        <div className="grid-lines absolute inset-0 opacity-40" />
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red/12 blur-3xl transition-transform duration-1000"
          style={{ transform: `translate(-50%, -50%) scale(${playing ? 1.25 : 0.9})` }}
        />
        <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <Eyebrow className="text-red-soft">
            {resource.learningArea} · {resource.gradeLevel}
          </Eyebrow>
          <h4 className="max-w-[80%] font-display text-xl font-semibold text-white md:text-2xl">{resource.title}</h4>
          <button
            type="button"
            onClick={toggle}
            className="focus-ring group grid h-16 w-16 place-items-center rounded-full border border-red/60 bg-red/15 text-red-soft backdrop-blur transition-all hover:scale-105 hover:bg-red/25"
            aria-label={playing ? "Pause preview" : "Play preview"}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
          </button>
          <p className="text-[11px] text-white/55">Streaming preview · no download required</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-ink hover:border-red/60"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={reset}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-ink hover:border-red/60"
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <span className="tabular text-[11px] text-muted-foreground">
            {formatDuration(position)} / {formatDuration(duration)}
          </span>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration}
              value={Math.floor(position)}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Seek preview"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-red"
              style={{
                background: `linear-gradient(to right, hsl(var(--red)) ${progress}%, hsl(var(--border)) ${progress}%)`,
              }}
            />
          </div>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-2">
          {chapters.map((chapter) => (
            <button
              key={chapter.label}
              type="button"
              onClick={() => seek(chapter.at)}
              className="focus-ring rounded-sm border border-border bg-card px-2 py-1 text-[11px] text-ink transition-colors hover:border-red/60 hover:text-red-dark"
            >
              {formatDuration(chapter.at)} · {chapter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AudioSurface({ resource }: Props) {
  const duration = resource.durationSec || 360;
  const { playing, position, toggle, seek } = useSimulatedPlayback(duration);
  const bars = useMemo(
    () => Array.from({ length: 72 }, (_, i) => 26 + Math.abs(Math.sin(i * 0.55) * 46) + ((i * 13) % 17)),
    [],
  );
  const progressIndex = Math.floor((position / duration) * bars.length);
  const previewUrl = usePreviewUrl(resource);

  // When a direct audio link is available, render an actual <audio> player.
  if (previewUrl) {
    return (
      <div className="p-5">
        <div className="plate overflow-hidden">
          <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red text-white">
              <Play className="ml-0.5 h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold text-ink">{resource.title}</p>
              <p className="tabular text-[11px] text-muted-foreground">{resource.language}</p>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink hover:border-red/60"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </a>
          </div>
          <div className="px-4 py-4">
            <audio key={previewUrl} src={previewUrl} controls className="w-full" aria-label={`Preview of ${resource.title}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="plate overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-4">
          <button
            type="button"
            onClick={toggle}
            className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red text-white transition-transform hover:scale-105"
            aria-label={playing ? "Pause audio" : "Play audio"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-ink">{resource.title}</p>
            <p className="tabular text-[11px] text-muted-foreground">
              {formatDuration(position)} / {formatDuration(duration)} · {resource.language}
            </p>
          </div>
        </div>
        <div className="flex h-28 items-end gap-[3px] px-4 py-4">
          {bars.map((height, i) => (
            <button
              key={i}
              type="button"
              onClick={() => seek((i / bars.length) * duration)}
              aria-label={`Seek to ${Math.round((i / bars.length) * 100)} percent`}
              className={cn(
                "flex-1 rounded-full transition-all duration-200",
                i <= progressIndex ? "bg-red" : "bg-red/15 hover:bg-red/30",
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageSurface({ resource }: Props) {
  const [zoom, setZoom] = useState<number>(1);
  const previewUrl = usePreviewUrl(resource);
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <Eyebrow className="text-ink">Image viewer</Eyebrow>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(2))))}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, Number((z + 0.2).toFixed(2))))}
            className="focus-ring grid h-8 w-8 place-items-center rounded-sm border border-border bg-card"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex max-h-[520px] items-center justify-center overflow-auto bg-red/5 p-6">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={resource.title}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[480px] w-auto max-w-full origin-center rounded-sm border border-border shadow-lift transition-transform"
          />
        ) : (
          <div
            style={{ transform: `scale(${zoom})` }}
            className="w-full max-w-[460px] origin-center rounded-sm border border-border bg-white p-7 shadow-lift transition-transform"
          >
            <div className="rule-red mb-4 w-full" />
            <p className="eyebrow text-red-dark">{resource.learningArea}</p>
            <h4 className="mt-2 font-display text-2xl font-bold uppercase leading-tight text-ink">{resource.title}</h4>
            <p className="mt-3 text-[12px] leading-relaxed text-ink">{resource.learningCompetency}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="hatch aspect-square rounded-sm border border-red/40 bg-red/5" />
              ))}
            </div>
            <p className="mt-5 border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
              {resource.division} · {resource.school}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PreviewViewer({ resource }: Props) {
  if (resource.fileKind === "video") return <VideoSurface resource={resource} />;
  if (resource.fileKind === "audio") return <AudioSurface resource={resource} />;
  if (resource.fileKind === "pptx") return <SlideSurface resource={resource} />;
  if (resource.fileKind === "image") return <ImageSurface resource={resource} />;
  return <DocumentSurface resource={resource} />;
}
