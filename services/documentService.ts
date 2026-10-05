import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { CrmDocument, DocumentCategory } from "@/types/document";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "Student",
  "Admission",
  "Employee",
  "Finance",
  "Policy",
  "Marketing",
];

const DOCS: [string, DocumentCategory, string, string][] = [
  ["Aadhaar Card - Aarthi Murugan", "Student", "Aarthi Murugan", "PDF"],
  ["10th Marksheet - Charan Raj", "Admission", "Charan Raj", "PDF"],
  ["Degree Certificate - Harini Sekar", "Admission", "Harini Sekar", "PDF"],
  ["Offer Letter - Keerthana S", "Employee", "Keerthana S", "DOCX"],
  ["PAN Card - Arun Prakash", "Employee", "Arun Prakash", "JPG"],
  ["Fee Receipt RCPT-1004", "Finance", "Deepika Venkat", "PDF"],
  ["GST Filing - Q2", "Finance", "Yaadhum International", "XLSX"],
  ["HR Leave Policy 2026", "Policy", "All Employees", "PDF"],
  ["Code of Conduct", "Policy", "All Employees", "PDF"],
  ["Course Brochure - FSD", "Marketing", "Full Stack Development", "PDF"],
  ["Instagram Campaign Creatives", "Marketing", "Digital Marketing", "ZIP"],
  ["Transfer Certificate - Kavin Kumar", "Student", "Kavin Kumar", "PDF"],
];

export const documentService = createCollection<CrmDocument>("documents", () =>
  DOCS.map(([name, category, relatedTo, fileType], i) => ({
    id: `doc_${i + 1}`,
    name,
    category,
    relatedTo,
    fileType,
    sizeKb: 120 + ((i * 337) % 4800),
    uploadedBy: pick(["Karthik Selvam", "Divya Lakshmi", "Arun Prakash", "Naveen Raj"], i),
    uploadedOn: daysFromToday(-(i * 6 + 1)),
    status: i % 5 === 2 ? "Pending" : i === 4 ? "Expired" : "Verified",
  })),
);
