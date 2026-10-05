"use client";

import {
  getAnalyticsReport,
  getCrmReport,
  getDashboardSummary,
  getFinanceReport,
  getHrReport,
  getStudentReport,
} from "@/services/reportService";
import { useAsyncData } from "./useResource";

const loaders = {
  dashboard: getDashboardSummary,
  crm: getCrmReport,
  students: getStudentReport,
  hr: getHrReport,
  finance: getFinanceReport,
  analytics: getAnalyticsReport,
};

type Loaders = typeof loaders;
export type ReportKind = keyof Loaders;
export type ReportData<K extends ReportKind> = Awaited<ReturnType<Loaders[K]>>;

export function useReports<K extends ReportKind>(kind: K) {
  return useAsyncData(loaders[kind] as () => Promise<ReportData<K>>);
}
