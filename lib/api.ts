import { uid } from "./utils";

export interface Entity {
  id: string;
}

export interface CrudService<T extends Entity> {
  key: string;
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const DATA_EVENT = "yaadhum:data";
const STORAGE_PREFIX = "yaadhum:v1:";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper used when NEXT_PUBLIC_API_URL points at a real backend. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("yaadhum:token") : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function emit(key: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: key }));
  }
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function readStore<T>(key: string, seed: () => T[]): T[] {
  if (typeof window === "undefined") return seed();
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (raw) {
    try {
      return JSON.parse(raw) as T[];
    } catch {
      /* fall through to reseed */
    }
  }
  const data = seed();
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  return data;
}

function writeStore<T>(key: string, rows: T[]) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(rows));
  emit(key);
}

/**
 * Creates a CRUD service for a collection. Uses the REST backend at
 * `${NEXT_PUBLIC_API_URL}/${key}` when configured, otherwise a browser-local
 * store seeded with demo data.
 */
export function createCollection<T extends Entity>(key: string, seed: () => T[]): CrudService<T> {
  if (API_URL) {
    return {
      key,
      list: () => http<T[]>(`/${key}`),
      get: (id) => http<T>(`/${key}/${id}`),
      create: async (data) => {
        const row = await http<T>(`/${key}`, { method: "POST", body: JSON.stringify(data) });
        emit(key);
        return row;
      },
      update: async (id, patch) => {
        const row = await http<T>(`/${key}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        emit(key);
        return row;
      },
      remove: async (id) => {
        await http<void>(`/${key}/${id}`, { method: "DELETE" });
        emit(key);
      },
    };
  }

  return {
    key,
    async list() {
      await delay();
      return readStore(key, seed);
    },
    async get(id) {
      await delay(60);
      return readStore(key, seed).find((r) => r.id === id);
    },
    async create(data) {
      await delay();
      const row = { ...data, id: uid(key.slice(0, 3)) } as T;
      writeStore(key, [row, ...readStore(key, seed)]);
      return row;
    },
    async update(id, patch) {
      await delay();
      const rows = readStore(key, seed);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new ApiError(`${key}/${id} not found`, 404);
      rows[idx] = { ...rows[idx], ...patch, id };
      writeStore(key, rows);
      return rows[idx];
    },
    async remove(id) {
      await delay();
      writeStore(
        key,
        readStore(key, seed).filter((r) => r.id !== id),
      );
    },
  };
}

/** Wipes the local demo store so every collection reseeds on next read. */
export function resetLocalData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  emit("*");
}
