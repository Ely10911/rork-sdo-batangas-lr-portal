import { useMemo } from "react";
import { ExternalLink, FileText, Link2, PlayCircle } from "lucide-react";

import { Eyebrow } from "@/components/atoms";
import { resolvePublicUrl } from "@/lib/cloud";
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

/**
 * Simplified preview panel: no in-browser PDF viewer.
 * Shows resource metadata and a prominent "Open in new tab" button
 * that uses the uploaded link to open the file externally.
 */
export function PreviewViewer({ resource }: Props) {
  const previewUrl = usePreviewUrl(resource);

  if (!previewUrl) {
    return (
      <div className="p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={1.4} />
        <p className="mt-4 text-[14px] font-medium text-ink">No resource link available</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          The administrator has not yet provided a link for this resource.
        </p>
      </div>
    );
  }

  const kindLabel = FILE_KIND_LABEL[resource.fileKind];
  const isVideo = resource.fileKind === "video";
  const isAudio = resource.fileKind === "audio";

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-3">
        <Eyebrow className="text-ink">{kindLabel}</Eyebrow>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep"
        >
          <ExternalLink className="h-4 w-4" /> Open in new tab
        </a>
      </div>

      <div className="flex flex-col items-center justify-center gap-5 bg-gold/5 px-6 py-12 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-gold/10">
          {isVideo || isAudio ? (
            <PlayCircle className="h-7 w-7 text-gold-deep" strokeWidth={1.6} />
          ) : (
            <FileText className="h-7 w-7 text-gold-deep" strokeWidth={1.6} />
          )}
        </span>

        <div className="max-w-md space-y-2">
          <h4 className="font-display text-lg font-semibold leading-tight text-ink">{resource.title}</h4>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            This {kindLabel.toLowerCase()} is linked from an external source. Click the button above to open the full
            resource in a new browser tab.
          </p>
        </div>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-card px-5 py-2.5 text-[14px] font-semibold text-gold-deep transition-colors hover:border-gold hover:bg-gold/10"
        >
          <Link2 className="h-4 w-4" /> Open resource link
        </a>

        <p className="max-w-sm break-all text-[11px] text-muted-foreground/70">
          <span className="font-medium text-muted-foreground">Source URL:</span> {previewUrl}
        </p>
      </div>
    </div>
  );
}
