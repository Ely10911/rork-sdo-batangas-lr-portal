import type { FileKind, Quarter } from "./types";

/** Classification vocabularies used across the portal (SDO Batangas context). */

export const DIVISION = "Schools Division Office of Batangas";

export const LEARNING_AREAS: string[] = [
  "Filipino",
  "English",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "Edukasyon sa Pagpapakatao",
  "MAPEH",
  "TLE / EPP",
  "Reading & Literacy",
  "Makabansa",
];

export const SUBJECTS_BY_AREA: Record<string, string[]> = {
  Filipino: ["Wika at Pagbasa", "Panitikan", "Pagbasa at Pagsusuri"],
  English: ["Reading Comprehension", "Grammar Awareness", "Creative Writing", "Oral Language"],
  Mathematics: ["Numbers & Number Sense", "Algebra", "Geometry", "Statistics & Probability", "Measurement"],
  Science: ["Matter", "Living Things & Environment", "Force, Motion & Energy", "Earth & Space", "Biology"],
  "Araling Panlipunan": ["Kasaysayan ng Pilipinas", "Ekonomiks", "Heograpiya", "Kasaysayan ng Daigdig"],
  "Edukasyon sa Pagpapakatao": ["Pananagutang Pansarili", "Pamilya", "Kabutihang Panlahat"],
  MAPEH: ["Music", "Arts", "Physical Education", "Health"],
  "TLE / EPP": ["Agri-Fishery Arts", "Home Economics", "ICT", "Industrial Arts", "Entrepreneurship"],
  "Reading & Literacy": ["Phonological Awareness", "Fluency", "Vocabulary Development"],
  Makabansa: ["Kasaysayan at Kultura", "Pagkamamayan", "Kalusugan at Kagalingan"],
};

export const GRADE_LEVELS: string[] = [
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export const KEY_STAGES: string[] = [
  "Key Stage 1 (K–3)",
  "Key Stage 2 (4–6)",
  "Key Stage 3 (7–10)",
  "Key Stage 4 (11–12)",
];

export function keyStageFor(grade: string): string {
  if (["Kindergarten", "Grade 1", "Grade 2", "Grade 3"].includes(grade)) return KEY_STAGES[0];
  if (["Grade 4", "Grade 5", "Grade 6"].includes(grade)) return KEY_STAGES[1];
  if (["Grade 7", "Grade 8", "Grade 9", "Grade 10"].includes(grade)) return KEY_STAGES[2];
  return KEY_STAGES[3];
}

export const SHS_STRANDS: string[] = [
  "STEM",
  "ABM",
  "HUMSS",
  "GAS",
  "TVL – Home Economics",
  "TVL – ICT",
  "TVL – Industrial Arts",
  "TVL – Agri-Fishery Arts",
  "Sports Track",
  "Arts & Design Track",
];

export const QUARTERS: Quarter[] = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];

export const RESOURCE_TYPES: string[] = [
  "Self-Learning Module",
  "Learning Activity Sheet",
  "Lesson Exemplar",
  "Teacher's Guide",
  "Learner's Material",
  "Assessment Tool",
  "Video Lesson",
  "Audio Lesson",
  "Interactive Multimedia",
  "Instructional Poster",
  "Curriculum Guide",
  "Supplementary Reading Material",
];

export const FILE_KINDS: FileKind[] = ["pdf", "docx", "pptx", "epub", "video", "audio", "image"];

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  pdf: "PDF Document",
  docx: "Word Document",
  pptx: "PowerPoint Deck",
  epub: "EPUB E-Book",
  video: "Video",
  audio: "Audio",
  image: "Image / Poster",
};

export const LANGUAGES: string[] = ["English", "Filipino", "Mother Tongue (Tagalog-Batangas)", "Bilingual"];

export const SCHOOL_YEARS: string[] = ["2023–2024", "2024–2025", "2025–2026", "2026–2027"];

/** Sub-offices of SDO Batangas with their component districts. */
export const SUB_OFFICES: { name: string; districts: string[] }[] = [
  {
    name: "Sub-Office I – Nasugbu",
    districts: ["Nasugbu East", "Nasugbu West", "Lian", "Calatagan", "Tuy", "Balayan"],
  },
  {
    name: "Sub-Office II – Lemery",
    districts: ["Lemery East", "Lemery West", "Taal", "Agoncillo", "San Nicolas", "Santa Teresita", "Calaca"],
  },
  {
    name: "Sub-Office III – Bauan",
    districts: ["Bauan", "Mabini", "Tingloy", "San Pascual", "Alitagtag", "Cuenca", "San Luis"],
  },
  {
    name: "Sub-Office IV – Rosario",
    districts: ["Rosario East", "Rosario West", "Padre Garcia", "San Juan", "Ibaan", "Taysan", "Lobo", "San Jose"],
  },
];

export const SUB_OFFICE_NAMES: string[] = SUB_OFFICES.map((s) => s.name);

export interface SchoolRecord {
  name: string;
  district: string;
  subOffice: string;
}

export const SCHOOLS: SchoolRecord[] = [
  { name: "Nasugbu East Central School", district: "Nasugbu East", subOffice: SUB_OFFICE_NAMES[0] },
  { name: "Bucana Integrated School", district: "Nasugbu West", subOffice: SUB_OFFICE_NAMES[0] },
  { name: "Lian Senior High School", district: "Lian", subOffice: SUB_OFFICE_NAMES[0] },
  { name: "Calatagan National High School", district: "Calatagan", subOffice: SUB_OFFICE_NAMES[0] },
  { name: "Balayan Central School", district: "Balayan", subOffice: SUB_OFFICE_NAMES[0] },
  { name: "Tuy Integrated National High School", district: "Tuy", subOffice: SUB_OFFICE_NAMES[0] },
  { name: "Lemery Pilot Elementary School", district: "Lemery East", subOffice: SUB_OFFICE_NAMES[1] },
  { name: "Taal National High School", district: "Taal", subOffice: SUB_OFFICE_NAMES[1] },
  { name: "Agoncillo Central School", district: "Agoncillo", subOffice: SUB_OFFICE_NAMES[1] },
  { name: "San Nicolas Integrated School", district: "San Nicolas", subOffice: SUB_OFFICE_NAMES[1] },
  { name: "Calaca Senior High School", district: "Calaca", subOffice: SUB_OFFICE_NAMES[1] },
  { name: "Bauan Technical High School", district: "Bauan", subOffice: SUB_OFFICE_NAMES[2] },
  { name: "Bauan West Central School", district: "Bauan", subOffice: SUB_OFFICE_NAMES[2] },
  { name: "Mabini National High School", district: "Mabini", subOffice: SUB_OFFICE_NAMES[2] },
  { name: "Tingloy Integrated School", district: "Tingloy", subOffice: SUB_OFFICE_NAMES[2] },
  { name: "San Pascual Senior High School", district: "San Pascual", subOffice: SUB_OFFICE_NAMES[2] },
  { name: "Cuenca Central School", district: "Cuenca", subOffice: SUB_OFFICE_NAMES[2] },
  { name: "Rosario East Central School", district: "Rosario East", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "Padre Garcia National High School", district: "Padre Garcia", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "San Juan Senior High School", district: "San Juan", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "Ibaan Central School", district: "Ibaan", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "Taysan Integrated National High School", district: "Taysan", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "Lobo National High School", district: "Lobo", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "Malabrigo Elementary School", district: "Lobo", subOffice: SUB_OFFICE_NAMES[3] },
  { name: "Division Learning Resource Center", district: "Division Office", subOffice: SUB_OFFICE_NAMES[2] },
];

export const SCHOOL_NAMES: string[] = SCHOOLS.map((s) => s.name);

export function districtFor(school: string): string {
  return SCHOOLS.find((s) => s.name === school)?.district ?? "Division Office";
}

export function subOfficeFor(school: string): string {
  return SCHOOLS.find((s) => s.name === school)?.subOffice ?? SUB_OFFICE_NAMES[2];
}

export const COPYRIGHT_OPTIONS: string[] = [
  "DepEd Owned — Open Educational Resource",
  "Creative Commons BY-NC-SA 4.0",
  "Creative Commons BY 4.0",
  "School-Based Development, DepEd Licensed",
  "Restricted — Division Use Only",
];

export const UPLOAD_WINDOWS: { value: string; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last quarter" },
  { value: "365", label: "Last school year" },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "recent", label: "Newest uploaded" },
  { value: "downloads", label: "Most downloaded" },
  { value: "views", label: "Most viewed" },
  { value: "rating", label: "Highest rated" },
  { value: "title", label: "Title A–Z" },
];
