import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, CheckCircle2, Filter, History, Pencil, Search, Send, Trash2, X } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow, FileKindTag, StatusPill } from "@/components/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber, formatSize } from "@/lib/format";
import {
  COPYRIGHT_OPTIONS,
  GRADE_LEVELS,
  LANGUAGES,
  LEARNING_AREAS,
  QUARTERS,
  RESOURCE_TYPES,
  SCHOOL_NAMES,
  SCHOOL_YEARS,
  keyStageFor,
  subOfficeFor,
} from "@/lib/taxonomy";
import { uploadVersionFile } from "@/lib/cloud";
import { useLrms } from "@/lib/store";
import type { LearningResource, Quarter, ResourceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "pending", label: "For QA review" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
];

export default function ManageResources() {
  const { resources, updateResource, deleteResource, setResourceStatus, addVersion } = useLrms();
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [area, setArea] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<LearningResource | null>(null);
  const [versioning, setVersioning] = useState<LearningResource | null>(null);

  const rows = useMemo(
    () =>
      resources
        .filter((r) => {
          if (status !== "all" && r.status !== status) return false;
          if (area !== "all" && r.learningArea !== area) return false;
          if (query.trim()) {
            const q = query.toLowerCase();
            return (
              r.title.toLowerCase().includes(q) ||
              r.id.toLowerCase().includes(q) ||
              r.competencyCode.toLowerCase().includes(q) ||
              r.author.toLowerCase().includes(q) ||
              r.school.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .sort((a, b) => (a.dateUploaded < b.dateUploaded ? 1 : -1)),
    [resources, status, area, query],
  );

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const bulk = (action: ResourceStatus | "delete") => {
    if (selected.length === 0) return;
    selected.forEach((id) => {
      if (action === "delete") deleteResource(id);
      else setResourceStatus(id, action);
    });
    toast.success(
      action === "delete"
        ? `${selected.length} resource(s) deleted`
        : `${selected.length} resource(s) marked ${action}`,
    );
    setSelected([]);
  };

  return (
    <AdminShell
      title="Resource registry"
      subtitle={`${formatNumber(resources.length)} learning resources under division management`}
    >
      <div className="plate mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, resource ID, competency, author or school…"
            className="h-9 rounded-sm pl-9 text-[13px]"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[168px] rounded-sm text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="h-9 w-[196px] rounded-sm text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All learning areas</SelectItem>
            {LEARNING_AREAS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> {rows.length} shown
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-gold/50 bg-gold/12 px-4 py-3">
          <span className="text-[13px] font-semibold text-ink">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => bulk("published")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-ink px-3 py-1.5 text-[12px] font-medium text-parchment"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
            </button>
            <button
              type="button"
              onClick={() => bulk("pending")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-ink/25 bg-card px-3 py-1.5 text-[12px] font-medium text-ink"
            >
              <Send className="h-3.5 w-3.5" /> Send to QA
            </button>
            <button
              type="button"
              onClick={() => bulk("archived")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-ink/25 bg-card px-3 py-1.5 text-[12px] font-medium text-ink"
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
            <button
              type="button"
              onClick={() => bulk("delete")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-[12px] font-medium text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="focus-ring rounded-sm px-2 py-1.5 text-[12px] text-muted-foreground hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="plate overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-ink text-parchment">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : rows.map((r) => r.id))}
                    aria-label="Select all resources"
                    className="h-3.5 w-3.5 accent-gold"
                  />
                </th>
                {["Resource", "Classification", "File", "Status", "Usage", "Actions"].map((head) => (
                  <th key={head} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((resource) => (
                <tr key={resource.id} className="border-b border-border/60 align-top transition-colors hover:bg-gold/5">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(resource.id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(resource.id) ? prev.filter((id) => id !== resource.id) : [...prev, resource.id],
                        )
                      }
                      aria-label={`Select ${resource.title}`}
                      className="h-3.5 w-3.5 accent-gold"
                    />
                  </td>
                  <td className="max-w-[320px] px-3 py-3">
                    <Link to={`/resource/${resource.id}`} className="block truncate text-[13px] font-semibold text-ink hover:text-gold-deep">
                      {resource.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {resource.id} · {resource.competencyCode} · {resource.version}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {resource.author} · {resource.school}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-ink-soft">
                    <p>
                      {resource.gradeLevel} · {resource.learningArea}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {resource.quarter} · {resource.resourceType}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{resource.schoolYear}</p>
                  </td>
                  <td className="px-3 py-3">
                    <FileKindTag kind={resource.fileKind} />
                    <p className="tabular mt-1 text-[11px] text-muted-foreground">{formatSize(resource.fileSizeKB)}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(resource.dateUploaded)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={resource.status} />
                  </td>
                  <td className="tabular px-3 py-3 text-[12px] text-ink-soft">
                    <p>{formatNumber(resource.downloads)} downloads</p>
                    <p className="text-[11px] text-muted-foreground">{formatNumber(resource.views)} views</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <IconAction label="Edit metadata" onClick={() => setEditing(resource)} icon={Pencil} />
                      <IconAction label="Replace file version" onClick={() => setVersioning(resource)} icon={History} />
                      {resource.status !== "published" ? (
                        <IconAction
                          label="Publish"
                          icon={CheckCircle2}
                          onClick={() => {
                            setResourceStatus(resource.id, "published");
                            toast.success("Resource published to the public portal");
                          }}
                        />
                      ) : (
                        <IconAction
                          label="Archive"
                          icon={Archive}
                          onClick={() => {
                            setResourceStatus(resource.id, "archived");
                            toast.success("Resource archived");
                          }}
                        />
                      )}
                      <IconAction
                        label="Delete"
                        icon={Trash2}
                        tone="danger"
                        onClick={() => {
                          deleteResource(resource.id);
                          toast.success("Resource deleted from the registry");
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                    No resources match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditDialog
        resource={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return;
          updateResource(editing.id, patch);
          toast.success("Metadata updated");
          setEditing(null);
        }}
      />

      <VersionDialog
        resource={versioning}
        onClose={() => setVersioning(null)}
        onSave={async (note, fileSizeKB, fileName, replacementFile) => {
          if (!versioning) return;
          const minor = versioning.versions.length;
          const versionLabel = `v1.${minor}`;
          let storagePath: string | undefined;
          if (replacementFile) {
            const uploaded = await uploadVersionFile(versioning.id, versionLabel, replacementFile);
            if (uploaded) storagePath = uploaded.path;
          }
          addVersion(versioning.id, {
            version: versionLabel,
            fileName,
            fileSizeKB,
            uploadedAt: new Date().toISOString(),
            note,
            storagePath,
          });
          toast.success(`Version ${versionLabel} uploaded and set as current`);
          setVersioning(null);
        }}
      />
    </AdminShell>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  tone = "default",
}: {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "focus-ring grid h-7 w-7 place-items-center rounded-sm border transition-colors",
        tone === "danger"
          ? "border-border bg-card text-muted-foreground hover:border-destructive/60 hover:text-destructive"
          : "border-border bg-card text-ink-soft hover:border-gold/60 hover:text-gold-deep",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function EditDialog({
  resource,
  onClose,
  onSave,
}: {
  resource: LearningResource | null;
  onClose: () => void;
  onSave: (patch: Partial<LearningResource>) => void;
}) {
  const [draft, setDraft] = useState<LearningResource | null>(resource);

  if (resource && draft?.id !== resource.id) setDraft(resource);
  if (!resource || !draft) return null;

  const set = (patch: Partial<LearningResource>) => setDraft({ ...draft, ...patch });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <Eyebrow className="text-gold-deep">Edit metadata · {resource.id}</Eyebrow>
          <DialogTitle className="font-display text-xl">{resource.title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Title">
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} className="h-9 rounded-sm text-[13px]" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={3}
                className="rounded-sm text-[13px]"
              />
            </Field>
          </div>
          <Field label="Learning area">
            <Select value={draft.learningArea} onValueChange={(v) => set({ learningArea: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEARNING_AREAS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subject">
            <Input value={draft.subject} onChange={(e) => set({ subject: e.target.value })} className="h-9 rounded-sm text-[13px]" />
          </Field>
          <Field label="Grade level">
            <Select
              value={draft.gradeLevel}
              onValueChange={(v) => set({ gradeLevel: v, keyStage: keyStageFor(v) })}
            >
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quarter">
            <Select value={draft.quarter} onValueChange={(v) => set({ quarter: v as Quarter })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUARTERS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Competency code">
            <Input
              value={draft.competencyCode}
              onChange={(e) => set({ competencyCode: e.target.value })}
              className="h-9 rounded-sm font-mono text-[12px]"
            />
          </Field>
          <Field label="MELC / CG reference">
            <Input value={draft.melcReference} onChange={(e) => set({ melcReference: e.target.value })} className="h-9 rounded-sm text-[13px]" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Learning competency">
              <Textarea
                value={draft.learningCompetency}
                onChange={(e) => set({ learningCompetency: e.target.value })}
                rows={2}
                className="rounded-sm text-[13px]"
              />
            </Field>
          </div>
          <Field label="Resource type">
            <Select value={draft.resourceType} onValueChange={(v) => set({ resourceType: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Language">
            <Select value={draft.language} onValueChange={(v) => set({ language: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Author">
            <Input value={draft.author} onChange={(e) => set({ author: e.target.value })} className="h-9 rounded-sm text-[13px]" />
          </Field>
          <Field label="School">
            <Select value={draft.school} onValueChange={(v) => set({ school: v, subOffice: subOfficeFor(v) })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {SCHOOL_NAMES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Copyright">
            <Select value={draft.copyright} onValueChange={(v) => set({ copyright: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COPYRIGHT_OPTIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="School year">
            <Select value={draft.schoolYear} onValueChange={(v) => set({ schoolYear: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_YEARS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Keywords (comma separated)">
              <Input
                value={draft.keywords.join(", ")}
                onChange={(e) => set({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                className="h-9 rounded-sm text-[13px]"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-sm border border-border bg-card px-4 py-2 text-[13px] font-medium text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="focus-ring rounded-sm bg-ink px-4 py-2 text-[13px] font-semibold text-parchment"
          >
            Save metadata
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VersionDialog({
  resource,
  onClose,
  onSave,
}: {
  resource: LearningResource | null;
  onClose: () => void;
  onSave: (note: string, fileSizeKB: number, fileName: string, file: File | null) => void | Promise<void>;
}) {
  const [note, setNote] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  if (!resource) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <Eyebrow className="text-gold-deep">Replace file version</Eyebrow>
          <DialogTitle className="font-display text-lg">{resource.title}</DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-muted-foreground">
          Current version <span className="font-mono text-ink">{resource.version}</span> ·{" "}
          {formatSize(resource.fileSizeKB)}. Uploading a replacement keeps the full version history for auditing.
        </p>

        <label className="mt-3 block cursor-pointer rounded-sm border border-dashed border-border bg-muted/40 px-4 py-6 text-center transition-colors hover:border-gold/60">
          <input
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            accept=".pdf,.docx,.pptx,.epub,.mp4,.mp3,.png,.jpg"
          />
          <span className="block text-[13px] font-medium text-ink">
            {file ? file.name : "Choose replacement file"}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {file ? formatSize(file.size / 1024) : "PDF, DOCX, PPTX, EPUB, MP4, MP3 or image"}
          </span>
        </label>

        <div className="mt-3">
          <Field label="Revision note">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="e.g. Corrected answer key on page 12; re-tagged to MATATAG CG."
              className="rounded-sm text-[13px]"
            />
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-sm border border-border bg-card px-4 py-2 text-[13px] font-medium text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              Promise.resolve(
                onSave(
                  note.trim() || "Replacement file uploaded by the division administrator.",
                  file ? Math.max(1, Math.round(file.size / 1024)) : resource.fileSizeKB,
                  file?.name ?? resource.fileName,
                  file,
                ),
              ).finally(() => setBusy(false));
            }}
            className="focus-ring rounded-sm bg-ink px-4 py-2 text-[13px] font-semibold text-parchment disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Upload new version"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
