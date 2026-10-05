import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Admission, AdmissionStatus } from "@/types/admission";
import { COURSE_NAMES } from "./courseService";
import { COUNSELLORS } from "./employeeService";

const APPLICANTS = [
  "Arjun Natarajan", "Bharathi Kannan", "Dharani Mohan", "Elakkiya R", "Ganesh Moorthy",
  "Hemalatha V", "Iniyan Saravanan", "Jeevitha K", "Kishore Kumar", "Lakshmi Priya",
  "Manoj Kumar", "Nivetha Ramesh", "Pooja Shree", "Rakesh S", "Sowmya Devi", "Tamilselvan A",
];

const STATUSES: AdmissionStatus[] = ["Pending", "Under Review", "Approved", "Enrolled", "Rejected", "Enrolled", "Approved"];
const QUALIFICATIONS = ["B.E. CSE", "B.Sc. Computer Science", "BCA", "B.Com", "MCA", "Diploma", "B.Tech IT", "MBA"];

export const admissionService = createCollection<Admission>("admissions", () =>
  APPLICANTS.map((name, i) => ({
    id: `adm_${i + 1}`,
    applicationNo: `APP-26-${String(301 + i)}`,
    studentName: name,
    email: `${name.split(" ")[0].toLowerCase()}${i}@outlook.com`,
    phone: `+91 9${String(600200000 + i * 35791).slice(0, 9)}`,
    course: pick(COURSE_NAMES, i + 2),
    appliedOn: daysFromToday(-((i * 6) % 90)),
    counsellor: pick(COUNSELLORS, i),
    qualification: pick(QUALIFICATIONS, i),
    status: pick(STATUSES, i),
    remarks: "",
  })),
);
