import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BookmarkX, Clock, FolderOpen, FolderPlus, Layers, Trash2 } from "lucide-react";

import { PortalShell } from "@/components/PortalShell";
import { ResourceCard } from "@/components/ResourceCard";
import { Eyebrow, SectionHeading } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import { useLrms } from "@/lib/store";

export default function Library() {
  const { resources, bookmarks, collections, history, createCollection, deleteCollection } = useLrms();
  const [tab, setTab] = useState<"favorites" | "collections" | "history">("favorites");
  const [name, setName] = useState<string>("");

  const byId = useMemo(() => new Map(resources.map((r) => [r.id, r])), [resources]);
  const favorites = useMemo(
    () => bookmarks.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [bookmarks, byId],
  );
  const recent = useMemo(
    () =>
      history
        .map((entry) => ({ resource: byId.get(entry.resourceId), at: entry.at }))
        .filter((row): row is { resource: NonNullable<ReturnType<typeof byId.get>>; at: string } => Boolean(row.resource)),
    [history, byId],
  );

  const tabs = [
    { key: "favorites" as const, label: "Favorites", icon: BookmarkX, count: favorites.length },
    { key: "collections" as const, label: "Collections", icon: Layers, count: collections.length },
    { key: "history" as const, label: "Download history", icon: Clock, count: recent.length },
  ];

  return (
    <PortalShell>
      <section className="ink-panel relative overflow-hidden border-b border-gold-deep/40">
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="container relative py-10">
          <Eyebrow className="text-gold-soft">Personal resource library</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">My library</h1>
          <p className="mt-2 max-w-2xl text-[13px] text-white/60">
            Your saved favorites, teaching collections and download history — kept on this device so you can pick up
            where you left off.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "focus-ring inline-flex items-center gap-2 rounded-sm border px-3.5 py-2 text-[13px] font-medium transition-colors",
                  tab === item.key
                    ? "border-gold bg-gold text-white"
                    : "border-border bg-card text-ink hover:border-gold/60",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                <span
                  className={cn(
                    "tabular rounded-full px-1.5 text-[10px] font-bold",
                    tab === item.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "favorites" &&
          (favorites.length === 0 ? (
            <EmptyState
              title="No favorites yet"
              body="Tap the bookmark icon on any resource to keep it here for quick access."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {favorites.map((resource, i) => (
                <ResourceCard key={resource.id} resource={resource} index={i} />
              ))}
            </div>
          ))}

        {tab === "collections" && (
          <div className="space-y-6">
            <div className="plate flex flex-wrap items-end gap-3 p-4">
              <label className="min-w-[220px] flex-1">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  New collection
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Grade 7 Remediation Pack"
                  className="h-9 rounded-sm text-[13px]"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    toast.error("Give your collection a name first.");
                    return;
                  }
                  createCollection(name.trim(), "Personal teaching collection.");
                  setName("");
                  toast.success("Collection created");
                }}
                className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2 text-[13px] font-semibold text-white"
              >
                <FolderPlus className="h-4 w-4" /> Create collection
              </button>
            </div>

            {collections.length === 0 ? (
              <EmptyState
                title="No collections yet"
                body="Group resources into collections for specific classes, terms or intervention programs."
              />
            ) : (
              collections.map((collection) => {
                const items = collection.resourceIds
                  .map((id) => byId.get(id))
                  .filter((r): r is NonNullable<typeof r> => Boolean(r));
                const totalPages = items.reduce((sum, r) => sum + r.pages, 0);
                return (
                  <div key={collection.id} className="plate overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-2 font-display text-[17px] font-semibold text-ink">
                          <FolderOpen className="h-4 w-4 text-gold-deep" /> {collection.name}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {items.length} resource{items.length === 1 ? "" : "s"} · {totalPages} pages total · created{" "}
                          {formatRelative(collection.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deleteCollection(collection.id);
                          toast.success(`Deleted “${collection.name}”`);
                        }}
                        className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                        This collection is empty — open a resource and choose “Add to collection”.
                      </p>
                    ) : (
                      items.map((resource) => <ResourceCard key={resource.id} resource={resource} variant="row" />)
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "history" && (
          <div>
            <SectionHeading eyebrow="Download management" title="Recently downloaded" />
            {recent.length === 0 ? (
              <EmptyState
                title="No downloads yet"
                body="Every resource you download is logged here with a timestamp, so you can find it again quickly."
              />
            ) : (
              <ol className="plate overflow-hidden">
                {recent.map((row) => (
                  <li key={`${row.resource.id}-${row.at}`} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 pl-4 text-[11px] text-muted-foreground">{formatRelative(row.at)}</span>
                    <div className="min-w-0 flex-1">
                      <ResourceCard resource={row.resource} variant="row" />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="plate flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Layers className="h-8 w-8 text-gold-deep" strokeWidth={1.5} />
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="max-w-md text-[13px] text-muted-foreground">{body}</p>
      <Link
        to="/browse"
        className="focus-ring mt-2 rounded-sm bg-gold px-4 py-2 text-[13px] font-medium text-white hover:bg-gold-deep"
      >
        Browse the catalog
      </Link>
    </div>
  );
}
