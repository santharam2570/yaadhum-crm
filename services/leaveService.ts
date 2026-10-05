import { createCollection } from "@/lib/api";
import { daysFromToday, pick } from "@/lib/utils";
import type { Holiday, Leave, LeaveType } from "@/types/leave";

const TYPES: LeaveType[] = ["Casual", "Sick", "Earned", "Casual", "Unpaid"];
const APPLICANTS = [
  "Revathi Ganesh", "Meena Kumari", "Keerthana S", "Vijay Anand", "Mani Bharathi",
  "Naveen Raj", "Rajesh Kannan", "Anitha Joseph", "Arun Prakash", "Karthik Selvam",
];
const REASONS = [
  "Family function in native place",
  "Fever and cold",
  "Personal work",
  "Medical check-up",
  "Travel to hometown",
];

export const leaveService = createCollection<Leave>("leaves", () =>
  APPLICANTS.map((employeeName, i) => {
    const start = -12 + i * 4;
    const days = (i % 3) + 1;
    return {
      id: `lev_${i + 1}`,
      employeeName,
      type: pick(TYPES, i),
      from: daysFromToday(start),
      to: daysFromToday(start + days - 1),
      days,
      reason: pick(REASONS, i),
      status: start < 0 ? (i === 2 ? "Rejected" : "Approved") : "Pending",
      appliedOn: daysFromToday(start - 5),
    };
  }),
);

const YEAR = new Date().getFullYear();
const HOLIDAYS: [string, string, Holiday["type"]][] = [
  ["New Year's Day", `${YEAR}-01-01`, "Public"],
  ["Pongal", `${YEAR}-01-14`, "Public"],
  ["Thiruvalluvar Day", `${YEAR}-01-15`, "Public"],
  ["Republic Day", `${YEAR}-01-26`, "Public"],
  ["Tamil New Year", `${YEAR}-04-14`, "Public"],
  ["May Day", `${YEAR}-05-01`, "Public"],
  ["Independence Day", `${YEAR}-08-15`, "Public"],
  ["Vinayagar Chathurthi", `${YEAR}-09-14`, "Public"],
  ["Gandhi Jayanthi", `${YEAR}-10-02`, "Public"],
  ["Ayudha Pooja", `${YEAR}-10-20`, "Public"],
  ["Deepavali", `${YEAR}-11-08`, "Public"],
  ["Yaadhum Foundation Day", `${YEAR}-11-21`, "Company"],
  ["Karthigai Deepam", `${YEAR}-12-04`, "Optional"],
  ["Christmas", `${YEAR}-12-25`, "Public"],
];

export const holidayService = createCollection<Holiday>("holidays", () =>
  HOLIDAYS.map(([name, date, type], i) => ({
    id: `hol_${i + 1}`,
    name,
    date,
    type,
    description: type === "Company" ? "Annual celebration — office closed." : "",
  })),
);
