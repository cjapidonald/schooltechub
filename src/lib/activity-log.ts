const STORAGE_KEY = "dashboard:activity-log";
const EVENT_NAME = "dashboard:activity-log:update";
const CHANNEL_NAME = "dashboard-activity";
const MAX_ENTRIES = 100;
const DEDUP_WINDOW_MS = 30_000;

export type ActivityType =
  | "class-created"
  | "plan-saved"
  | "resource-attached"
  | "research-submitted";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  metadata?: Record<string, string>;
};

export type ActivityMetadataInput = Record<string, string | number | boolean | null | undefined>;

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  "class-created": "Class created",
  "plan-saved": "Lesson plan saved",
  "resource-attached": "Resource attached",
  "research-submitted": "Research submitted",
};

let memoryEntries: ActivityEntry[] = [];
let activityChannel: BroadcastChannel | null | undefined;

const isBrowser = () => typeof window !== "undefined";

const getStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getBroadcastChannel = (): BroadcastChannel | null => {
  if (!isBrowser()) {
    return null;
  }

  if (activityChannel !== undefined) {
    return activityChannel;
  }

  if (typeof BroadcastChannel === "undefined") {
    activityChannel = null;
    return activityChannel;
  }

  try {
    activityChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    activityChannel = null;
  }

  return activityChannel;
};

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeMetadata = (meta?: ActivityMetadataInput): Record<string, string> | undefined => {
  if (!meta) {
    return undefined;
  }

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "object") {
      result[key] = JSON.stringify(value);
      continue;
    }

    result[key] = String(value);
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const serializeMetadata = (meta?: Record<string, string>): string => {
  if (!meta) {
    return "";
  }

  return Object.keys(meta)
    .sort()
    .map(key => `${key}:${meta[key]}`)
    .join("|");
};

const loadEntries = (): ActivityEntry[] => {
  const storage = getStorage();
  if (!storage) {
    return memoryEntries;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryEntries = [];
      return memoryEntries;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      memoryEntries = [];
      return memoryEntries;
    }

    const entries = parsed
      .map(item => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const entry = item as Partial<ActivityEntry>;
        if (typeof entry.id !== "string" || typeof entry.type !== "string" || typeof entry.message !== "string") {
          return null;
        }

        const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : new Date().toISOString();
        const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : undefined;

        return {
          id: entry.id,
          type: entry.type as ActivityType,
          message: entry.message,
          timestamp,
          metadata: metadata ? sanitizeMetadata(metadata) : undefined,
        } satisfies ActivityEntry;
      })
      .filter((entry): entry is ActivityEntry => Boolean(entry && entry.id));

    memoryEntries = entries;
    return memoryEntries;
  } catch {
    memoryEntries = [];
    return memoryEntries;
  }
};

const saveEntries = (entries: ActivityEntry[]) => {
  const storage = getStorage();
  memoryEntries = entries;

  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage errors
  }
};

const notifySubscribers = (entries: ActivityEntry[]) => {
  if (isBrowser()) {
    const event = new CustomEvent<ActivityEntry[]>(EVENT_NAME, { detail: entries });
    window.dispatchEvent(event);
  }

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type: EVENT_NAME, entries });
    } catch {
      // Ignore broadcast errors
    }
  }
};

export const getRecentActivity = (limit = 10): ActivityEntry[] => {
  const entries = loadEntries();
  return entries.slice(0, limit);
};

export const logActivity = (
  type: ActivityType,
  message: string,
  metadata?: ActivityMetadataInput,
): ActivityEntry => {
  const sanitizedMetadata = sanitizeMetadata(metadata);
  const entries = loadEntries();

  const last = entries[0];
  if (last && last.type === type && last.message === message) {
    const lastTime = Date.parse(last.timestamp);
    if (!Number.isNaN(lastTime) && Date.now() - lastTime <= DEDUP_WINDOW_MS) {
      const lastMeta = serializeMetadata(last.metadata);
      const nextMeta = serializeMetadata(sanitizedMetadata);
      if (lastMeta === nextMeta) {
        return last;
      }
    }
  }

  const entry: ActivityEntry = {
    id: createId(),
    type,
    message,
    timestamp: new Date().toISOString(),
    metadata: sanitizedMetadata,
  };

  const nextEntries = [entry, ...entries].slice(0, MAX_ENTRIES);
  saveEntries(nextEntries);
  notifySubscribers(nextEntries);
  return entry;
};

export const subscribeToActivityLog = (handler: (entries: ActivityEntry[]) => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ActivityEntry[]>).detail;
    handler(Array.isArray(detail) ? detail : getRecentActivity());
  };

  window.addEventListener(EVENT_NAME, listener as EventListener);

  const channel = getBroadcastChannel();
  const channelListener = (event: MessageEvent<{ type?: string; entries?: ActivityEntry[] }>) => {
    if (event.data?.type === EVENT_NAME && Array.isArray(event.data.entries)) {
      handler(event.data.entries);
    }
  };

  channel?.addEventListener("message", channelListener as EventListener);

  return () => {
    window.removeEventListener(EVENT_NAME, listener as EventListener);
    channel?.removeEventListener("message", channelListener as EventListener);
  };
};
