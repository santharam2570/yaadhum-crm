import { createCollection } from "@/lib/api";
import type { Course } from "@/types/course";

export const COURSE_CATALOG: Omit<Course, "id">[] = [
  { code: "FSD", name: "Full Stack Development", category: "Software", durationMonths: 6, fee: 65000, mode: "Hybrid", status: "Active", description: "MERN + Next.js with real-world projects." },
  { code: "DSA", name: "Data Science & AI", category: "Data", durationMonths: 8, fee: 85000, mode: "Hybrid", status: "Active", description: "Python, ML, deep learning and GenAI." },
  { code: "DM", name: "Digital Marketing", category: "Marketing", durationMonths: 4, fee: 35000, mode: "Offline", status: "Active", description: "SEO, SEM, social media and analytics." },
  { code: "UIX", name: "UI/UX Design", category: "Design", durationMonths: 4, fee: 45000, mode: "Online", status: "Active", description: "Figma, design systems and research." },
  { code: "CDO", name: "Cloud & DevOps", category: "Infrastructure", durationMonths: 5, fee: 55000, mode: "Online", status: "Active", description: "AWS, Docker, Kubernetes, CI/CD." },
  { code: "PY", name: "Python Programming", category: "Software", durationMonths: 2, fee: 18000, mode: "Offline", status: "Active", description: "Python fundamentals to advanced." },
  { code: "JAV", name: "Java Enterprise", category: "Software", durationMonths: 5, fee: 50000, mode: "Offline", status: "Active", description: "Core Java, Spring Boot, microservices." },
  { code: "CYB", name: "Cyber Security", category: "Security", durationMonths: 6, fee: 70000, mode: "Hybrid", status: "Draft", description: "Ethical hacking, SOC and compliance." },
];

export const COURSE_NAMES = COURSE_CATALOG.map((c) => c.name);

export const courseService = createCollection<Course>("courses", () =>
  COURSE_CATALOG.map((c, i) => ({ ...c, id: `crs_${i + 1}` })),
);

export async function getCourseOptions() {
  const rows = await courseService.list();
  return rows.map((c) => c.name);
}
