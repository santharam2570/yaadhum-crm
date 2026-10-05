import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Student, StudentStatus } from "@/types/student";
import { COURSE_CATALOG } from "./courseService";

export const STUDENT_NAMES = [
  "Aarthi Murugan", "Bala Subramanian", "Charan Raj", "Deepika Venkat", "Ezhil Arasan",
  "Fathima Begum", "Gokul Nath", "Harini Sekar", "Inbaraj Thangam", "Janani Ravi",
  "Kavin Kumar", "Lavanya Sundar", "Mohan Das", "Nandhini Prabhu", "Oviya Senthil",
  "Pranav Krishnan", "Ramya Gopal", "Sanjay Mani", "Tharun Vel", "Uma Maheswari",
  "Vignesh Babu", "Yazhini Anand", "Abdul Rahman", "Swetha Iyer",
];

const STATUSES: StudentStatus[] = ["Active", "Active", "Active", "Completed", "Active", "On Hold", "Active", "Dropped"];

/** Course index for each seeded student — shared with fees/payments seeds. */
export const studentCourse = (i: number) => COURSE_CATALOG[i % 7];

export const studentService = createCollection<Student>("students", () =>
  STUDENT_NAMES.map((name, i) => {
    const course = studentCourse(i);
    return {
      id: `stu_${i + 1}`,
      studentId: `YS26${String(101 + i)}`,
      name,
      email: `${name.split(" ")[0].toLowerCase()}.${i + 1}@gmail.com`,
      phone: `+91 9${String(500100000 + i * 24681).slice(0, 9)}`,
      course: course.name,
      batch: `${course.code}-2026-${i < 14 ? "A" : "B"}${(i % 7) + 1}`,
      enrollmentDate: daysFromToday(-((i * 9) % 160) - 5),
      guardianName: `${pick(["Murugan", "Ravi", "Sekar", "Krishnan", "Gopal", "Anand"], i)} ${name.split(" ")[1] ?? ""}`.trim(),
      guardianPhone: `+91 9${String(443300000 + i * 11111).slice(0, 9)}`,
      city: pick(["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"], i),
      status: pick(STATUSES, i),
    };
  }),
);

export async function getStudentOptions() {
  const rows = await studentService.list();
  return rows.map((s) => s.name);
}
