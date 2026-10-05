import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Lead, LeadSource, LeadStatus } from "@/types/lead";
import { COURSE_NAMES } from "./courseService";
import { COUNSELLORS } from "./employeeService";

export const LEAD_SOURCES: LeadSource[] = [
  "Website",
  "Walk-in",
  "Referral",
  "Facebook",
  "Instagram",
  "Google Ads",
  "Seminar",
  "WhatsApp",
];

export const LEAD_STATUSES: LeadStatus[] = ["New", "Contacted", "Qualified", "Converted", "Lost"];

const LEAD_NAMES = [
  "Ashwin Kumar", "Bhavani Shankar", "Chitra Devi", "Dinesh Pandian", "Elango Raja",
  "Gayathri Nair", "Hariharan M", "Indhu Mathi", "Jagan Mohan", "Kalaivani R",
  "Logesh Waran", "Madhu Mitha", "Naresh Babu", "Pavithra Suresh", "Ragul Dev",
  "Sangeetha P", "Thamarai Selvi", "Udhaya Kumar", "Vasanth Raj", "Yamini Krishnan",
  "Akash Varma", "Brindha Gopi", "Gowtham S", "Nithya Shree", "Surya Prakash",
  "Monisha T", "Prakash Raj", "Shalini Mohan",
];

const CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Erode", "Vellore"];

export const seedLeads = (): Lead[] =>
  LEAD_NAMES.map((name, i) => ({
    id: `led_${i + 1}`,
    name,
    email: `${name.split(" ")[0].toLowerCase()}${i}@gmail.com`,
    phone: `+91 9${String(876500000 + i * 13579).slice(0, 9)}`,
    source: pick(LEAD_SOURCES, i * 3),
    courseInterest: pick(COURSE_NAMES, i),
    status: pick(LEAD_STATUSES, i % 7 === 0 ? 3 : i),
    assignedTo: pick(COUNSELLORS, i),
    city: pick(CITIES, i),
    createdAt: daysFromToday(-((i * 7) % 170)),
    notes: i % 3 === 0 ? "Interested in weekend batch. Asked about EMI options." : "",
  }));

export const leadService = createCollection<Lead>("leads", seedLeads);

export async function getLeadOptions() {
  const rows = await leadService.list();
  return rows.map((l) => l.name);
}
