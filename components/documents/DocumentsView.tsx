"use client";

import { useRef } from "react";
import { FileCheck2, FileClock, FileText, FileWarning, Upload } from "lucide-react";
import type { CrmDocument } from "@/types/document";
import { DOCUMENT_CATEGORIES, documentService } from "@/services/documentService";
import { logActivity } from "@/services/followupService";
import { getSession, useSession } from "@/lib/auth";
import { todayISO } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { Badge, StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { DateText } from "@/components/common/Cells";
import { ResourcePage, type ResourceConfig } from "@/components/common/ResourcePage";
import { useToast } from "@/components/common/Toast";

const STATUSES = ["Verified", "Pending", "Expired"];
const FILE_TYPES = ["PDF", "DOCX", "XLSX", "JPG", "PNG", "ZIP"];

export function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function UploadButton() {
  const input = useRef<HTMLInputElement>(null);
  const session = useSession();
  const toast = useToast();
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          for (const f of files) {
            await documentService.create({
              name: f.name.replace(/\.[^.]+$/, ""),
              category: "Student",
              relatedTo: "—",
              fileType: (f.name.split(".").pop() ?? "FILE").toUpperCase(),
              sizeKb: Math.max(1, Math.round(f.size / 1024)),
              uploadedBy: session?.name ?? "Unknown",
              uploadedOn: todayISO(),
              status: "Pending",
            });
            await logActivity("document", "Document uploaded", `${f.name} uploaded for verification.`, session?.name);
          }
          if (files.length) toast(`${files.length} file${files.length > 1 ? "s" : ""} uploaded — edit to set category`);
          e.target.value = "";
        }}
      />
      <Button variant="dark" icon={<Upload className="h-4 w-4" />} onClick={() => input.current?.click()}>
        Upload files
      </Button>
    </>
  );
}

export const documentConfig: ResourceConfig<CrmDocument> = {
  entityName: "Document",
  module: "documents",
  service: documentService,
  basePath: "/documents",
  fields: [
    { name: "name", label: "Document name", required: true, colSpan: 2 },
    { name: "category", label: "Category", type: "select", required: true, options: DOCUMENT_CATEGORIES },
    { name: "relatedTo", label: "Related to", required: true, placeholder: "Student / employee / course" },
    { name: "fileType", label: "File type", type: "select", required: true, options: FILE_TYPES },
    { name: "sizeKb", label: "Size (KB)", type: "number", min: 0 },
    { name: "status", label: "Status", type: "select", required: true, options: STATUSES },
    { name: "uploadedBy", label: "Uploaded by", required: true },
  ],
  defaults: () => ({
    category: "Student",
    fileType: "PDF",
    status: "Pending",
    sizeKb: 250,
    uploadedOn: todayISO(),
    uploadedBy: getSession()?.name,
  }),
  beforeSave: (v, existing) => ({ uploadedOn: existing?.uploadedOn ?? todayISO(), sizeKb: Number(v.sizeKb || 0) }),
};

export function DocumentsView() {
  const { can } = usePermission();
  return (
    <ResourcePage<CrmDocument>
      {...documentConfig}
      title="Documents"
      description="Student certificates, employee records, finance and policy documents."
      searchKeys={["name", "relatedTo", "uploadedBy"]}
      filters={[
        { key: "category", label: "Categories", options: DOCUMENT_CATEGORIES },
        { key: "status", label: "Statuses", options: STATUSES },
      ]}
      headerActions={can("documents", "create") ? <UploadButton /> : undefined}
      stats={(rows) => [
        { label: "Documents", value: rows.length, icon: FileText },
        { label: "Verified", value: rows.filter((r) => r.status === "Verified").length, icon: FileCheck2, accent: "ember" },
        { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, icon: FileClock, accent: "cream" },
        { label: "Expired", value: rows.filter((r) => r.status === "Expired").length, icon: FileWarning, accent: "dark" },
      ]}
      columns={[
        {
          key: "name",
          header: "Document",
          render: (r) => (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700">
                {r.fileType}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{r.name}</p>
                <p className="text-xs text-stone-500">{formatSize(r.sizeKb)}</p>
              </div>
            </div>
          ),
        },
        { key: "category", header: "Category", render: (r) => <Badge tone="orange">{r.category}</Badge> },
        { key: "relatedTo", header: "Related to", hideBelow: "md" },
        { key: "uploadedBy", header: "Uploaded by", hideBelow: "lg" },
        { key: "uploadedOn", header: "Date", render: (r) => <DateText value={r.uploadedOn} />, hideBelow: "sm" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
