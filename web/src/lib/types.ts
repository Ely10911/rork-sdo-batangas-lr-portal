/** Core domain types for the SDO Batangas Learning Resource Management System. */

export type FileKind = "pdf" | "docx" | "pptx" | "epub" | "video" | "audio" | "image";

export type ResourceStatus = "published" | "pending" | "draft" | "archived";

export type Quarter = "Quarter 1" | "Quarter 2" | "Quarter 3" | "Quarter 4";

export type UserRole = "admin" | "viewer";

/** A single uploaded revision of a resource file. */
export interface ResourceVersion {
  version: string;
  fileName: string;
  fileSizeKB: number;
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
  fileSizeKB: number;
  pages: number;
  durationSec: number;
  language: string;
  author: string;
  school: string;
  subOffice: string;
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
}

export interface DownloadEvent {
  id: string;
  resourceId: string;
  at: string;
  subOffice: string;
  school: string;
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
  school: string;
  subOffice: string;
  lastActive: string;
  active: boolean;
}

export interface Session {
  role: UserRole;
  name: string;
  username: string;
}

/** Every filter dimension supported by the advanced search engine. */
export interface SearchFilters {
  query: string;
  learningArea: string;
  gradeLevel: string;
  quarter: string;
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
