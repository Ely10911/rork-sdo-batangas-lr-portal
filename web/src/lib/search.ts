import { resourceAuthorNames, type LearningResource, type SearchFilters, type SortKey } from "./types";

export const EMPTY_FILTERS: SearchFilters = {
  query: "",
  learningArea: "any",
  gradeLevel: "any",
  quarter: "any",
  week: "any",
  subject: "any",
  keyStage: "any",
  shsStrand: "any",
  resourceType: "any",
  fileKind: "any",
  language: "any",
  school: "any",
  subOffice: "any",
  schoolYear: "any",
  competencyCode: "",
  author: "any",
  uploadedWithin: "any",
  sort: "relevance",
};

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9ñáéíóú]+/i)
    .filter((t) => t.length > 1);
}

/** Weighted keyword score: title > keywords > competency > description. */
export function scoreResource(resource: LearningResource, query: string): number {
  if (!query.trim()) return 0;
  const q = query.toLowerCase().trim();
  let score = 0;
  const title = resource.title.toLowerCase();
  if (title.includes(q)) score += 60;
  if (resource.competencyCode.toLowerCase().includes(q)) score += 55;
  if (resource.id.toLowerCase().includes(q)) score += 70;
  if (resource.keywords.some((k) => k.toLowerCase().includes(q))) score += 34;
  if (resourceAuthorNames(resource).some((a) => a.toLowerCase().includes(q))) score += 26;
  if (resource.schools.some((s) => s.toLowerCase().includes(q))) score += 20;
  if (resource.learningCompetency.toLowerCase().includes(q)) score += 18;
  if (resource.description.toLowerCase().includes(q)) score += 10;

  tokens(q).forEach((token) => {
    if (title.includes(token)) score += 12;
    if (resource.keywords.some((k) => k.toLowerCase().includes(token))) score += 8;
    if (resource.subject.toLowerCase().includes(token)) score += 6;
    if (resource.learningArea.toLowerCase().includes(token)) score += 6;
    if (resource.gradeLevel.toLowerCase().includes(token)) score += 5;
    if (resource.learningCompetency.toLowerCase().includes(token)) score += 4;
    if (resource.description.toLowerCase().includes(token)) score += 2;
  });
  return score;
}

function withinDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() <= days * 86400000;
}

export interface SearchOptions {
  includeUnpublished?: boolean;
  ratingIndex?: Record<string, { average: number; count: number }>;
}

export function searchResources(
  resources: LearningResource[],
  filters: SearchFilters,
  options: SearchOptions = {},
): LearningResource[] {
  const { includeUnpublished = false, ratingIndex = {} } = options;
  const q = filters.query.trim();

  const rows = resources.filter((r) => {
    if (!includeUnpublished && r.status !== "published") return false;
    if (filters.learningArea !== "any" && r.learningArea !== filters.learningArea) return false;
    if (filters.gradeLevel !== "any" && r.gradeLevel !== filters.gradeLevel) return false;
    if (filters.quarter !== "any" && r.quarter !== filters.quarter) return false;
    if (filters.week !== "any" && r.week !== filters.week) return false;
    if (filters.subject !== "any" && r.subject !== filters.subject) return false;
    if (filters.keyStage !== "any" && r.keyStage !== filters.keyStage) return false;
    if (filters.shsStrand !== "any" && r.shsStrand !== filters.shsStrand) return false;
    if (filters.resourceType !== "any" && r.resourceType !== filters.resourceType) return false;
    if (filters.fileKind !== "any" && r.fileKind !== filters.fileKind) return false;
    if (filters.language !== "any" && r.language !== filters.language) return false;
    if (filters.school !== "any" && !r.schools.includes(filters.school)) return false;
    if (filters.subOffice !== "any" && !r.subOffices.includes(filters.subOffice)) return false;
    if (filters.schoolYear !== "any" && r.schoolYear !== filters.schoolYear) return false;
    if (filters.author !== "any" && !resourceAuthorNames(r).includes(filters.author)) return false;
    if (
      filters.competencyCode.trim() &&
      !r.competencyCode.toLowerCase().includes(filters.competencyCode.trim().toLowerCase())
    ) {
      return false;
    }
    if (filters.uploadedWithin !== "any" && !withinDays(r.dateUploaded, Number(filters.uploadedWithin))) return false;
    if (q && scoreResource(r, q) === 0) return false;
    return true;
  });

  return sortResources(rows, filters.sort, q, ratingIndex);
}

export function sortResources(
  rows: LearningResource[],
  sort: SortKey,
  query: string,
  ratingIndex: Record<string, { average: number; count: number }>,
): LearningResource[] {
  const sorted = [...rows];
  switch (sort) {
    case "recent":
      sorted.sort((a, b) => (a.dateUploaded < b.dateUploaded ? 1 : -1));
      break;
    case "downloads":
      sorted.sort((a, b) => b.downloads - a.downloads);
      break;
    case "views":
      sorted.sort((a, b) => b.views - a.views);
      break;
    case "rating":
      sorted.sort((a, b) => (ratingIndex[b.id]?.average ?? 0) - (ratingIndex[a.id]?.average ?? 0));
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      if (query.trim()) {
        sorted.sort((a, b) => scoreResource(b, query) - scoreResource(a, query) || b.downloads - a.downloads);
      } else {
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.downloads - a.downloads);
      }
  }
  return sorted;
}

export interface Suggestion {
  label: string;
  hint: string;
  kind: "resource" | "competency" | "keyword" | "author" | "school";
  resourceId?: string;
}

/** Auto-complete suggestions across titles, competency codes, keywords, authors and schools. */
export function buildSuggestions(resources: LearningResource[], query: string, limit = 8): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const push = (s: Suggestion) => {
    const key = `${s.kind}:${s.label}`;
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push(s);
  };

  const published = resources.filter((r) => r.status === "published");

  published
    .filter((r) => r.title.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((r) => push({ label: r.title, hint: `${r.gradeLevel} · ${r.learningArea}`, kind: "resource", resourceId: r.id }));

  published
    .filter((r) => r.competencyCode.toLowerCase().includes(q))
    .slice(0, 3)
    .forEach((r) => push({ label: r.competencyCode, hint: "Competency code", kind: "competency" }));

  published.forEach((r) => {
    r.keywords.filter((k) => k.toLowerCase().includes(q)).forEach((k) => push({ label: k, hint: "Keyword", kind: "keyword" }));
  });

  published.forEach((r) => {
    resourceAuthorNames(r)
      .filter((a) => a.toLowerCase().includes(q))
      .forEach((a) => push({ label: a, hint: "Author", kind: "author" }));
  });

  published.forEach((r) => {
    r.schools.filter((s) => s.toLowerCase().includes(q)).forEach((s) => push({ label: s, hint: "School", kind: "school" }));
  });

  return out;
}

/** Resources sharing competency, subject or grade with the given resource. */
export function relatedResources(resources: LearningResource[], resource: LearningResource, limit = 4): LearningResource[] {
  return resources
    .filter((r) => r.id !== resource.id && r.status === "published")
    .map((r) => {
      let score = 0;
      if (r.competencyCode === resource.competencyCode) score += 40;
      if (r.subject === resource.subject) score += 18;
      if (r.learningArea === resource.learningArea) score += 14;
      if (r.gradeLevel === resource.gradeLevel) score += 12;
      if (r.quarter === resource.quarter) score += 6;
      if (r.schools.some((s) => resource.schools.includes(s))) score += 4;
      score += r.keywords.filter((k) => resource.keywords.includes(k)).length * 8;
      return { r, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.r.downloads - a.r.downloads)
    .slice(0, limit)
    .map((entry) => entry.r);
}

export function activeFilterCount(filters: SearchFilters): number {
  let count = 0;
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "query" || key === "sort") return;
    if (typeof value === "string" && value && value !== "any") count += 1;
  });
  return count;
}
