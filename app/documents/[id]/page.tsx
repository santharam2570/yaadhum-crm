import type { Metadata } from "next";
import { DocumentDetail } from "@/components/documents/DocumentDetail";

export const metadata: Metadata = { title: "Document details" };

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetail id={id} />;
}
