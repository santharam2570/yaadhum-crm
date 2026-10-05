"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { can, PERMISSIONS_EVENT, type Action, type ModuleKey } from "@/lib/permissions";

/** Permission checker bound to the current session; re-renders when the matrix changes. */
export function usePermission() {
  const session = useSession();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PERMISSIONS_EVENT, bump);
    return () => window.removeEventListener(PERMISSIONS_EVENT, bump);
  }, []);

  return {
    session,
    role: session?.role,
    can: (module: ModuleKey, action: Action = "view") => can(session?.role, module, action),
  };
}
