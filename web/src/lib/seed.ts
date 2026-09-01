import type {
  AppNotification,
  DownloadEvent,
  Feedback,
  FileKind,
  LearningResource,
  PortalUser,
  Quarter,
  ResourceAuthor,
  ResourceStatus,
} from "./types";
import {
  COPYRIGHT_OPTIONS,
  DIVISION,
  QUARTERS,
  subOfficeFor,
  keyStageFor,
} from "./taxonomy";
import { slugify } from "./format";

/** Deterministic PRNG so the seeded catalog stays stable across reloads. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spec {
  title: string;
  area: string;
  subject: string;
  grade: string;
  quarter: number;
  type: string;
  kind: FileKind;
  code: string;
  competency: string;
  author: string;
  position?: string;
  week?: string;
  school: string;
  language: string;
  keywords: string[];
  strand?: string;
  status?: ResourceStatus;
  featured?: boolean;
}

const SPECS: Spec[] = [
  {
    title: "Pagsusuri sa Maikling Kuwento: Mga Elemento ng Panitikang Batangueño",
    area: "Filipino",
    subject: "Panitikan",
    grade: "Grade 8",
    quarter: 1,
    type: "Self-Learning Module",
    kind: "pdf",
    code: "F8PB-Ia-c-1",
    competency: "Nasusuri ang mga elemento ng maikling kuwento batay sa kaligirang pangkasaysayan ng Batangas.",
    author: "Ma. Cristina L. Bautista",
    school: "Taal National High School",
    language: "Filipino",
    keywords: ["maikling kuwento", "panitikan", "Batangas", "elemento"],
    featured: true,
  },
  {
    title: "Reading Comprehension Boosters: Inferring Meaning from Context",
    area: "English",
    subject: "Reading Comprehension",
    grade: "Grade 7",
    quarter: 1,
    type: "Learning Activity Sheet",
    kind: "pdf",
    code: "EN7RC-Ia-2.15",
    competency: "Use context clues to determine the meaning of unfamiliar words in a selection.",
    author: "Renato P. Dimaculangan",
    school: "Bauan Technical High School",
    language: "English",
    keywords: ["context clues", "vocabulary", "comprehension", "LAS"],
    featured: true,
  },
  {
    title: "Visualizing Quadratic Functions with Taal Lake Data",
    area: "Mathematics",
    subject: "Algebra",
    grade: "Grade 9",
    quarter: 1,
    type: "Interactive Multimedia",
    kind: "pptx",
    code: "M9AL-Ig-2",
    competency: "Represent a quadratic function using table of values, graph, and equation.",
    author: "Joel A. Manalo",
    school: "Mabini National High School",
    language: "English",
    keywords: ["quadratic", "graphing", "parabola", "contextualized"],
    featured: true,
  },
  {
    title: "Volcanic Landforms of Batangas: A Virtual Field Study",
    area: "Science",
    subject: "Earth & Space",
    grade: "Grade 9",
    quarter: 3,
    type: "Video Lesson",
    kind: "video",
    code: "S9ES-IIIa-b-1",
    competency: "Describe the different types of volcanoes and volcanic eruption using local landforms.",
    author: "Dr. Aileen M. Rosales",
    school: "Taal National High School",
    language: "English",
    keywords: ["volcano", "Taal", "landforms", "field study"],
    featured: true,
  },
  {
    title: "Ekonomiks sa Pamayanan: Suplay at Demand sa Palengke ng Lemery",
    area: "Araling Panlipunan",
    subject: "Ekonomiks",
    grade: "Grade 9",
    quarter: 2,
    type: "Lesson Exemplar",
    kind: "docx",
    code: "AP9MYK-IIa-1",
    competency: "Naipapaliwanag ang batas ng suplay at demand gamit ang lokal na pamilihan.",
    author: "Ferdinand C. Villena",
    school: "Lemery Pilot Elementary School",
    language: "Filipino",
    keywords: ["ekonomiks", "suplay", "demand", "palengke"],
  },
  {
    title: "Marungko Approach Kit: Pagkilala sa Tunog at Titik",
    area: "Reading & Literacy",
    subject: "Phonological Awareness",
    grade: "Grade 1",
    quarter: 1,
    type: "Learner's Material",
    kind: "pdf",
    code: "MT1PA-Ia-1",
    competency: "Nakikilala at natutukoy ang tunog ng mga titik sa simula ng salita.",
    author: "Lorna S. Aguilera",
    school: "Nasugbu East Central School",
    language: "Mother Tongue (Tagalog-Batangas)",
    keywords: ["marungko", "phonics", "early literacy", "remediation"],
    featured: true,
  },
  {
    title: "Kindergarten Big Book: Ang Aming Barangay",
    area: "Makabansa",
    subject: "Pagkamamayan",
    grade: "Kindergarten",
    quarter: 2,
    type: "Supplementary Reading Material",
    kind: "epub",
    code: "KIN-PN-IIa-3",
    competency: "Naipapakita ang pagmamalaki sa sariling pamayanan sa pamamagitan ng kuwento at guhit.",
    author: "Editha R. Sarmiento",
    school: "Ibaan Central School",
    language: "Filipino",
    keywords: ["big book", "kindergarten", "barangay", "storybook"],
  },
  {
    title: "Statistics in Action: Measures of Central Tendency Workbook",
    area: "Mathematics",
    subject: "Statistics & Probability",
    grade: "Grade 7",
    quarter: 4,
    type: "Learning Activity Sheet",
    kind: "docx",
    code: "M7SP-IVf-1",
    competency: "Calculate the measures of central tendency of ungrouped and grouped data.",
    author: "Marilou D. Katigbak",
    school: "Rosario East Central School",
    language: "English",
    keywords: ["mean", "median", "mode", "worksheet"],
  },
  {
    title: "Photosynthesis Explained: Animated Science Lesson",
    area: "Science",
    subject: "Living Things & Environment",
    grade: "Grade 6",
    quarter: 2,
    type: "Video Lesson",
    kind: "video",
    code: "S6LT-IIc-3",
    competency: "Explain how the process of photosynthesis sustains life on Earth.",
    author: "Arnel B. Panganiban",
    school: "Bauan West Central School",
    language: "English",
    keywords: ["photosynthesis", "plants", "animation", "science video"],
  },
  {
    title: "Awit at Galaw: Mga Kundiman ng Batangas (Audio Lesson)",
    area: "MAPEH",
    subject: "Music",
    grade: "Grade 5",
    quarter: 3,
    type: "Audio Lesson",
    kind: "audio",
    code: "MU5FO-IIIa-1",
    competency: "Naipapakita ang wastong tono at ritmo sa pag-awit ng kundiman.",
    author: "Cherry Ann V. Macatangay",
    school: "Cuenca Central School",
    language: "Filipino",
    keywords: ["kundiman", "folk song", "music", "listening"],
  },
  {
    title: "Health Advocacy Poster Set: Dengue Prevention in Schools",
    area: "MAPEH",
    subject: "Health",
    grade: "Grade 8",
    quarter: 4,
    type: "Instructional Poster",
    kind: "image",
    code: "H8CH-IVa-2",
    competency: "Advocate for community practices that prevent mosquito-borne diseases.",
    author: "Nurse Grace T. Aranas",
    school: "Padre Garcia National High School",
    language: "Bilingual",
    keywords: ["dengue", "health advocacy", "poster", "campaign"],
  },
  {
    title: "Bread and Pastry Production: Basic Yeast Doughs (TVL)",
    area: "TLE / EPP",
    subject: "Home Economics",
    grade: "Grade 11",
    quarter: 1,
    type: "Learner's Material",
    kind: "pdf",
    code: "TLE-BPP11-Ia-4",
    competency: "Prepare and produce bakery products following standard recipes and safety practices.",
    author: "Chef Ramil O. Hernandez",
    school: "San Pascual Senior High School 1",
    language: "English",
    keywords: ["bread", "pastry", "TVL", "competency-based"],
    strand: "TVL – Home Economics",
  },
  {
    title: "Practical Research 1: Crafting Qualitative Research Questions",
    area: "English",
    subject: "Creative Writing",
    grade: "Grade 11",
    quarter: 2,
    type: "Lesson Exemplar",
    kind: "docx",
    code: "CS-RS11-IIa-1",
    competency: "Design a research project related to daily life using qualitative methods.",
    author: "Prof. Dennis L. Ilagan",
    school: "San Juan Senior High School",
    language: "English",
    keywords: ["research", "qualitative", "SHS", "HUMSS"],
    strand: "HUMSS",
  },
  {
    title: "General Chemistry Laboratory Simulation: Titration",
    area: "Science",
    subject: "Matter",
    grade: "Grade 12",
    quarter: 1,
    type: "Interactive Multimedia",
    kind: "pptx",
    code: "SPS-GC12-Ib-9",
    competency: "Perform stoichiometric calculations from titration data.",
    author: "Engr. Katrina B. Mercado",
    school: "San Pascual Senior High School",
    language: "English",
    keywords: ["titration", "chemistry", "simulation", "STEM"],
    strand: "STEM",
  },
  {
    title: "Business Math: Buying and Selling with Local Enterprises",
    area: "TLE / EPP",
    subject: "Entrepreneurship",
    grade: "Grade 11",
    quarter: 3,
    type: "Self-Learning Module",
    kind: "pdf",
    code: "ABM-BM11-IIIa-2",
    competency: "Solve problems involving mark-on, mark-down, and mark-up using local business cases.",
    author: "Julius R. Berberabe",
    school: "Lian Senior High School",
    language: "English",
    keywords: ["business math", "ABM", "mark-up", "enterprise"],
    strand: "ABM",
  },
  {
    title: "Edukasyon sa Pagpapakatao: Paggalang sa Sarili at Kapwa",
    area: "Edukasyon sa Pagpapakatao",
    subject: "Pananagutang Pansarili",
    grade: "Grade 7",
    quarter: 2,
    type: "Self-Learning Module",
    kind: "pdf",
    code: "EsP7PS-IIa-1.1",
    competency: "Naipapaliwanag ang kahalagahan ng paggalang sa sarili at sa kapwa.",
    author: "Sr. Melinda A. Cabrera",
    school: "Taysan Integrated National High School",
    language: "Filipino",
    keywords: ["values", "paggalang", "EsP", "modyul"],
  },
  {
    title: "Geometry Toolkit: Angle Pairs Formed by Parallel Lines",
    area: "Mathematics",
    subject: "Geometry",
    grade: "Grade 8",
    quarter: 3,
    type: "Learning Activity Sheet",
    kind: "pdf",
    code: "M8GE-IIIf-1",
    competency: "Determine the relationships between angle pairs formed by parallel lines cut by a transversal.",
    author: "Reynaldo T. Atienza",
    school: "Tuy Integrated National High School",
    language: "English",
    keywords: ["angles", "parallel lines", "transversal", "geometry"],
  },
  {
    title: "Kasaysayan ng Pilipinas: Ang Rebolusyong 1896 sa Katagalugan",
    area: "Araling Panlipunan",
    subject: "Kasaysayan ng Pilipinas",
    grade: "Grade 6",
    quarter: 3,
    type: "Teacher's Guide",
    kind: "docx",
    code: "AP6PK-IIIb-2",
    competency: "Naisasalaysay ang mga mahahalagang pangyayari sa Rebolusyong 1896.",
    author: "Rodolfo M. Casapao",
    school: "Agoncillo Central School",
    language: "Filipino",
    keywords: ["rebolusyon", "1896", "kasaysayan", "gabay ng guro"],
  },
  {
    title: "Numeracy Remediation Deck: Addition with Regrouping",
    area: "Mathematics",
    subject: "Numbers & Number Sense",
    grade: "Grade 2",
    quarter: 1,
    type: "Interactive Multimedia",
    kind: "pptx",
    code: "M2NS-Ib-27.4",
    competency: "Add two- to three-digit numbers with regrouping using concrete models.",
    author: "Analyn P. Rivera",
    school: "Balayan East Central School",
    language: "English",
    keywords: ["numeracy", "regrouping", "remediation", "catch-up"],
  },
  {
    title: "Agri-Fishery Arts: Sustainable Tilapia Culture in Taal Lake",
    area: "TLE / EPP",
    subject: "Agri-Fishery Arts",
    grade: "Grade 10",
    quarter: 4,
    type: "Video Lesson",
    kind: "video",
    code: "TLE-AFA10-IVc-3",
    competency: "Apply sustainable aquaculture practices in fish cage management.",
    author: "Ronald V. Marasigan",
    school: "San Nicolas Integrated School",
    language: "Bilingual",
    keywords: ["aquaculture", "tilapia", "Taal Lake", "sustainability"],
  },
  {
    title: "English Oral Fluency Drills for Grade 4 Learners",
    area: "English",
    subject: "Oral Language",
    grade: "Grade 4",
    quarter: 2,
    type: "Audio Lesson",
    kind: "audio",
    code: "EN4OL-IIa-1.1",
    competency: "Read grade-level text with accuracy, appropriate rate, and expression.",
    author: "Michelle A. Alvarez",
    school: "Bauan West Central School",
    language: "English",
    keywords: ["fluency", "oral reading", "drills", "audio"],
  },
  {
    title: "Contextualized Curriculum Guide: MATATAG Grade 3 Makabansa",
    area: "Makabansa",
    subject: "Kasaysayan at Kultura",
    grade: "Grade 3",
    quarter: 1,
    type: "Curriculum Guide",
    kind: "pdf",
    code: "MK3KK-Ia-1",
    competency: "Naipapakita ang pagmamalaki sa kulturang Batangueño sa pamamagitan ng mga proyekto.",
    author: "Curriculum Implementation Division",
    school: "Taal Central School",
    language: "Filipino",
    keywords: ["MATATAG", "curriculum guide", "Makabansa", "contextualized"],
  },
  {
    title: "Science Investigatory Project Handbook for Junior High",
    area: "Science",
    subject: "Force, Motion & Energy",
    grade: "Grade 10",
    quarter: 2,
    type: "Teacher's Guide",
    kind: "pdf",
    code: "S10MT-IIa-b-5",
    competency: "Design an investigation that applies the scientific method to a community problem.",
    author: "Dr. Aileen M. Rosales",
    school: "Taal National High School",
    language: "English",
    keywords: ["SIP", "research", "scientific method", "handbook"],
  },
  {
    title: "Arts of Batangas: Embroidery and Barong Tagalog Design",
    area: "MAPEH",
    subject: "Arts",
    grade: "Grade 7",
    quarter: 4,
    type: "Instructional Poster",
    kind: "image",
    code: "A7EL-IVa-1",
    competency: "Create artwork inspired by the traditional crafts of the locality.",
    author: "Lorenzo P. Dimayuga",
    school: "Lobo National High School",
    language: "English",
    keywords: ["barong", "embroidery", "local arts", "crafts"],
  },
  {
    title: "Assessment Bank: Grade 5 Fractions Diagnostic Test",
    area: "Mathematics",
    subject: "Numbers & Number Sense",
    grade: "Grade 5",
    quarter: 2,
    type: "Assessment Tool",
    kind: "docx",
    code: "M5NS-IIa-78",
    competency: "Visualize and perform operations on fractions and mixed numbers.",
    author: "Erwin C. Malabanan",
    school: "Nasugbu East Central School",
    language: "English",
    keywords: ["diagnostic", "fractions", "assessment", "item bank"],
  },
  {
    title: "Physical Education: Batangas Folk Dance — Subli Basics",
    area: "MAPEH",
    subject: "Physical Education",
    grade: "Grade 6",
    quarter: 4,
    type: "Video Lesson",
    kind: "video",
    code: "PE6RD-IVa-2",
    competency: "Execute the basic steps of the Subli folk dance with proper form.",
    author: "Coach Willy S. Bagsit",
    school: "Bauan Technical High School",
    language: "Filipino",
    keywords: ["subli", "folk dance", "PE", "Bauan"],
    featured: true,
  },
  {
    title: "ICT Grade 12: Web Page Design with Semantic HTML",
    area: "TLE / EPP",
    subject: "ICT",
    grade: "Grade 12",
    quarter: 2,
    type: "Self-Learning Module",
    kind: "pdf",
    code: "TLE-ICT12-IIb-6",
    competency: "Create a responsive web page applying semantic markup and accessibility principles.",
    author: "Mark Anthony G. Lopez",
    school: "Calatagan National High School",
    language: "English",
    keywords: ["HTML", "web design", "ICT", "TVL"],
    strand: "TVL – ICT",
  },
  {
    title: "Panitikang Rehiyonal: Mga Bugtong at Salawikain ng Batangas",
    area: "Filipino",
    subject: "Pagbasa at Pagsusuri",
    grade: "Grade 5",
    quarter: 4,
    type: "Supplementary Reading Material",
    kind: "epub",
    code: "F5PB-IVc-2",
    competency: "Naiuugnay ang kahulugan ng bugtong at salawikain sa sariling karanasan.",
    author: "Teresita B. Landicho",
    school: "Rosario East Central School",
    language: "Filipino",
    keywords: ["bugtong", "salawikain", "panitikan", "rehiyonal"],
  },
  {
    title: "Island Learners' Kit: Blended Modules for Tingloy Schools",
    area: "English",
    subject: "Grammar Awareness",
    grade: "Grade 3",
    quarter: 3,
    type: "Learning Activity Sheet",
    kind: "pdf",
    code: "EN3G-IIIa-4",
    competency: "Use correct forms of verbs in simple sentences about everyday activities.",
    author: "Jonalyn F. Encarnacion",
    school: "Tingloy Integrated School",
    language: "English",
    keywords: ["blended", "island schools", "grammar", "verbs"],
  },
  {
    title: "Statistics & Probability: Hypothesis Testing Walkthrough",
    area: "Mathematics",
    subject: "Statistics & Probability",
    grade: "Grade 11",
    quarter: 4,
    type: "Interactive Multimedia",
    kind: "pptx",
    code: "M11SP-IVa-1",
    competency: "Formulate and test hypotheses on population means using real data sets.",
    author: "Joel A. Manalo",
    school: "Mabini National High School",
    language: "English",
    keywords: ["hypothesis", "statistics", "STEM", "walkthrough"],
    strand: "STEM",
  },
  {
    title: "Draft — Grade 4 Science: Simple Machines Activity Cards",
    area: "Science",
    subject: "Force, Motion & Energy",
    grade: "Grade 4",
    quarter: 3,
    type: "Learning Activity Sheet",
    kind: "docx",
    code: "S4FE-IIIa-1",
    competency: "Identify simple machines used at home and in school and describe their uses.",
    author: "Arnel B. Panganiban",
    school: "Bauan West Central School",
    language: "English",
    keywords: ["simple machines", "activity cards", "draft"],
    status: "draft",
  },
  {
    title: "For Review — Grade 10 Filipino: Sanaysay na Pampanitikan",
    area: "Filipino",
    subject: "Panitikan",
    grade: "Grade 10",
    quarter: 2,
    type: "Lesson Exemplar",
    kind: "docx",
    code: "F10PB-IIa-3",
    competency: "Nakabubuo ng sanaysay na naglalarawan ng isyung panlipunan sa lalawigan.",
    author: "Ma. Cristina L. Bautista",
    school: "Taal National High School",
    language: "Filipino",
    keywords: ["sanaysay", "panitikan", "quality assurance"],
    status: "pending",
  },
  {
    title: "Archived — Grade 7 Mathematics: Sets and Venn Diagrams (2023 Edition)",
    area: "Mathematics",
    subject: "Numbers & Number Sense",
    grade: "Grade 7",
    quarter: 1,
    type: "Self-Learning Module",
    kind: "pdf",
    code: "M7NS-Ia-1",
    competency: "Illustrate well-defined sets, subsets, and the union and intersection of sets.",
    author: "Marilou D. Katigbak",
    school: "Rosario East Central School",
    language: "English",
    keywords: ["sets", "venn diagram", "legacy"],
    status: "archived",
  },
];

const MELC_BOOKS = ["MELC p.", "CG p.", "MATATAG CG p."];

function iso(daysAgo: number, rand: () => number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(rand() * 10) + 7, Math.floor(rand() * 60), 0, 0);
  return d.toISOString();
}

export function buildResources(): LearningResource[] {
  const rand = mulberry32(20260731);
  return SPECS.map((spec, index) => {
    const status: ResourceStatus = spec.status ?? "published";
    const uploadedDaysAgo = Math.floor(rand() * 330) + (index < 6 ? 2 : 8);
    const dateUploaded = iso(uploadedDaysAgo, rand);
    const dateCreated = iso(uploadedDaysAgo + Math.floor(rand() * 60) + 10, rand);
    const isDoc = ["pdf", "docx", "epub"].includes(spec.kind);
    const pages = isDoc ? Math.floor(rand() * 26) + 8 : spec.kind === "pptx" ? Math.floor(rand() * 22) + 10 : 0;
    const durationSec = spec.kind === "video" || spec.kind === "audio" ? Math.floor(rand() * 900) + 240 : 0;
    const minorVersions = Math.floor(rand() * 3);
    const version = `v1.${minorVersions}`;
    const fileName = `${slugify(spec.title)}.${spec.kind}`;
    const subOffice = subOfficeFor(spec.school);
    const position = spec.position ?? "Teacher III";
    const authors: ResourceAuthor[] = [{ name: spec.author, position, school: spec.school, subOffice }];

    const versions = Array.from({ length: minorVersions + 1 }, (_, v) => ({
      version: `v1.${v}`,
      fileName,
      uploadedAt: iso(uploadedDaysAgo + (minorVersions - v) * 24, rand),
      note:
        v === 0
          ? "Initial upload submitted for quality assurance."
          : v === 1
            ? "Typographical corrections and updated competency mapping."
            : "Contextualized examples aligned to MATATAG curriculum.",
    }));

    return {
      id: `LR-2026-${(index + 1).toString().padStart(4, "0")}`,
      title: spec.title,
      description: buildDescription(spec),
      learningArea: spec.area,
      subject: spec.subject,
      gradeLevel: spec.grade,
      keyStage: keyStageFor(spec.grade),
      shsStrand: spec.strand ?? null,
      quarter: QUARTERS[spec.quarter - 1] as Quarter,
      competencyCode: spec.code,
      learningCompetency: spec.competency,
      melcReference: `${MELC_BOOKS[index % MELC_BOOKS.length]} ${Math.floor(rand() * 220) + 12}`,
      resourceType: spec.type,
      fileKind: spec.kind,
      fileName,
      pages,
      durationSec,
      language: spec.language,
      author: spec.author,
      position,
      week: spec.week ?? "All Weeks",
      authors,
      schools: [spec.school],
      subOffices: [subOffice],
      division: DIVISION,
      publisher: `${DIVISION} — Curriculum Implementation Division`,
      copyright: COPYRIGHT_OPTIONS[Math.floor(rand() * COPYRIGHT_OPTIONS.length)],
      keywords: spec.keywords,
      schoolYear: uploadedDaysAgo > 210 ? "2024–2025" : uploadedDaysAgo > 60 ? "2025–2026" : "2026–2027",
      version,
      versions,
      status,
      dateCreated,
      dateUploaded,
      downloads: 0,
      views: 0,
      featured: spec.featured ?? false,
      storagePath: null,
      linkUrl: null,
    };
  });
}

function buildDescription(spec: Spec): string {
  return `${spec.type} for ${spec.grade} ${spec.area} (${spec.subject}) aligned to competency ${spec.code}. ${spec.competency} Quality-assured by the ${DIVISION} Learning Resource Management System and contextualized for learners in ${subOfficeFor(spec.school)}.`;
}

/** Analytics are now zeroed — no seeded download events. */
export function buildDownloadEvents(_resources: LearningResource[]): DownloadEvent[] {
  return [];
}

export function buildFeedback(_resources: LearningResource[]): Feedback[] {
  return [];
}

export function buildNotifications(resources: LearningResource[]): AppNotification[] {
  const published = resources.filter((r) => r.status === "published");
  const rand = mulberry32(9091);
  const picks = [published[3], published[0], published[5], published[9]];
  const notes: AppNotification[] = [
    {
      id: "n-curr-1",
      kind: "curriculum",
      title: "MATATAG Curriculum Guide released for Grades 4 & 7",
      body: "The Curriculum Implementation Division has published the official MATATAG guides. Learning resources tagged to the previous CG will be re-mapped this quarter.",
      at: iso(2, rand),
      read: false,
      resourceId: null,
    },
    {
      id: "n-sys-1",
      kind: "system",
      title: "Quality assurance window for SY 2026–2027 now open",
      body: "Submit school-based learning resources for division-level QA until 30 September 2026.",
      at: iso(6, rand),
      read: false,
      resourceId: null,
    },
  ];
  picks.forEach((r, i) => {
    if (!r) return;
    notes.push({
      id: `n-res-${i}`,
      kind: "resource",
      title: `New learning resource: ${r.title}`,
      body: `${r.resourceType} · ${r.gradeLevel} ${r.learningArea} · uploaded by ${r.author} of ${r.schools[0]}.`,
      at: iso(i + 1, rand),
      read: i > 1,
      resourceId: r.id,
    });
  });
  return notes.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function buildUsers(): PortalUser[] {
  const rand = mulberry32(1357);
  const rows: [string, string, string][] = [
    ["Dr. Aileen M. Rosales", "arosales", "Taal National High School"],
    ["Ma. Cristina L. Bautista", "cbautista", "Taal National High School"],
    ["Renato P. Dimaculangan", "rdimaculangan", "Bauan Technical High School"],
    ["Joel A. Manalo", "jmanalo", "Mabini National High School"],
    ["Lorna S. Aguilera", "laguilera", "Nasugbu East Central School"],
    ["Ferdinand C. Villena", "fvillena", "Lemery Pilot Elementary School"],
    ["Marilou D. Katigbak", "mkatigbak", "Rosario East Central School"],
    ["Arnel B. Panganiban", "apanganiban", "Bauan West Central School"],
    ["Cherry Ann V. Macatangay", "cmacatangay", "Cuenca Central School"],
    ["Mark Anthony G. Lopez", "mlopez", "Calatagan National High School"],
    ["Jonalyn F. Encarnacion", "jencarnacion", "Tingloy Integrated School"],
    ["Julius R. Berberabe", "jberberabe", "Lian Senior High School"],
    ["Teresita B. Landicho", "tlandicho", "Rosario East Central School"],
    ["Coach Willy S. Bagsit", "wbagsit", "Bauan Technical High School"],
  ];
  const users: PortalUser[] = [
    {
      id: "U-0001",
      name: "Division LRMS Administrator",
      username: "SDOBatangasLRMS",
      role: "admin",
      school: "Taal National High School",
      subOffice: subOfficeFor("Taal National High School"),
      lastActive: iso(0, rand),
      active: true,
    },
  ];
  rows.forEach((row, i) => {
    users.push({
      id: `U-${(i + 2).toString().padStart(4, "0")}`,
      name: row[0],
      username: row[1],
      role: "viewer",
      school: row[2],
      subOffice: subOfficeFor(row[2]),
      lastActive: iso(Math.floor(rand() * 26), rand),
      active: rand() > 0.12,
    });
  });
  return users;
}

export const ADMIN_CREDENTIALS = {
  username: "SDOBatangasLRMS",
  password: "SDOBatangas@LRMS*2026",
} as const;
