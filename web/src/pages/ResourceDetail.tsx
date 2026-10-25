import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  ExternalLink,
  Eye,
  FolderPlus,
  History,
  Lightbulb,
  MessageSquareQuote,
  Share2,
  Star,
} from "lucide-react";

import { PortalShell } from "@/components/PortalShell";
import { PreviewViewer } from "@/components/PreviewViewer";
import { ResourceCard } from "@/components/ResourceCard";
import { Eyebrow, FileKindTag, MetaChip, StarRating, StatusPill } from "@/components/atoms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration, formatNumber, formatRelative } from "@/lib/format";
import { FILE_KIND_LABEL } from "@/lib/taxonomy";
import { resolvePublicUrl } from "@/lib/cloud";
import { relatedResources } from "@/lib/search";
import { useLrms, useRating } from "@/lib/store";
import type { FeedbackKind } from "@/lib/types";

const FEEDBACK_TABS: { key: FeedbackKind; label: string; icon: typeof Star; hint: string }[] = [
  { key: "review", label: "Rate & review", icon: Star, hint: "Share how this resource worked with your learners." },
  { key: "issue", label: "Report an issue", icon: AlertTriangle, hint: "Tell the division about errors, broken pages or wrong tagging." },
  { key: "suggestion", label: "Recommend improvement", icon: Lightbulb, hint: "Suggest translations, answer keys or added activities." },
];

export default function ResourceDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const {
    resources,
    feedback,
    collections,
    bookmarks,
    history,
    toggleBookmark,
    toggleInCollection,
    createCollection,
    registerDownload,
    registerView,
    addFeedback,
  } = useLrms();

  const resource = resources.find((r) => r.id === id);
  const rating = useRating(id);
  const viewed = useRef<string>("");

  const [tab, setTab] = useState<FeedbackKind>("review");
  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [newCollection, setNewCollection] = useState<string>("");

  useEffect(() => {
    if (resource && viewed.current !== resource.id) {
      viewed.current = resource.id;
      registerView(resource.id);
    }
  }, [resource, registerView]);

  const related = useMemo(
    () => (resource ? relatedResources(resources, resource) : []),
    [resources, resource],
  );

  const reviews = useMemo(
    () => feedback.filter((f) => f.resourceId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [feedback, id],
  );

  if (!resource) {
    return (
      <PortalShell>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Resource not found</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            This learning resource may have been archived or deleted by the division administrator.
          </p>
          <Link
            to="/browse"
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2 text-[14px] text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>
        </div>
      </PortalShell>
    );
  }

  const saved = bookmarks.includes(resource.id);
  const lastDownloaded = history.find((h) => h.resourceId === resource.id);

  /** Opens the resource link in a new tab and logs the download. */
  const handleOpenResource = () => {
    const url = resource.linkUrl ?? resolvePublicUrl(resource.storagePath);
    if (!url) {
      toast.error("No resource link is available for this item.");
      return;
    }
    registerDownload(resource.id);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Resource opened in a new tab", {
      description: `${resource.fileName} · logged to download history.`,
    });
  };

  const submitFeedback = () => {
    if (!comment.trim()) {
      toast.error("Please write your feedback before submitting.");
      return;
    }
    addFeedback(resource.id, author.trim() || "Anonymous teacher", tab === "review" ? stars : 0, comment.trim(), tab);
    setComment("");
    setStars(0);
    toast.success(
      tab === "review" ? "Thank you for rating this resource." : "Your report was forwarded to the division LR team.",
    );
  };

  const metadata: [string, string][] = [
    ["Resource ID", resource.id],
    ["Title", resource.title],
    ["Learning area", resource.learningArea],
    ["Subject", resource.subject],
    ["Grade level", resource.gradeLevel],
    ["Key stage", resource.keyStage],
    ["SHS strand", resource.shsStrand ?? "Not applicable"],
    ["Term", resource.quarter],
    ["Competency code", resource.competencyCode],
    ["MELC / CG reference", resource.melcReference],
    ["Resource type", resource.resourceType],
    ["File type", FILE_KIND_LABEL[resource.fileKind]],
    resource.durationSec > 0
      ? ["Duration", formatDuration(resource.durationSec)]
      : ["Number of pages", `${resource.pages}`],
    ["Language", resource.language],
    ["Version", resource.version],
    [
      "Authors",
      resource.authors.length > 0
        ? resource.authors.map((a) => (a.position ? `${a.name} (${a.position})` : a.name)).join(", ")
        : resource.author,
    ],
    ["Week", resource.week || "All Weeks"],
    ["Schools", resource.schools.join(", ") || "—"],
    ["Sub-offices", resource.subOffices.join(", ") || "—"],
    ["Division", resource.division],
    ["Publisher", resource.publisher],
    ["Copyright", resource.copyright],
    ["School year", resource.schoolYear],
    ["Date created", formatDate(resource.dateCreated)],
    ["Date uploaded", formatDate(resource.dateUploaded)],
    ["Status", resource.status],
  ];

  return (
    <PortalShell>
      <div className="border-b border-border/80 bg-muted/40">
        <div className="container flex items-center gap-2 py-3 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-gold-deep">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/browse" className="hover:text-gold-deep">
            Catalog
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/browse?area=${encodeURIComponent(resource.learningArea)}`} className="hover:text-gold-deep">
            {resource.learningArea}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-mono text-ink">{resource.id}</span>
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileKindTag kind={resource.fileKind} />
            <StatusPill status={resource.status} />
            <MetaChip tone="ink">{resource.quarter}</MetaChip>
            {resource.featured && <MetaChip tone="gold">Featured</MetaChip>}
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-ink md:text-[38px]">
            {resource.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
            <StarRating value={rating.average} count={rating.count} />
            <span className="tabular inline-flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> {formatNumber(resource.downloads)} downloads
            </span>
            <span className="tabular inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatNumber(resource.views)} views
            </span>
            <span>Uploaded {formatRelative(resource.dateUploaded)}</span>
          </div>

          <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-ink">{resource.description}</p>

          <div className="plate mt-6 border-l-2 border-l-gold p-4">
            <Eyebrow className="text-gold-deep">Learning competency · {resource.competencyCode}</Eyebrow>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{resource.learningCompetency}</p>
            <p className="mt-2 font-mono text-[12px] text-muted-foreground">Reference: {resource.melcReference}</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleOpenResource()}
              className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-gold-deep active:scale-[0.98]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} /> Open resource
            </button>
            <button
              type="button"
              onClick={() => {
                toggleBookmark(resource.id);
                toast.success(saved ? "Removed from favorites" : "Saved to My Library");
              }}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-sm border px-4 py-2.5 text-[14px] font-medium transition-colors",
                saved ? "border-gold bg-gold/15 text-gold-deep" : "border-gold/25 bg-card text-ink hover:border-gold",
              )}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-gold")} /> {saved ? "Saved" : "Save to favorites"}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="focus-ring inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-card px-4 py-2.5 text-[14px] font-medium text-ink hover:border-gold"
                >
                  <FolderPlus className="h-4 w-4" /> Add to collection
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[300px] p-0">
                <p className="eyebrow border-b border-border bg-muted/60 px-3 py-2 text-ink">My collections</p>
                <ul className="max-h-56 overflow-y-auto p-1">
                  {collections.length === 0 && (
                    <li className="px-3 py-3 text-[13px] text-muted-foreground">No collections yet.</li>
                  )}
                  {collections.map((collection) => {
                    const inside = collection.resourceIds.includes(resource.id);
                    return (
                      <li key={collection.id}>
                        <button
                          type="button"
                          onClick={() => {
                            toggleInCollection(collection.id, resource.id);
                            toast.success(inside ? `Removed from ${collection.name}` : `Added to ${collection.name}`);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-[14px] text-ink hover:bg-muted"
                        >
                          <span
                            className={cn(
                              "grid h-4 w-4 place-items-center rounded-sm border",
                              inside ? "border-gold bg-gold text-gold-deep" : "border-border",
                            )}
                          >
                            {inside && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="truncate">{collection.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex gap-2 border-t border-border p-2">
                  <Input
                    value={newCollection}
                    onChange={(event) => setNewCollection(event.target.value)}
                    placeholder="New collection name"
                    className="h-8 rounded-sm text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCollection.trim()) return;
                      const collectionId = createCollection(newCollection.trim(), "Created from a resource page.");
                      toggleInCollection(collectionId, resource.id);
                      setNewCollection("");
                      toast.success("Collection created");
                    }}
                    className="focus-ring shrink-0 rounded-sm bg-gold px-2.5 text-[13px] font-medium text-white"
                  >
                    Add
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(window.location.href)
                  .then(() => toast.success("Permalink copied to clipboard"))
                  .catch(() => toast.error("Could not copy the link"));
              }}
              className="focus-ring inline-flex items-center gap-2 rounded-sm border border-gold/25 bg-card px-4 py-2.5 text-[14px] font-medium text-ink hover:border-gold"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          {lastDownloaded && (
            <p className="mt-3 text-[12px] text-muted-foreground">
              You last opened this resource {formatRelative(lastDownloaded.at)}.
            </p>
          )}

          {/* Preview */}
          <div className="mt-8">
            <Eyebrow className="text-gold-deep">Resource preview</Eyebrow>
            <div className="plate mt-2 overflow-hidden">
              <PreviewViewer resource={resource} />
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-10">
            <Eyebrow className="text-gold-deep">Teacher feedback</Eyebrow>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Ratings, issues & recommendations</h2>

            <div className="plate mt-4 overflow-hidden">
              <div className="flex flex-wrap border-b border-border bg-muted/40">
                {FEEDBACK_TABS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab(item.key)}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors",
                        tab === item.key
                          ? "border-b-2 border-gold bg-card text-ink"
                          : "text-muted-foreground hover:text-ink",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3 p-4">
                <p className="text-[13px] text-muted-foreground">{FEEDBACK_TABS.find((t) => t.key === tab)?.hint}</p>
                {tab === "review" && (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-ink">Your rating</span>
                    <StarRating value={stars} size={22} onSelect={setStars} />
                  </div>
                )}
                <Input
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="Your name and school (optional)"
                  className="h-9 rounded-sm text-[14px]"
                />
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  placeholder={
                    tab === "issue"
                      ? "Describe the issue, including page or slide number…"
                      : tab === "suggestion"
                        ? "What would make this resource more usable?"
                        : "How did this resource help your learners?"
                  }
                  className="rounded-sm text-[14px]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={submitFeedback}
                    className="focus-ring rounded-sm bg-gold px-4 py-2 text-[14px] font-semibold text-white transition-transform active:scale-[0.98]"
                  >
                    Submit {tab === "review" ? "review" : tab === "issue" ? "report" : "recommendation"}
                  </button>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {reviews.length === 0 && (
                <li className="plate px-4 py-6 text-center text-[14px] text-muted-foreground">
                  No feedback yet — be the first to review this resource.
                </li>
              )}
              {reviews.map((item) => (
                <li key={item.id} className="plate p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-[10px] font-bold text-white">
                        {item.author
                          .split(" ")
                          .slice(-2)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="text-[14px] font-semibold text-ink">{item.author}</span>
                      {item.kind !== "review" && (
                        <MetaChip tone="gold">{item.kind === "issue" ? "Reported issue" : "Recommendation"}</MetaChip>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {item.stars > 0 && <StarRating value={item.stars} size={12} />}
                      <span className="text-[12px] text-muted-foreground">{formatRelative(item.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-2 flex gap-2 text-[14px] leading-relaxed text-ink">
                    <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" />
                    {item.comment}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="plate overflow-hidden">
            <p className="eyebrow border-b border-border bg-muted/50 px-4 py-2.5 text-ink">
              Complete metadata record
            </p>
            <dl className="divide-y divide-border/60">
              {metadata.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2.5">
                  <dt className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground">{label}</dt>
                  <dd
                    className={cn(
                      "text-[13.5px] leading-snug text-ink",
                      (label === "Resource ID" || label === "Competency code") && "font-mono",
                      label === "Status" && "capitalize",
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border px-4 py-3">
              <p className="eyebrow mb-2 text-muted-foreground">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {resource.keywords.map((keyword) => (
                  <Link
                    key={keyword}
                    to={`/browse?q=${encodeURIComponent(keyword)}`}
                    className="focus-ring rounded-sm bg-muted px-2 py-0.5 text-[12px] text-ink transition-colors hover:bg-gold/20 hover:text-gold-deep"
                  >
                    #{keyword}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="plate overflow-hidden">
            <p className="eyebrow flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5 text-ink">
              <History className="h-3.5 w-3.5" /> Version history
            </p>
            <ol className="relative space-y-4 px-4 py-4">
              {[...resource.versions].reverse().map((version, i) => (
                <li key={version.version} className="relative pl-6">
                  <span
                    className={cn(
                      "absolute left-0 top-1 h-3 w-3 rounded-full border-2",
                      i === 0 ? "border-gold bg-gold/40" : "border-border bg-card",
                    )}
                  />
                  {i < resource.versions.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-border" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-ink">{version.version}</span>
                    {i === 0 && <MetaChip tone="gold">Current</MetaChip>}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{version.note}</p>
                  <p className="tabular mt-0.5 text-[12px] text-muted-foreground/80">
                    {formatDate(version.uploadedAt)}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {related.length > 0 && (
            <div>
              <p className="eyebrow mb-3 text-gold-deep">Related resources</p>
              <div className="plate overflow-hidden">
                {related.map((item) => (
                  <ResourceCard key={item.id} resource={item} variant="row" />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </PortalShell>
  );
}
