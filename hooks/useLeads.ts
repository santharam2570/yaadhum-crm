"use client";

import { useMemo } from "react";
import { leadService } from "@/services/leadService";
import { useResource } from "./useResource";

export function useLeads() {
  const resource = useResource(leadService);
  const stats = useMemo(() => {
    const rows = resource.data;
    return {
      total: rows.length,
      new: rows.filter((l) => l.status === "New").length,
      qualified: rows.filter((l) => l.status === "Qualified").length,
      converted: rows.filter((l) => l.status === "Converted").length,
    };
  }, [resource.data]);
  return { ...resource, stats };
}
