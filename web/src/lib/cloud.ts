import { supabase, isSupabaseConfigured, RESOURCES_BUCKET } from "@/integrations/supabase/client";
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

export function rowToResource(row: ResourceRow): LearningResource {
  const versions = Array.isArray(row.versions) ? (row.versions as unknown as ResourceVersion[]) : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    learningArea: row.learning_area,
    subject: row.subject ?? "",
    gradeLevel: row.grade_level,
    keyStage: row.key_stage ?? "",
    shsStrand: row.shs_strand ?? null,
    quarter: row.quarter as LearningResource["quarter"],
    competencyCode: row.competency_code ?? "",
    learningCompetency: row.learning_competency ?? "",
    melcReference: row.melc_reference ?? "",
    resourceType: row.resource_type,
    fileKind: asKind(row.file_kind),
    fileName: row.file_name,
    fileSizeKB: row.file_size_kb,
    pages: row.pages,
    durationSec: row.duration_sec,
    language: row.language,
    author: row.author,
    school: row.school ?? "",
    subOffice: row.sub_office ?? "",
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
    file_size_kb: resource.fileSizeKB,
    pages: resource.pages,
    duration_sec: resource.durationSec,
    language: resource.language,
    author: resource.author,
    school: resource.school,
    sub_office: resource.subOffice,
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
  };
}

function rowToFeedback(row: FeedbackRow): Feedback {
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

function rowToDownloadEvent(row: DownloadEventRow): DownloadEvent {
  return {
    id: row.id,
    resourceId: row.resource_id,
    at: row.at,
    subOffice: row.sub_office,
    school: row.school,
  };
}

function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    resourceIds: row.resource_ids ?? [],
    createdAt: row.created_at,
  };
}

function rowToNotification(row: NotificationRow): AppNotification {
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

function rowToPortalUser(row: PortalUserRow): PortalUser {
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
  const { data, error } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
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
  const { data, error } = await supabase.from("bookmarks").select("resource_id");
  if (error) {
    console.warn("LRMS cloud: fetch bookmarks failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.resource_id);
}

/* ----------------------------------- mutations -------------------------------- */

export async function upsertCloudResource(resource: LearningResource): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("resources").upsert(resourceToInsert(resource));
  if (error) console.warn("LRMS cloud: upsert resource failed", error.message);
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
    sub_office: event.subOffice,
    school: event.school,
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
    created_at: collection.createdAt,
  });
  if (error) console.warn("LRMS cloud: upsert collection failed", error.message);
}

export async function deleteCloudCollection(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) console.warn("LRMS cloud: delete collection failed", error.message);
}

export async function toggleCloudBookmark(resourceId: string, add: boolean): Promise<void> {
  if (!supabase) return;
  if (add) {
    const { error } = await supabase.from("bookmarks").insert({ resource_id: resourceId });
    if (error && error.code !== "23505") console.warn("LRMS cloud: insert bookmark failed", error.message);
  } else {
    const { error } = await supabase.from("bookmarks").delete().eq("resource_id", resourceId);
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

/* ---------------------------------- seeding ----------------------------------- */

/**
 * Persist the local seed catalog into the cloud the first time the app boots
 * against an empty database, so the demo data is visible to every device.
 */
export async function seedCloudIfEmpty(resources: LearningResource[]): Promise<void> {
  if (!supabase || resources.length === 0) return;
  const { count, error } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true });
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
 * Upload a learning resource file to the public `resources` bucket.
 * Returns the storage path (bucket-relative) and the public URL.
 */
export async function uploadResourceFile(
  resource: LearningResource,
  file: File,
): Promise<{ path: string; publicUrl: string } | null> {
  if (!supabase) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const path = `${resource.id}/${resource.version}-${resource.fileName.replace(/\s+/g, "-")}.${ext}`;
  const { error } = await supabase.storage.from(RESOURCES_BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) {
    console.warn("LRMS storage: upload failed", error.message);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from(RESOURCES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: publicUrlData.publicUrl };
}

/**
 * Upload a replacement version file for an existing resource.
 */
export async function uploadVersionFile(
  resourceId: string,
  versionLabel: string,
  file: File,
): Promise<{ path: string; publicUrl: string } | null> {
  if (!supabase) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const path = `${resourceId}/${versionLabel}-${file.name.replace(/\s+/g, "-")}.${ext}`;
  const { error } = await supabase.storage.from(RESOURCES_BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) {
    console.warn("LRMS storage: version upload failed", error.message);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from(RESOURCES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: publicUrlData.publicUrl };
}

/**
 * Remove a storage object when a resource is deleted.
 */
export async function removeResourceFile(storagePath: string | null): Promise<void> {
  if (!supabase || !storagePath) return;
  const { error } = await supabase.storage.from(RESOURCES_BUCKET).remove([storagePath]);
  if (error) console.warn("LRMS storage: remove failed", error.message);
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

/**
 * Resolve a resource's public download URL from its storage path.
 */
export function resolvePublicUrl(storagePath: string | null): string | null {
  if (!supabase || !storagePath) return null;
  const { data } = supabase.storage.from(RESOURCES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl ?? null;
}

export { isSupabaseConfigured };
