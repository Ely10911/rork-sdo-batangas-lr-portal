import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Link2, Plus, Save, Send, Trash2, X } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow, FileKindTag, StatusPill } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatRelative, formatSize } from "@/lib/format";
import {
  COPYRIGHT_OPTIONS,
  DIVISION,
  GRADE_LEVELS,
  LANGUAGES,
  LEARNING_AREAS,
  QUARTERS,
  RESOURCE_TYPES,
  SCHOOL_NAMES,
  SCHOOL_YEARS,
  SHS_STRANDS,
  SUB_OFFICE_NAMES,
  keyStageFor,
  schoolsForSubOffice,
  subOfficeFor,
} from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";
import type { FileKind, LearningResource, Quarter, ResourceStatus } from "@/lib/types";

/** Detect file kind from a URL's extension. */
function detectKindFromUrl(url: string): FileKind {
  const ext = url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "m4v", "webm", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "aac", "ogg"].includes(ext)) return "audio";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "image";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  if (ext === "epub") return "epub";
  if (ext === "pdf") return "pdf";
  // Default: check if it's a known video/audio platform URL
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com")) return "video";
  if (lower.includes("soundcloud.com")) return "audio";
  return "pdf";
}

interface Staged {
  key: string;
  linkUrl: string;
  fileKind: FileKind;
  title: string;
  description: string;
  learningArea: string;
  subject: string;
  gradeLevel: string;
  quarter: Quarter;
  resourceType: string;
  competencyCode: string;
  learningCompetency: string;
  melcReference: string;
  language: string;
  author: string;
  school: string;
  subOffice: string;
  copyright: string;
  schoolYear: string;
  shsStrand: string;
  keywords: string;
}

interface BatchDefaults {
  learningArea: string;
  gradeLevel: string;
  quarter: Quarter;
  resourceType: string;
  language: string;
  author: string;
  school: string;
  subOffice: string;
  schoolYear: string;
  copyright: string;
}

const DEFAULTS: BatchDefaults = {
  learningArea: LEARNING_AREAS[0],
  gradeLevel: GRADE_LEVELS[7],
  quarter: QUARTERS[0],
  resourceType: RESOURCE_TYPES[0],
  language: LANGUAGES[0],
  author: "",
  school: SCHOOL_NAMES[0],
  subOffice: subOfficeFor(SCHOOL_NAMES[0]),
  schoolYear: SCHOOL_YEARS[2],
  copyright: COPYRIGHT_OPTIONS[0],
};

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Picker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 rounded-sm text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function AdminUpload() {
  const { resources, addResources, deleteResource, setResourceStatus } = useLrms();
  const [batch, setBatch] = useState<BatchDefaults>(DEFAULTS);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [open, setOpen] = useState<string>("");
  const [committing, setCommitting] = useState<boolean>(false);

  const drafts = useMemo(
    () => resources.filter((r) => r.status === "draft" || r.status === "pending"),
    [resources],
  );

  const nextIdNumber = useMemo(() => {
    const numbers = resources
      .map((r) => Number(r.id.split("-").pop()))
      .filter((n) => Number.isFinite(n)) as number[];
    return (numbers.length ? Math.max(...numbers) : 0) + 1;
  }, [resources]);

  const addResource = () => {
    const key = `${Date.now()}-new`;
    const addition: Staged = {
      key,
      linkUrl: "",
      fileKind: "pdf",
      title: "",
      description: "",
      learningArea: batch.learningArea,
      subject: "",
      gradeLevel: batch.gradeLevel,
      quarter: batch.quarter,
      resourceType: batch.resourceType,
      competencyCode: "",
      learningCompetency: "",
      melcReference: "",
      language: batch.language,
      author: batch.author,
      school: batch.school,
      subOffice: batch.subOffice,
      copyright: batch.copyright,
      schoolYear: batch.schoolYear,
      shsStrand: "Not applicable",
      keywords: "",
    };
    setStaged((prev) => [...prev, addition]);
    setOpen(key);
    toast.success("Resource entry added — paste the link and fill in the metadata.");
  };

  const patchStaged = (key: string, patch: Partial<Staged>) => {
    setStaged((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const applyBatchToAll = () => {
    setStaged((prev) =>
      prev.map((item) => ({
        ...item,
        learningArea: batch.learningArea,
        gradeLevel: batch.gradeLevel,
        quarter: batch.quarter,
        resourceType: batch.resourceType,
        language: batch.language,
        author: batch.author || item.author,
        school: batch.school,
        subOffice: batch.subOffice,
        schoolYear: batch.schoolYear,
        copyright: batch.copyright,
      })),
    );
    toast.success("Batch metadata applied to all staged resources");
  };

  const commit = (status: ResourceStatus) => {
    if (staged.length === 0) {
      toast.error("Add at least one resource before saving.");
      return;
    }
    const missing = staged.filter((item) => !item.title.trim() || !item.author.trim() || !item.linkUrl.trim());
    if (missing.length > 0) {
      toast.error("Each resource needs a title, author, and link URL.");
      return;
    }
    setCommitting(true);
    const now = new Date().toISOString();
    const records: LearningResource[] = staged.map((item, i) => ({
      id: `LR-2026-${(nextIdNumber + i).toString().padStart(4, "0")}`,
      title: item.title.trim(),
      description:
        item.description.trim() ||
        `${item.resourceType} for ${item.gradeLevel} ${item.learningArea} (${item.subject}) uploaded through the division LRMS.`,
      learningArea: item.learningArea,
      subject: item.subject.trim() || item.learningArea,
      gradeLevel: item.gradeLevel,
      keyStage: keyStageFor(item.gradeLevel),
      shsStrand: item.shsStrand === "Not applicable" ? null : item.shsStrand,
      quarter: item.quarter,
      competencyCode: item.competencyCode.trim() || "TBD",
      learningCompetency: item.learningCompetency.trim() || "Competency statement to be encoded during QA review.",
      melcReference: item.melcReference.trim() || "For mapping",
      resourceType: item.resourceType,
      fileKind: item.fileKind,
      fileName: item.linkUrl.trim(),
      fileSizeKB: 0,
      pages: ["pdf", "docx", "epub", "pptx"].includes(item.fileKind) ? 12 : 0,
      durationSec: item.fileKind === "video" || item.fileKind === "audio" ? 420 : 0,
      language: item.language,
      author: item.author.trim(),
      school: item.school,
      subOffice: item.subOffice,
      division: DIVISION,
      publisher: `${DIVISION} — Curriculum Implementation Division`,
      copyright: item.copyright,
      keywords: item.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      schoolYear: item.schoolYear,
      version: "v1.0",
      versions: [
        {
          version: "v1.0",
          fileName: item.linkUrl.trim(),
          fileSizeKB: 0,
          uploadedAt: now,
          note: status === "published" ? "Initial publication." : "Initial upload saved as draft.",
        },
      ],
      status,
      dateCreated: now,
      dateUploaded: now,
      downloads: 0,
      views: 0,
      featured: false,
      storagePath: null,
      linkUrl: item.linkUrl.trim(),
    }));

    addResources(records);
    setStaged([]);
    setCommitting(false);
    toast.success(
      status === "published"
        ? `${records.length} resource(s) published to the portal`
        : status === "pending"
          ? `${records.length} resource(s) submitted for quality assurance`
          : `${records.length} draft(s) saved`,
    );
  };

  return (
    <AdminShell
      title="Add resources"
      subtitle="Paste learning resource links, capture complete metadata, and manage the draft queue"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Add resource button */}
          <div className="plate flex flex-col items-center justify-center gap-3 border-dashed px-6 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-red/50 bg-red/8">
              <Link2 className="h-6 w-6 text-red-dark" strokeWidth={1.7} />
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Add learning resource by link</h2>
            <p className="max-w-md text-[13px] text-muted-foreground">
              Paste the URL of the learning resource (Google Drive, YouTube, DepEd Commons, etc.). No file upload
              needed — resources are linked, not stored.
            </p>
            <button
              type="button"
              onClick={addResource}
              className="focus-ring mt-1 inline-flex items-center gap-2 rounded-sm bg-red px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-red-dark"
            >
              <Plus className="h-4 w-4" /> Add resource
            </button>
          </div>

          {/* Staged resources */}
          {staged.length > 0 && (
            <div className="plate overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <Eyebrow className="text-ink">Staged for submission · {staged.length} resource(s)</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void commit("draft")}
                    disabled={committing}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-red/25 bg-card px-3 py-1.5 text-[12px] font-medium text-ink disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" /> {committing ? "Saving…" : "Save as draft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void commit("pending")}
                    disabled={committing}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-red/60 bg-red/15 px-3 py-1.5 text-[12px] font-medium text-red-dark disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" /> {committing ? "Submitting…" : "Submit for QA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void commit("published")}
                    disabled={committing}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-red px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {committing ? "Publishing…" : "Publish now"}
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-border/60">
                {staged.map((item) => {
                  const expanded = open === item.key;
                  const schoolOptions = item.subOffice
                    ? schoolsForSubOffice(item.subOffice)
                    : SCHOOL_NAMES;
                  return (
                    <li key={item.key}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <FileKindTag kind={item.fileKind} />
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? "" : item.key)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-[13px] font-semibold text-ink">
                            {item.title || "Untitled resource"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.linkUrl || "No link entered"} · {item.gradeLevel} · {item.learningArea}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? "" : item.key)}
                          className="focus-ring rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink"
                        >
                          {expanded ? "Collapse" : "Edit metadata"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStaged((prev) => prev.filter((s) => s.key !== item.key));
                          }}
                          aria-label="Remove staged resource"
                          className="focus-ring grid h-7 w-7 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {expanded && (
                        <div className="grid gap-4 border-t border-border/60 bg-muted/25 px-4 py-4 md:grid-cols-2">
                          <Field label="Resource link URL" className="md:col-span-2">
                            <Input
                              value={item.linkUrl}
                              onChange={(e) => {
                                const url = e.target.value;
                                patchStaged(item.key, {
                                  linkUrl: url,
                                  fileKind: url ? detectKindFromUrl(url) : item.fileKind,
                                });
                              }}
                              placeholder="https://drive.google.com/… or https://youtube.com/watch?v=…"
                              className="h-9 rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Title" className="md:col-span-2">
                            <Input
                              value={item.title}
                              onChange={(e) => patchStaged(item.key, { title: e.target.value })}
                              placeholder="Enter the resource title"
                              className="h-9 rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Description" className="md:col-span-2">
                            <Textarea
                              value={item.description}
                              onChange={(e) => patchStaged(item.key, { description: e.target.value })}
                              rows={2}
                              className="rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Learning area">
                            <Picker
                              value={item.learningArea}
                              options={LEARNING_AREAS}
                              onChange={(v) => patchStaged(item.key, { learningArea: v })}
                            />
                          </Field>
                          <Field label="Subject (enter manually)">
                            <Input
                              value={item.subject}
                              onChange={(e) => patchStaged(item.key, { subject: e.target.value })}
                              placeholder="e.g. Reading Comprehension, Algebra, Panitikan"
                              className="h-9 rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Grade level">
                            <Picker
                              value={item.gradeLevel}
                              options={GRADE_LEVELS}
                              onChange={(v) => patchStaged(item.key, { gradeLevel: v })}
                            />
                          </Field>
                          <Field label="Quarter">
                            <Picker
                              value={item.quarter}
                              options={QUARTERS}
                              onChange={(v) => patchStaged(item.key, { quarter: v as Quarter })}
                            />
                          </Field>
                          <Field label="Resource type">
                            <Picker
                              value={item.resourceType}
                              options={RESOURCE_TYPES}
                              onChange={(v) => patchStaged(item.key, { resourceType: v })}
                            />
                          </Field>
                          <Field label="SHS strand">
                            <Picker
                              value={item.shsStrand}
                              options={["Not applicable", ...SHS_STRANDS]}
                              onChange={(v) => patchStaged(item.key, { shsStrand: v })}
                            />
                          </Field>
                          <Field label="Competency code">
                            <Input
                              value={item.competencyCode}
                              onChange={(e) => patchStaged(item.key, { competencyCode: e.target.value })}
                              placeholder="e.g. EN7RC-Ia-2.15"
                              className="h-9 rounded-sm font-mono text-[12px]"
                            />
                          </Field>
                          <Field label="MELC / CG reference">
                            <Input
                              value={item.melcReference}
                              onChange={(e) => patchStaged(item.key, { melcReference: e.target.value })}
                              placeholder="e.g. MELC p. 128"
                              className="h-9 rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Learning competency" className="md:col-span-2">
                            <Textarea
                              value={item.learningCompetency}
                              onChange={(e) => patchStaged(item.key, { learningCompetency: e.target.value })}
                              rows={2}
                              className="rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Author">
                            <Input
                              value={item.author}
                              onChange={(e) => patchStaged(item.key, { author: e.target.value })}
                              placeholder="Full name of the writer"
                              className="h-9 rounded-sm text-[13px]"
                            />
                          </Field>
                          <Field label="Sub-Office">
                            <Picker
                              value={item.subOffice}
                              options={SUB_OFFICE_NAMES}
                              onChange={(v) => {
                                const schools = schoolsForSubOffice(v);
                                patchStaged(item.key, {
                                  subOffice: v,
                                  school: schools[0] ?? item.school,
                                });
                              }}
                            />
                          </Field>
                          <Field label="School">
                            <Picker
                              value={item.school}
                              options={schoolOptions}
                              onChange={(v) => patchStaged(item.key, { school: v })}
                            />
                          </Field>
                          <Field label="Language">
                            <Picker
                              value={item.language}
                              options={LANGUAGES}
                              onChange={(v) => patchStaged(item.key, { language: v })}
                            />
                          </Field>
                          <Field label="School year">
                            <Picker
                              value={item.schoolYear}
                              options={SCHOOL_YEARS}
                              onChange={(v) => patchStaged(item.key, { schoolYear: v })}
                            />
                          </Field>
                          <Field label="Copyright" className="md:col-span-2">
                            <Picker
                              value={item.copyright}
                              options={COPYRIGHT_OPTIONS}
                              onChange={(v) => patchStaged(item.key, { copyright: v })}
                            />
                          </Field>
                          <Field label="Keywords (comma separated)" className="md:col-span-2">
                            <Input
                              value={item.keywords}
                              onChange={(e) => patchStaged(item.key, { keywords: e.target.value })}
                              placeholder="e.g. context clues, vocabulary, remediation"
                              className="h-9 rounded-sm text-[13px]"
                            />
                          </Field>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Draft queue */}
          <div className="plate overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <Eyebrow className="text-ink">Draft & QA queue · {drafts.length}</Eyebrow>
            </div>
            <ul className="divide-y divide-border/60">
              {drafts.length === 0 && (
                <li className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  No drafts pending. Everything has been reviewed and published.
                </li>
              )}
              {drafts.map((resource) => (
                <li key={resource.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <FileKindTag kind={resource.fileKind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{resource.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {resource.id} · {resource.author} · saved {formatRelative(resource.dateUploaded)}
                    </p>
                  </div>
                  <StatusPill status={resource.status} />
                  <div className="flex gap-2">
                    {resource.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResourceStatus(resource.id, "pending");
                          toast.success("Draft submitted for quality assurance");
                        }}
                        className="focus-ring rounded-sm border border-red/60 bg-red/15 px-2.5 py-1.5 text-[11px] font-medium text-red-dark"
                      >
                        Submit for QA
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setResourceStatus(resource.id, "published");
                        toast.success("Resource published");
                      }}
                      className="focus-ring rounded-sm bg-red px-2.5 py-1.5 text-[11px] font-semibold text-white"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteResource(resource.id);
                        toast.success("Draft deleted");
                      }}
                      aria-label="Delete draft"
                      className="focus-ring grid h-7 w-7 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Batch defaults */}
        <aside className="space-y-4">
          <div className="plate sticky top-24 overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <Eyebrow className="text-ink">Batch metadata defaults</Eyebrow>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Set common values once — every newly added resource inherits them, and you can push them to all staged
                resources at any time.
              </p>
              <Field label="Learning area">
                <Picker
                  value={batch.learningArea}
                  options={LEARNING_AREAS}
                  onChange={(v) => setBatch({ ...batch, learningArea: v })}
                />
              </Field>
              <Field label="Grade level">
                <Picker
                  value={batch.gradeLevel}
                  options={GRADE_LEVELS}
                  onChange={(v) => setBatch({ ...batch, gradeLevel: v })}
                />
              </Field>
              <Field label="Quarter">
                <Picker
                  value={batch.quarter}
                  options={QUARTERS}
                  onChange={(v) => setBatch({ ...batch, quarter: v as Quarter })}
                />
              </Field>
              <Field label="Resource type">
                <Picker
                  value={batch.resourceType}
                  options={RESOURCE_TYPES}
                  onChange={(v) => setBatch({ ...batch, resourceType: v })}
                />
              </Field>
              <Field label="Default author">
                <Input
                  value={batch.author}
                  onChange={(event) => setBatch({ ...batch, author: event.target.value })}
                  placeholder="Writer / uploader name"
                  className="h-9 rounded-sm text-[13px]"
                />
              </Field>
              <Field label="Sub-Office">
                <Picker
                  value={batch.subOffice}
                  options={SUB_OFFICE_NAMES}
                  onChange={(v) => {
                    const schools = schoolsForSubOffice(v);
                    setBatch({ ...batch, subOffice: v, school: schools[0] ?? batch.school });
                  }}
                />
              </Field>
              <Field label="School">
                <Picker
                  value={batch.school}
                  options={schoolsForSubOffice(batch.subOffice)}
                  onChange={(v) => setBatch({ ...batch, school: v })}
                />
              </Field>
              <Field label="Language">
                <Picker
                  value={batch.language}
                  options={LANGUAGES}
                  onChange={(v) => setBatch({ ...batch, language: v })}
                />
              </Field>
              <Field label="School year">
                <Picker
                  value={batch.schoolYear}
                  options={SCHOOL_YEARS}
                  onChange={(v) => setBatch({ ...batch, schoolYear: v })}
                />
              </Field>
              <Field label="Copyright">
                <Picker
                  value={batch.copyright}
                  options={COPYRIGHT_OPTIONS}
                  onChange={(v) => setBatch({ ...batch, copyright: v })}
                />
              </Field>
              <button
                type="button"
                onClick={applyBatchToAll}
                disabled={staged.length === 0}
                className="focus-ring w-full rounded-sm border border-red/25 bg-card px-3 py-2 text-[12px] font-semibold text-ink disabled:opacity-50"
              >
                Apply to all staged resources
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
