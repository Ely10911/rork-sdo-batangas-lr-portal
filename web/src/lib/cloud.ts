import { supabase, isSupabaseConfigured, RESOURCES_BUCKET, VIEWER_ID } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  AppNotification,
  Collection,
  DownloadEvent,
  Feedback,
  FeedbackKind,
  FileKind,
  LearningResource,
  NotificationKind,
  PortalUser,
  ResourceAuthor,
  ResourceStatus,
  ResourceVersion,
} from "./types";

type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];
type ResourceInsert = Database["public"]["Tables"]["resources"]["Insert"];
type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];
type DownloadEventRow = Database["public"]["Tables"]["download_events"]["Row"];
type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type PortalUserRow = Database["public"]["Tables"]["portal_users"]["Row"];

/* ----------------------------------- mappers ---------------------------------- */

function asKind(value: string): FileKind {
  const kinds: FileKind[] = ["pdf", "docx", "pptx", "epub", "video", "audio", "image"];
  return (kinds.includes(value as FileKind) ? value : "pdf") as FileKind;
}

function asQuarter(value: string): string {
  const quarters: string[] = ["All Quarters", "Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
  return quarters.includes(value) ? value : "All Quarters";
}

function asStatus(value: string): ResourceStatus {
  const statuses: ResourceStatus[] = ["published", "pending", "draft", "archived"];
  return (statuses.includes(value as ResourceStatus) ? value : "draft") as ResourceStatus;
}

function asFeedbackKind(value: string): FeedbackKind {
  const kinds: FeedbackKind[] = ["review", "issue", "suggestion"];
  return (kinds.includes(value as FeedbackKind) ? value : "review") as FeedbackKind;
}

function asNotificationKind(value: string): NotificationKind {
  const kinds: NotificationKind[] = ["resource", "curriculum", "system"];
  return (kinds.includes(value as NotificationKind) ? value : "system") as NotificationKind;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

/** Parse the authors jsonb column, falling back to the legacy scalar author. */
function asAuthors(value: unknown, legacyAuthor: string): ResourceAuthor[] {
  if (Array.isArray(value)) {
    const list = value
      .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
      .map((a) => ({
        name: typeof a.name === "string" ? a.name : "",
        position: typeof a.position === "string" ? a.position : "",
        school: typeof a.school === "string" ? a.school : "",
        subOffice: typeof a.subOffice === "string" ? a.subOffice : "",
      }))
      .filter((a) => a.name);
    if (list.length > 0) return list;
  }
  return legacyAuthor ? [{ name: legacyAuthor, position: "", school: "", subOffice: "" }] : [];
}

export function rowToResource(row: ResourceRow): LearningResource {
  const versions = Array.isArray(row.versions) ? (row.versions as unknown as ResourceVersion[]) : [];
  // Handle both legacy single-value columns and new array columns
  const rawSchools = (row as Record<string, unknown>).schools;
  const rawSubOffices = (row as Record<string, unknown>).sub_offices;
  const legacySchool = typeof row.school === "string" ? row.school : "";
  const legacySubOffice = typeof row.sub_office === "string" ? row.sub_office : "";
  const rawWeek = (row as Record<string, unknown>).week;
  const rawAuthors = (row as Record<string, unknown>).authors;
  const authors = asAuthors(rawAuthors, row.author);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    learningArea: row.learning_area,
    subject: row.subject ?? "",
    gradeLevel: row.grade_level,
    keyStage: row.key_stage ?? "",
    shsStrand: row.shs_strand ?? null,
    quarter: asQuarter(row.quarter) as LearningResource["quarter"],
    competencyCode: row.competency_code ?? "",
    learningCompetency: row.learning_competency ?? "",
    melcReference: row.melc_reference ?? "",
    resourceType: row.resource_type,
    fileKind: asKind(row.file_kind),
    fileName: row.file_name,
    pages: row.pages,
    durationSec: row.duration_sec,
    language: row.language,
    author: authors[0]?.name ?? row.author,
    position: authors[0]?.position ?? "",
    week: typeof rawWeek === "string" && rawWeek ? rawWeek : "All Weeks",
    authors,
    schools: asStringArray(rawSchools).length > 0 ? asStringArray(rawSchools) : legacySchool ? [legacySchool] : [],
    subOffices: asStringArray(rawSubOffices).length > 0 ? asStringArray(rawSubOffices) : legacySubOffice ? [legacySubOffice] : [],
    division: row.division ?? "",
    publisher: row.publisher ?? "",
    copyright: row.copyright ?? "",
    keywords: row.keywords ?? [],
    schoolYear: row.school_year ?? "",
    version: row.version,
    versions,
    status: asStatus(row.status),
    dateCreated: row.date_created,
    dateUploaded: row.date_uploaded,
    downloads: row.downloads,
    views: row.views,
    featured: row.featured,
    storagePath: row.storage_path ?? null,
    linkUrl: row.link_url ?? null,
  };
}

export function resourceToInsert(resource: LearningResource): ResourceInsert {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    learning_area: resource.learningArea,
    subject: resource.subject,
    grade_level: resource.gradeLevel,
    key_stage: resource.keyStage,
    shs_strand: resource.shsStrand,
    quarter: resource.quarter,
    competency_code: resource.competencyCode,
    learning_competency: resource.learningCompetency,
    melc_reference: resource.melcReference,
    resource_type: resource.resourceType,
    file_kind: resource.fileKind,
    file_name: resource.fileName,
    pages: resource.pages,
    duration_sec: resource.durationSec,
    language: resource.language,
    author: resource.authors[0]?.name || resource.author,
    week: resource.week || "All Weeks",
    authors: resource.authors as unknown as Database["public"]["Tables"]["resources"]["Insert"]["authors"],
    schools: resource.schools,
    sub_offices: resource.subOffices,
    division: resource.division,
    publisher: resource.publisher,
    copyright: resource.copyright,
    keywords: resource.keywords,
    school_year: resource.schoolYear,
    version: resource.version,
    versions: resource.versions as unknown as Database["public"]["Tables"]["resources"]["Insert"]["versions"],
    status: resource.status,
    date_created: resource.dateCreated,
    date_uploaded: resource.dateUploaded,
    downloads: resource.downloads,
    views: resource.views,
    featured: resource.featured,
    storage_path: resource.storagePath ?? null,
    link_url: resource.linkUrl ?? null,
  };
}

export function rowToFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    resourceId: row.resource_id,
    author: row.author,
    stars: row.stars,
    comment: row.comment,
    kind: asFeedbackKind(row.kind),
    createdAt: row.created_at,
  };
}

export function rowToDownloadEvent(row: DownloadEventRow): DownloadEvent {
  const rawSchools = (row as Record<string, unknown>).schools;
  const rawSubOffices = (row as Record<string, unknown>).sub_offices;
  const legacySchool = typeof row.school === "string" ? row.school : "";
  const legacySubOffice = typeof row.sub_office === "string" ? row.sub_office : "";
  return {
    id: row.id,
    resourceId: row.resource_id,
    at: row.at,
    subOffices: asStringArray(rawSubOffices).length > 0 ? asStringArray(rawSubOffices) : legacySubOffice ? [legacySubOffice] : [],
    schools: asStringArray(rawSchools).length > 0 ? asStringArray(rawSchools) : legacySchool ? [legacySchool] : [],
  };
}

export function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    resourceIds: row.resource_ids ?? [],
    createdAt: row.created_at,
  };
}

export function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    kind: asNotificationKind(row.kind),
    title: row.title,
    body: row.body,
    at: row.at,
    read: row.read,
    resourceId: row.resource_id ?? null,
  };
}

export function rowToPortalUser(row: PortalUserRow): PortalUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role as PortalUser["role"],
    school: row.school,
    subOffice: row.sub_office,
    lastActive: row.last_active,
    active: row.active,
  };
}

/* ----------------------------------- fetchers --------------------------------- */

export async function fetchCloudResources(): Promise<LearningResource[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("resources").select("*").order("date_uploaded", { ascending: false });
  if (error) {
    console.warn("LRMS cloud: fetch resources failed", error.message);
    return [];
  }
  return (data ?? []).map(rowToResource);
}

export async function fetchCloudFeedback(): Promise<Feedback[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
  if (error) {
    console.warn("LRMS cloud: fetch feedback failed", error.message);
    return [];
  }
  return (data ?? []).map(rowToFeedback);
}

export async function fetchCloudDownloadEvents(): Promise<DownloadEvent[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("download_events").select("*").order("at", { ascending: false });
  if (error) {
    console.warn("LRMS cloud: fetch download_events failed", error.message);
    return [];
  }
  return (data ?? []).map(rowToDownloadEvent);
}

export async function fetchCloudCollections(): Promise<Collection[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("viewer_id", VIEWER_ID)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("LRMS cloud: fetch collections failed", error.message);
    return [];
  }
  return (data ?? []).map(rowToCollection);
}

export async function fetchCloudNotifications(): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("notifications").select("*").order("at", { ascending: false });
  if (error) {
    console.warn("LRMS cloud: fetch notifications failed", error.message);
    return [];
  }
  return (data ?? []).map(rowToNotification);
}

export async function fetchCloudUsers(): Promise<PortalUser[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("portal_users").select("*").order("last_active", { ascending: false });
  if (error) {
    console.warn("LRMS cloud: fetch portal_users failed", error.message);
    return [];
  }
  return (data ?? []).map(rowToPortalUser);
}

export async function fetchCloudBookmarks(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("bookmarks").select("resource_id").eq("viewer_id", VIEWER_ID);
  if (error) {
    console.warn("LRMS cloud: fetch bookmarks failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.resource_id);
}

/* ----------------------------------- mutations -------------------------------- */

export async function upsertCloudResource(resource: LearningResource): Promise<void> {
  if (!supabase) return;
  const payload = resourceToInsert(resource);
  const { error } = await supabase.from("resources").upsert(payload);
  if (!error) return;
  // Databases provisioned before the week/authors columns exist will reject the
  // new fields — retry once with the legacy payload so saves still succeed.
  if (/\b(week|authors)\b/i.test(error.message)) {
    const { week: _week, authors: _authors, ...legacy } = payload as Record<string, unknown>;
    const retry = await supabase.from("resources").upsert(legacy as ResourceInsert);
    if (retry.error) console.warn("LRMS cloud: upsert resource failed", retry.error.message);
    return;
  }
  console.warn("LRMS cloud: upsert resource failed", error.message);
}

export async function deleteCloudResource(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) console.warn("LRMS cloud: delete resource failed", error.message);
}

export async function incrementCloudDownloads(id: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.from("resources").select("downloads").eq("id", id).single();
  const next = (data?.downloads ?? 0) + 1;
  const { error } = await supabase.from("resources").update({ downloads: next }).eq("id", id);
  if (error) console.warn("LRMS cloud: increment downloads failed", error.message);
}

export async function incrementCloudViews(id: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.from("resources").select("views").eq("id", id).single();
  const next = (data?.views ?? 0) + 1;
  await supabase.from("resources").update({ views: next }).eq("id", id);
}

export async function insertCloudFeedback(feedback: Feedback): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("feedback").insert({
    id: feedback.id,
    resource_id: feedback.resourceId,
    author: feedback.author,
    stars: feedback.stars,
    comment: feedback.comment,
    kind: feedback.kind,
    created_at: feedback.createdAt,
  });
  if (error) console.warn("LRMS cloud: insert feedback failed", error.message);
}

export async function insertCloudDownloadEvent(event: DownloadEvent): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("download_events").insert({
    id: event.id,
    resource_id: event.resourceId,
    at: event.at,
    sub_offices: event.subOffices,
    schools: event.schools,
  });
  if (error) console.warn("LRMS cloud: insert download_event failed", error.message);
}

export async function upsertCloudCollection(collection: Collection): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("collections").upsert({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    resource_ids: collection.resourceIds,
    viewer_id: VIEWER_ID,
    created_at: collection.createdAt,
  });
  if (error) console.warn("LRMS cloud: upsert collection failed", error.message);
}

export async function deleteCloudCollection(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("collections").delete().eq("id", id).eq("viewer_id", VIEWER_ID);
  if (error) console.warn("LRMS cloud: delete collection failed", error.message);
}

export async function toggleCloudBookmark(resourceId: string, add: boolean): Promise<void> {
  if (!supabase) return;
  if (add) {
    const { error } = await supabase.from("bookmarks").insert({ resource_id: resourceId, viewer_id: VIEWER_ID });
    if (error && error.code !== "23505") console.warn("LRMS cloud: insert bookmark failed", error.message);
  } else {
    const { error } = await supabase.from("bookmarks").delete().eq("resource_id", resourceId).eq("viewer_id", VIEWER_ID);
    if (error) console.warn("LRMS cloud: delete bookmark failed", error.message);
  }
}

export async function upsertCloudNotification(notification: AppNotification): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("notifications").upsert({
    id: notification.id,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    at: notification.at,
    read: notification.read,
    resource_id: notification.resourceId,
  });
  if (error) console.warn("LRMS cloud: upsert notification failed", error.message);
}

export async function markCloudNotificationRead(id: string, read: boolean): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
  if (error) console.warn("LRMS cloud: update notification failed", error.message);
}

export async function upsertCloudUser(user: PortalUser): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("portal_users").upsert({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    school: user.school,
    sub_office: user.subOffice,
    last_active: user.lastActive,
    active: user.active,
  });
  if (error) console.warn("LRMS cloud: upsert portal_user failed", error.message);
}

/* --------------------------------- visitors ---------------------------------- */

const VISITOR_ID_KEY = "sdo-batangas-lrms:visitor-id";

/** Get or create a persistent visitor ID for this browser. */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "visitor-anon";
  try {
    let id = window.localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return "visitor-anon";
  }
}

/** Count total unique visitors ever recorded. */
export async function fetchCloudVisitorCount(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("portal_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "visitor");
  if (error) {
    console.warn("LRMS cloud: fetch visitor count failed", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Register a visitor session and update their last-active timestamp. */
export async function heartbeatVisitor(visitorId: string): Promise<void> {
  if (!supabase) return;
  const now = new Date().toISOString();
  const { error } = await supabase.from("portal_users").upsert({
    id: visitorId,
    name: "Anonymous Visitor",
    username: visitorId,
    role: "visitor",
    school: "",
    sub_office: "",
    last_active: now,
    active: true,
  });
  if (error) console.warn("LRMS cloud: visitor heartbeat failed", error.message);
}

/* --------------------------------- presence ---------------------------------- */

export type PresenceState = Record<string, { visitorId: string; joinedAt: string }>;

export type PresenceCallback = (activeCount: number) => void;

/** Subscribe to real-time presence for active user counting. */
export function subscribeToPresence(visitorId: string, onChange: PresenceCallback): (() => void) | undefined {
  if (!supabase) return undefined;

  const channel = supabase.channel("lrms-presence", {
    config: { presence: { key: visitorId } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as unknown as PresenceState;
      onChange(Object.keys(state).length);
    })
    .on("presence", { event: "join" }, () => {
      const state = channel.presenceState() as unknown as PresenceState;
      onChange(Object.keys(state).length);
    })
    .on("presence", { event: "leave" }, () => {
      const state = channel.presenceState() as unknown as PresenceState;
      onChange(Object.keys(state).length);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ visitorId, joinedAt: new Date().toISOString() });
      }
    });

  return () => {
    void channel.untrack();
    void supabase?.removeChannel(channel);
  };
}

/* ---------------------------------- realtime -------------------------------- */

export type CloudRefresh = () => void;

export type RealtimeCallback = (payload: {
  table: string;
  event: "INSERT" | "UPDATE" | "DELETE";
  new?: unknown;
  old?: { id?: string | number };
}) => void;

export function subscribeToCloudChanges(onChange: RealtimeCallback): (() => void) | undefined {
  if (!supabase) return undefined;

  const channel = supabase
    .channel("lrms-public-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "resources" },
      (payload) => onChange({ table: "resources", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      (payload) => onChange({ table: "notifications", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "feedback" },
      (payload) => onChange({ table: "feedback", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "download_events" },
      (payload) => onChange({ table: "download_events", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "collections" },
      (payload) => onChange({ table: "collections", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookmarks" },
      (payload) => onChange({ table: "bookmarks", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "portal_users" },
      (payload) => onChange({ table: "portal_users", event: payload.eventType as "INSERT" | "UPDATE" | "DELETE", new: payload.new, old: payload.old }),
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn("LRMS cloud: realtime channel error");
      }
    });

  return () => {
    void supabase?.removeChannel(channel);
  };
}

/* ---------------------------------- seeding ----------------------------------- */

/**
 * Persist the local seed catalog into the cloud the first time the app boots
 * against an empty database, so the demo data is visible to every device.
 */
export async function seedCloudIfEmpty(resources: LearningResource[]): Promise<void> {
  if (!supabase || resources.length === 0) return;
  const { count, error } = await supabase.from("resources").select("id", { count: "exact", head: true });
  if (error) {
    console.warn("LRMS cloud: seed count failed", error.message);
    return;
  }
  if ((count ?? 0) > 0) return;
  const inserts = resources.map(resourceToInsert);
  const { error: insertError } = await supabase.from("resources").insert(inserts);
  if (insertError) console.warn("LRMS cloud: seed insert failed", insertError.message);
}

/* --------------------------------- storage ------------------------------------ */

/**
 * Resolve a resource's public download URL from its storage path.
 */
export function resolvePublicUrl(storagePath: string | null): string | null {
  if (!supabase || !storagePath) return null;
  const { data } = supabase.storage.from(RESOURCES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl ?? null;
}

/**
 * Remove every file under a resource's folder (all versions) on delete.
 */
export async function removeResourceFolder(resourceId: string): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.storage.from(RESOURCES_BUCKET).list(resourceId);
  if (error) {
    console.warn("LRMS storage: list folder failed", error.message);
    return;
  }
  const paths = (data ?? []).map((entry) => `${resourceId}/${entry.name}`);
  if (paths.length === 0) return;
  const { error: removeError } = await supabase.storage.from(RESOURCES_BUCKET).remove(paths);
  if (removeError) console.warn("LRMS storage: remove folder failed", removeError.message);
}

export { isSupabaseConfigured };
