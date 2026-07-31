import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Save, Send, Trash2, UploadCloud, X } from "lucide-react";

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
  SUBJECTS_BY_AREA,
  keyStageFor,
  subOfficeFor,
} from "@/lib/taxonomy";
import { uploadResourceFile } from "@/lib/cloud";
import { useLrms } from "@/lib/store";
import type { FileKind, LearningResource, Quarter, ResourceStatus } from "@/lib/types";

const ACCEPTED = ".pdf,.docx,.pptx,.epub,.mp4,.mov,.mp3,.wav,.png,.jpg,.jpeg";

function detectKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "m4v", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "aac"].includes(ext)) return "audio";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  if (ext === "epub") return "epub";
  return "pdf";
}

interface Staged {
  key: string;
  fileName: string;
  fileSizeKB: number;
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
  const { resources, addResources, deleteResource, setResourceStatus, updateResource } = useLrms();
  const [batch, setBatch] = useState<BatchDefaults>(DEFAULTS);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [dragging, setDragging] = useState<boolean>(false);
  const [open, setOpen] = useState<string>("");
  const [committing, setCommitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep the raw File objects alongside staged metadata so we can upload them.
  const stagedFiles = useRef<Map<string, File>>(new Map());

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

  const accept = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const additions: Staged[] = Array.from(files).map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      fileName: file.name,
      fileSizeKB: Math.max(1, Math.round(file.size / 1024)),
      fileKind: detectKind(file.name),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      description: "",
      learningArea: batch.learningArea,
      subject: SUBJECTS_BY_AREA[batch.learningArea]?.[0] ?? "",
      gradeLevel: batch.gradeLevel,
      quarter: batch.quarter,
      resourceType: batch.resourceType,
      competencyCode: "",
      learningCompetency: "",
      melcReference: "",
      language: batch.language,
      author: batch.author,
      school: batch.school,
      copyright: batch.copyright,
      schoolYear: batch.schoolYear,
      shsStrand: "Not applicable",
      keywords: "",
    }));
    Array.from(files).forEach((file, i) => {
      stagedFiles.current.set(additions[i].key, file);
    });
    setStaged((prev) => [...prev, ...additions]);
    setOpen(additions[0].key);
    toast.success(`${additions.length} file(s) staged for metadata capture`);
  };

  const patchStaged = (key: string, patch: Partial<Staged>) => {
    setStaged((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const applyBatchToAll = () => {
    setStaged((prev) =>
      prev.map((item) => ({
        ...item,
        learningArea: batch.learningArea,
        subject: SUBJECTS_BY_AREA[batch.learningArea]?.[0] ?? item.subject,
        gradeLevel: batch.gradeLevel,
        quarter: batch.quarter,
        resourceType: batch.resourceType,
        language: batch.language,
        author: batch.author || item.author,
        school: batch.school,
        schoolYear: batch.schoolYear,
        copyright: batch.copyright,
      })),
    );
    toast.success("Batch metadata applied to all staged files");
  };

  const commit = async (status: ResourceStatus) => {
    if (staged.length === 0) {
      toast.error("Add at least one file before saving.");
      return;
    }
    const missing = staged.filter((item) => !item.title.trim() || !item.author.trim());
    if (missing.length > 0) {
      toast.error("Each resource needs a title and an author.");
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
      subject: item.subject || item.learningArea,
      gradeLevel: item.gradeLevel,
      keyStage: keyStageFor(item.gradeLevel),
      shsStrand: item.shsStrand === "Not applicable" ? null : item.shsStrand,
      quarter: item.quarter,
      competencyCode: item.competencyCode.trim() || "TBD",
      learningCompetency: item.learningCompetency.trim() || "Competency statement to be encoded during QA review.",
      melcReference: item.melcReference.trim() || "For mapping",
      resourceType: item.resourceType,
      fileKind: item.fileKind,
      fileName: item.fileName,
      fileSizeKB: item.fileSizeKB,
      pages: ["pdf", "docx", "epub", "pptx"].includes(item.fileKind) ? 12 : 0,
      durationSec: item.fileKind === "video" || item.fileKind === "audio" ? 420 : 0,
      language: item.language,
      author: item.author.trim(),
      school: item.school,
      subOffice: subOfficeFor(item.school),
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
          fileName: item.fileName,
          fileSizeKB: item.fileSizeKB,
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
    }));

    // Upload each file to Supabase Storage in parallel, then stamp the
    // returned storage path onto the matching record before persisting.
    const uploads = await Promise.all(
      records.map(async (record) => {
        const file = stagedFiles.current.get(staged.find((s) => s.fileName === record.fileName)?.key ?? "");
        if (!file) return null;
        const uploaded = await uploadResourceFile(record, file);
        return uploaded;
      }),
    );
    const finalRecords = records.map((record, i) => {
      const uploaded = uploads[i];
      if (!uploaded) return record;
      const versions = record.versions.map((v) => ({ ...v, storagePath: uploaded.path }));
      return { ...record, storagePath: uploaded.path, versions } as LearningResource;
    });

    addResources(finalRecords);
    stagedFiles.current.clear();
    setStaged([]);
    setCommitting(false);
    const uploadedCount = uploads.filter(Boolean).length;
    toast.success(
      status === "published"
        ? `${finalRecords.length} resource(s) published to the portal`
        : status === "pending"
          ? `${finalRecords.length} resource(s) submitted for quality assurance`
          : `${finalRecords.length} draft(s) saved`,
      {
        description:
          uploadedCount > 0
            ? `${uploadedCount} file(s) persisted to cloud storage and accessible to all devices.`
            : "Files staged locally — cloud storage unavailable. Metadata was still saved.",
      },
    );
  };

  return (
    <AdminShell
      title="Upload & drafts"
      subtitle="Batch upload learning resources, capture complete metadata, and manage the draft queue"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              accept(event.dataTransfer.files);
            }}
            className={cn(
              "plate relative flex flex-col items-center justify-center gap-3 border-dashed px-6 py-12 text-center transition-all",
              dragging ? "border-gold bg-gold/10" : "border-border",
            )}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/50 bg-gold/12">
              <UploadCloud className="h-6 w-6 text-gold-deep" strokeWidth={1.7} />
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Drop learning resource files here</h2>
            <p className="max-w-md text-[13px] text-muted-foreground">
              Supported formats: PDF, DOCX, PPTX, EPUB, video (MP4/MOV), audio (MP3/WAV) and images. Multiple files can
              be uploaded at once.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={(event) => accept(event.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring mt-1 inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2.5 text-[13px] font-semibold text-parchment hover:bg-ink-soft"
            >
              <FileUp className="h-4 w-4" /> Choose files
            </button>
          </div>

          {/* Staged files */}
          {staged.length > 0 && (
            <div className="plate overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <Eyebrow className="text-ink-soft">Staged for upload · {staged.length} file(s)</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void commit("draft")}
                    disabled={committing}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-ink/25 bg-card px-3 py-1.5 text-[12px] font-medium text-ink disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" /> {committing ? "Saving…" : "Save as draft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void commit("pending")}
                    disabled={committing}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-gold/60 bg-gold/15 px-3 py-1.5 text-[12px] font-medium text-gold-deep disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" /> {committing ? "Submitting…" : "Submit for QA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void commit("published")}
                    disabled={committing}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-ink px-3 py-1.5 text-[12px] font-semibold text-parchment disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {committing ? "Publishing…" : "Publish now"}
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-border/60">
                {staged.map((item) => {
                  const expanded = open === item.key;
                  return (
                    <li key={item.key}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <FileKindTag kind={item.fileKind} />
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? "" : item.key)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-[13px] font-semibold text-ink">{item.title || item.fileName}</p>
                          <p className="tabular text-[11px] text-muted-foreground">
                            {item.fileName} · {formatSize(item.fileSizeKB)} · {item.gradeLevel} · {item.learningArea}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? "" : item.key)}
                          className="focus-ring rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                        >
                          {expanded ? "Collapse" : "Edit metadata"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stagedFiles.current.delete(item.key);
                            setStaged((prev) => prev.filter((s) => s.key !== item.key));
                          }}
                          aria-label="Remove staged file"
                          className="focus-ring grid h-7 w-7 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {expanded && (
                        <div className="grid gap-4 border-t border-border/60 bg-muted/25 px-4 py-4 md:grid-cols-2">
                          <Field label="Title" className="md:col-span-2">
                            <Input
                              value={item.title}
                              onChange={(e) => patchStaged(item.key, { title: e.target.value })}
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
                              onChange={(v) =>
                                patchStaged(item.key, { learningArea: v, subject: SUBJECTS_BY_AREA[v]?.[0] ?? "" })
                              }
                            />
                          </Field>
                          <Field label="Subject">
                            <Picker
                              value={item.subject || (SUBJECTS_BY_AREA[item.learningArea]?.[0] ?? "")}
                              options={SUBJECTS_BY_AREA[item.learningArea] ?? []}
                              onChange={(v) => patchStaged(item.key, { subject: v })}
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
                          <Field label="School">
                            <Picker
                              value={item.school}
                              options={SCHOOL_NAMES}
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
              <Eyebrow className="text-ink-soft">Draft & QA queue · {drafts.length}</Eyebrow>
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
                        className="focus-ring rounded-sm border border-gold/60 bg-gold/15 px-2.5 py-1.5 text-[11px] font-medium text-gold-deep"
                      >
                        Submit for QA
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setResourceStatus(resource.id, "published");
                        updateResource(resource.id, { featured: false });
                        toast.success("Resource published");
                      }}
                      className="focus-ring rounded-sm bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-parchment"
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
              <Eyebrow className="text-ink-soft">Batch metadata defaults</Eyebrow>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Set common values once — every newly staged file inherits them, and you can push them to all staged
                files at any time.
              </p>
              <Field label="Learning area">
                <Picker
                  value={batch.learningArea}
                  options={LEARNING_AREAS}
                  onChange={(v) => setBatch({ ...batch, learningArea: v })}
                />
              </Field>
              <Field label="Grade level">
                <Picker value={batch.gradeLevel} options={GRADE_LEVELS} onChange={(v) => setBatch({ ...batch, gradeLevel: v })} />
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
              <Field label="School">
                <Picker value={batch.school} options={SCHOOL_NAMES} onChange={(v) => setBatch({ ...batch, school: v })} />
              </Field>
              <Field label="Language">
                <Picker value={batch.language} options={LANGUAGES} onChange={(v) => setBatch({ ...batch, language: v })} />
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
                className="focus-ring w-full rounded-sm border border-ink/25 bg-card px-3 py-2 text-[12px] font-semibold text-ink disabled:opacity-50"
              >
                Apply to all staged files
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
