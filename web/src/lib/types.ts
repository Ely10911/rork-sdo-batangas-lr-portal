/** Core domain types for the SDO Batangas Learning Resource Management System. */

export type FileKind = "pdf" | "docx" | "pptx" | "epub" | "video" | "audio" | "image";

export type ResourceStatus = "published" | "pending" | "draft" | "archived";

export type Quarter = "All Terms" | "Term 1" | "Term 2" | "Term 3" | "Term 4";

/** A person credited as an author of a resource, with DepEd position and affiliation. */
export interface ResourceAuthor {
  name: string;
  position: string;
  school: string;
  subOffice: string;
}

export type UserRole = "admin" | "viewer" | "visitor";

/** A single uploaded revision of a resource file. */
export interface ResourceVersion {
  version: string;
  fileName: string;
  uploadedAt: string;
  note: string;
  /** Supabase Storage path for this version's file, when uploaded to the cloud. */
  storagePath?: string;
}

export type FeedbackKind = "review" | "issue" | "suggestion";

export interface Feedback {
  id: string;
  resourceId: string;
  author: string;
  stars: number;
  comment: string;
  kind: FeedbackKind;
  createdAt: string;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  learningArea: string;
  subject: string;
  gradeLevel: string;
  keyStage: string;
  shsStrand: string | null;
  quarter: Quarter;
  competencyCode: string;
  learningCompetency: string;
  melcReference: string;
  resourceType: string;
  fileKind: FileKind;
  fileName: string;
  /** Number of pages — admin-editable. */
  pages: number;
  durationSec: number;
  language: string;
  author: string;
  /** Primary author's DepEd plantilla position (e.g. "Master Teacher I"). */
  position: string;
  /** Week coverage, e.g. "All Weeks", "Week 3" or "Week 1-3". */
  week: string;
  /** All credited authors (primary first); synced with the legacy `author` field. */
  authors: ResourceAuthor[];
  /** Multiple schools can be selected for a resource. */
  schools: string[];
  /** Multiple sub-offices can be selected for a resource. */
  subOffices: string[];
  division: string;
  publisher: string;
  copyright: string;
  keywords: string[];
  schoolYear: string;
  version: string;
  versions: ResourceVersion[];
  status: ResourceStatus;
  dateCreated: string;
  dateUploaded: string;
  downloads: number;
  views: number;
  featured: boolean;
  /** Supabase Storage path (bucket-relative) when the file is persisted in the cloud. */
  storagePath: string | null;
  /** External link URL entered by admin instead of uploading a file directly. */
  linkUrl: string | null;
}

export interface DownloadEvent {
  id: string;
  resourceId: string;
  at: string;
  subOffices: string[];
  schools: string[];
  /** SHA-256 hash of the downloader's public IP — never the raw address.
   *  Downloads are counted once per IP address. */
  ipHash: string | null;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  resourceIds: string[];
  createdAt: string;
}

export type NotificationKind = "resource" | "curriculum" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  resourceId: string | null;
}

export interface PortalUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email: string;
  school: string;
  subOffice: string;
  lastActive: string;
  active: boolean;
}

export interface Session {
  role: UserRole;
  name: string;
  username: string;
  /** Present when the viewer has registered a portal account. */
  email?: string;
  school?: string;
  subOffice?: string;
  /** Portal user id for registered viewers (same as the visitor heartbeat id). */
  userId?: string;
  /** True when the session belongs to a self-registered viewer account. */
  registered?: boolean;
}

/** Every filter dimension supported by the advanced search engine. */
export interface SearchFilters {
  query: string;
  learningArea: string;
  gradeLevel: string;
  quarter: string;
  week: string;
  subject: string;
  keyStage: string;
  shsStrand: string;
  resourceType: string;
  fileKind: string;
  language: string;
  school: string;
  subOffice: string;
  schoolYear: string;
  competencyCode: string;
  author: string;
  uploadedWithin: string;
  sort: SortKey;
}

export type SortKey = "relevance" | "recent" | "downloads" | "rating" | "title" | "views";

export const ANY = "any" as const;

/** All credited author names for a resource (primary first, legacy field included). */
export function resourceAuthorNames(resource: LearningResource): string[] {
  const names = resource.authors.map((a) => a.name).filter(Boolean);
  if (resource.author && !names.includes(resource.author)) names.unshift(resource.author);
  return names;
}
