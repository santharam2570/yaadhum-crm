export type DocumentCategory =
  | "Student"
  | "Admission"
  | "Employee"
  | "Finance"
  | "Policy"
  | "Marketing";

export type DocumentStatus = "Verified" | "Pending" | "Expired";

export interface CrmDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  relatedTo: string;
  fileType: string;
  sizeKb: number;
  uploadedBy: string;
  uploadedOn: string;
  status: DocumentStatus;
}
