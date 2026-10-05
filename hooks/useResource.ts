"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DATA_EVENT, type CrudService, type Entity } from "@/lib/api";

/** Loads a collection and keeps it in sync with any create/update/delete. */
export function useResource<T extends Entity>(service: CrudService<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const rows = await service.list();
        if (mounted.current) {
          setData(rows);
          setError(null);
        }
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [service],
  );

  useEffect(() => {
    mounted.current = true;
    refresh();
    const onChange = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (key === service.key || key === "*") refresh(true);
    };
    window.addEventListener(DATA_EVENT, onChange);
    return () => {
      mounted.current = false;
      window.removeEventListener(DATA_EVENT, onChange);
    };
  }, [refresh, service.key]);

  return {
    data,
    loading,
    error,
    refresh,
    create: service.create,
    update: service.update,
    remove: service.remove,
  };
}

/** Runs an async loader and re-runs it whenever any collection changes. */
export function useAsyncData<R>(loader: () => Promise<R>) {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async () => {
    try {
      setData(await loaderRef.current());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
    window.addEventListener(DATA_EVENT, run);
    return () => window.removeEventListener(DATA_EVENT, run);
  }, [run]);

  return { data, loading, refresh: run };
}
