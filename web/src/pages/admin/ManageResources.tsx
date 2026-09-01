import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Check, CheckCircle2, Filter, History, Pencil, Plus, Search, Send, Trash2, X } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Eyebrow, FileKindTag, StatusPill } from "@/components/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/format";
import {
  COPYRIGHT_OPTIONS,
  GRADE_LEVELS,
  LANGUAGES,
  LEARNING_AREAS,
  POSITIONS,
  QUARTERS,
  RESOURCE_TYPES,
  SCHOOL_NAMES,
  SCHOOL_YEARS,
  SUB_OFFICE_NAMES,
  WEEK_OPTIONS,
  keyStageFor,
} from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";
import { resourceAuthorNames, type LearningResource, type Quarter, type ResourceAuthor, type ResourceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "pending", label: "For QA review" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
];

/** Multi-select chip picker for schools and sub-offices. */
function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className="focus-ring inline-flex items-center gap-1 rounded-sm bg-gold/15 px-2 py-1 text-[12px] font-medium text-gold-deep hover:bg-gold/25"
            >
              {value}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-muted-foreground underline hover:text-ink"
          >
            Clear all
          </button>
        </div>
      )}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="mb-2 h-8 rounded-sm text-[13px]"
      />
      <div className="max-h-40 overflow-y-auto rounded-sm border border-border bg-card">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[12px] text-muted-foreground">No matches found.</p>
        )}
        {filtered.map((option) => {
          const isSel = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "flex w-full items-center gap-2 border-b border-border/40 px-3 py-2 text-left text-[13px] transition-colors last:border-b-0",
                isSel ? "bg-gold/10 text-gold-deep" : "text-ink hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-sm border",
                  isSel ? "border-gold bg-gold text-white" : "border-border",
                )}
              >
                {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="truncate">{option}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {selected.length} selected · click items to toggle
      </p>
    </div>
  );
}

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
              resourceAuthorNames(r).some((a) => a.toLowerCase().includes(q)) ||
              r.schools.some((s) => s.toLowerCase().includes(q))
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
          <SelectTrigger className="h-9 w-[168px] rounded-sm text-[13px]">
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
          <SelectTrigger className="h-9 w-[196px] rounded-sm text-[13px]">
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
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> {rows.length} shown
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-gold/50 bg-gold/12 px-4 py-3">
          <span className="text-[14px] font-semibold text-ink">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => bulk("published")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-gold px-3 py-1.5 text-[13px] font-medium text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
            </button>
            <button
              type="button"
              onClick={() => bulk("pending")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-gold/25 bg-card px-3 py-1.5 text-[13px] font-medium text-ink"
            >
              <Send className="h-3.5 w-3.5" /> Send to QA
            </button>
            <button
              type="button"
              onClick={() => bulk("archived")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-gold/25 bg-card px-3 py-1.5 text-[13px] font-medium text-ink"
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
            <button
              type="button"
              onClick={() => bulk("delete")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-[13px] font-medium text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="focus-ring rounded-sm px-2 py-1.5 text-[13px] text-muted-foreground hover:text-ink"
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
              <tr className="border-b border-border bg-gold text-white">
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
                  <th key={head} className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
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
                    <Link to={`/resource/${resource.id}`} className="block truncate text-[14px] font-semibold text-ink hover:text-gold-deep">
                      {resource.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {resource.id} · {resource.competencyCode} · {resource.version}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {resource.author} · {resource.schools[0] ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-ink">
                    <p>
                      {resource.gradeLevel} · {resource.learningArea}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {resource.quarter} · {resource.resourceType}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{resource.schoolYear}</p>
                  </td>
                  <td className="px-3 py-3">
                    <FileKindTag kind={resource.fileKind} />
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {resource.durationSec > 0 ? `${resource.durationSec}s` : `${resource.pages} pages`}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{formatDate(resource.dateUploaded)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={resource.status} />
                  </td>
                  <td className="tabular px-3 py-3 text-[13px] text-ink">
                    <p>{formatNumber(resource.downloads)} downloads</p>
                    <p className="text-[12px] text-muted-foreground">{formatNumber(resource.views)} views</p>
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
                  <td colSpan={7} className="px-4 py-12 text-center text-[14px] text-muted-foreground">
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
        onSave={async (note, fileName, newLinkUrl) => {
          if (!versioning) return;
          const minor = versioning.versions.length;
          const versionLabel = `v1.${minor}`;
          addVersion(versioning.id, {
            version: versionLabel,
            fileName,
            uploadedAt: new Date().toISOString(),
            note,
          });
          if (newLinkUrl) {
            updateResource(versioning.id, { linkUrl: newLinkUrl, fileName: newLinkUrl });
          }
          toast.success(`Version ${versionLabel} set as current`);
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
          : "border-border bg-card text-ink hover:border-gold/60 hover:text-gold-deep",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
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

  /** Update the primary author while keeping the authors array in sync. */
  const setPrimaryAuthor = (patch: { author?: string; position?: string }) => {
    const primary = draft.authors[0] ?? { name: draft.author, position: draft.position, school: "", subOffice: "" };
    setDraft({
      ...draft,
      ...patch,
      authors: [{ ...primary, ...patch }, ...draft.authors.slice(1)],
    });
  };

  /** Replace the additional authors (index 1+) while keeping the primary author. */
  const setExtraAuthors = (list: ResourceAuthor[]) => {
    const primary = draft.authors[0] ?? { name: draft.author, position: draft.position, school: "", subOffice: "" };
    setDraft({ ...draft, authors: [primary, ...list] });
  };

  const extraAuthors = draft.authors.slice(1);

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
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} className="h-9 rounded-sm text-[14px]" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={3}
                className="rounded-sm text-[14px]"
              />
            </Field>
          </div>
          <Field label="Learning area">
            <Select value={draft.learningArea} onValueChange={(v) => set({ learningArea: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
            <Input value={draft.subject} onChange={(e) => set({ subject: e.target.value })} className="h-9 rounded-sm text-[14px]" />
          </Field>
          <Field label="Grade level">
            <Select
              value={draft.gradeLevel}
              onValueChange={(v) => set({ gradeLevel: v, keyStage: keyStageFor(v) })}
            >
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
          <Field label="Week">
            <Select value={draft.week} onValueChange={(v) => set({ week: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEK_OPTIONS.map((v) => (
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
              className="h-9 rounded-sm font-mono text-[13px]"
            />
          </Field>
          <Field label="MELC / CG reference">
            <Input value={draft.melcReference} onChange={(e) => set({ melcReference: e.target.value })} className="h-9 rounded-sm text-[14px]" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Learning competency">
              <Textarea
                value={draft.learningCompetency}
                onChange={(e) => set({ learningCompetency: e.target.value })}
                rows={2}
                className="rounded-sm text-[14px]"
              />
            </Field>
          </div>
          <Field label="Resource type">
            <Select value={draft.resourceType} onValueChange={(v) => set({ resourceType: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
          <Field label="Number of pages">
            <Input
              type="number"
              min={0}
              value={draft.pages}
              onChange={(e) => set({ pages: Math.max(0, Number(e.target.value) || 0) })}
              className="h-9 rounded-sm text-[14px]"
            />
          </Field>
          <Field label="Duration (seconds)">
            <Input
              type="number"
              min={0}
              value={draft.durationSec}
              onChange={(e) => set({ durationSec: Math.max(0, Number(e.target.value) || 0) })}
              className="h-9 rounded-sm text-[14px]"
            />
          </Field>
          <Field label="Author (primary)">
            <Input
              value={draft.author}
              onChange={(e) => setPrimaryAuthor({ author: e.target.value })}
              className="h-9 rounded-sm text-[14px]"
            />
          </Field>
          <Field label="Position (primary author)">
            <Select value={draft.position || POSITIONS[0]} onValueChange={(v) => setPrimaryAuthor({ position: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2 rounded-sm border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Additional authors
              </span>
              <button
                type="button"
                onClick={() =>
                  setExtraAuthors([...extraAuthors, { name: "", position: POSITIONS[0], school: "", subOffice: "" }])
                }
                className="focus-ring inline-flex items-center gap-1 rounded-sm border border-gold/40 bg-gold/10 px-2 py-1 text-[12px] font-medium text-gold-deep"
              >
                <Plus className="h-3 w-3" /> Add author
              </button>
            </div>
            {extraAuthors.length === 0 && (
              <p className="mt-2 text-[13px] text-muted-foreground">
                No additional authors. Click “Add author” to credit co-writers with their own name, position, school
                and sub-office.
              </p>
            )}
            <div className="mt-2 space-y-2">
              {extraAuthors.map((author, idx) => (
                <div
                  key={idx}
                  className="grid items-center gap-2 rounded-sm border border-border/60 bg-muted/30 p-2 md:grid-cols-[1.3fr_1.1fr_1.5fr_1.2fr_auto]"
                >
                  <Input
                    value={author.name}
                    onChange={(e) =>
                      setExtraAuthors(extraAuthors.map((a, i) => (i === idx ? { ...a, name: e.target.value } : a)))
                    }
                    placeholder="Full name"
                    className="h-9 rounded-sm text-[14px]"
                  />
                  <Select
                    value={author.position || POSITIONS[0]}
                    onValueChange={(v) => setExtraAuthors(extraAuthors.map((a, i) => (i === idx ? { ...a, position: v } : a)))}
                  >
                    <SelectTrigger className="h-9 rounded-sm text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={author.school || "—"}
                    onValueChange={(v) =>
                      setExtraAuthors(extraAuthors.map((a, i) => (i === idx ? { ...a, school: v === "—" ? "" : v } : a)))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-sm text-[13px]">
                      <SelectValue placeholder="— school —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="—">— school —</SelectItem>
                      {SCHOOL_NAMES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={author.subOffice || "—"}
                    onValueChange={(v) =>
                      setExtraAuthors(extraAuthors.map((a, i) => (i === idx ? { ...a, subOffice: v === "—" ? "" : v } : a)))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-sm text-[13px]">
                      <SelectValue placeholder="— sub-office —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="—">— sub-office —</SelectItem>
                      {SUB_OFFICE_NAMES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setExtraAuthors(extraAuthors.filter((_, i) => i !== idx))}
                    aria-label="Remove author"
                    className="focus-ring mx-auto grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Field label="Copyright">
            <Select value={draft.copyright} onValueChange={(v) => set({ copyright: v })}>
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
              <SelectTrigger className="h-9 rounded-sm text-[14px]">
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
            <MultiSelect
              label="Sub-offices"
              options={SUB_OFFICE_NAMES}
              selected={draft.subOffices}
              onChange={(values) => set({ subOffices: values })}
              placeholder="Search sub-offices…"
            />
          </div>
          <div className="md:col-span-2">
            <MultiSelect
              label="Schools"
              options={SCHOOL_NAMES}
              selected={draft.schools}
              onChange={(values) => set({ schools: values })}
              placeholder="Search schools…"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Keywords (comma separated)">
              <Input
                value={draft.keywords.join(", ")}
                onChange={(e) => set({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                className="h-9 rounded-sm text-[14px]"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-sm border border-border bg-card px-4 py-2 text-[14px] font-medium text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="focus-ring rounded-sm bg-gold px-4 py-2 text-[14px] font-semibold text-white"
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
  onSave: (note: string, fileName: string, newLinkUrl: string | null) => void | Promise<void>;
}) {
  const [note, setNote] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  if (!resource) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <Eyebrow className="text-gold-deep">Replace resource link</Eyebrow>
          <DialogTitle className="font-display text-lg">{resource.title}</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-muted-foreground">
          Current version <span className="font-mono text-ink">{resource.version}</span>.
          Replacing the link keeps the full version history for auditing.
        </p>

        <div className="mt-3">
          <Field label="New resource link URL">
            <Input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder={resource.linkUrl ?? resource.fileName}
              className="h-9 rounded-sm text-[14px]"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Revision note">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="e.g. Corrected answer key on page 12; re-tagged to MATATAG CG."
              className="rounded-sm text-[14px]"
            />
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-sm border border-border bg-card px-4 py-2 text-[14px] font-medium text-ink"
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
                  note.trim() || "Replacement link submitted by the division administrator.",
                  linkUrl.trim() || resource.fileName,
                  linkUrl.trim() || null,
                ),
              ).finally(() => setBusy(false));
            }}
            className="focus-ring rounded-sm bg-gold px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save new version"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
