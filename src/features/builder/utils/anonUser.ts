import { nanoid } from "nanoid";

const STORAGE_KEY = "builder-anon-user-id";

const generateId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : nanoid());

export const getAnonUserId = () => {
  if (typeof window === "undefined") return generateId();
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const next = generateId();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
};
