import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  normalizeMethod,
  parseJsonBody,
} from "../../../_lib/http";
import { requireAdmin } from "../../../_lib/auth";

interface SiteSettingsPayload {
  settings?: {
    allowUploads?: boolean;
    maintenanceBanner?: boolean;
  };
}

interface SiteSettingRecord {
  key: string;
  value: unknown;
  updated_at: string | null;
}

const DEFAULT_SITE_SETTINGS = {
  allow_uploads: true,
  maintenance_banner: false,
} as const;

type SettingKey = keyof typeof DEFAULT_SITE_SETTINGS;

type SupabaseClientType = typeof requireAdmin extends () => Promise<infer T>
  ? T extends { supabase: infer C }
    ? C
    : never
  : never;

export default async function handler(request: Request): Promise<Response> {
  const method = normalizeMethod(request.method);

  if (method === "GET") {
    const context = await requireAdmin(request);
    if (context instanceof Response) {
      return context;
    }

    return handleGet(context.supabase);
  }

  if (method === "PUT") {
    const context = await requireAdmin(request);
    if (context instanceof Response) {
      return context;
    }

    const payload = (await parseJsonBody<SiteSettingsPayload>(request)) ?? {};
    const settings = payload.settings ?? {};

    const updates: { key: SettingKey; value: boolean }[] = [];

    if (settings.allowUploads !== undefined) {
      updates.push({ key: "allow_uploads", value: Boolean(settings.allowUploads) });
    }

    if (settings.maintenanceBanner !== undefined) {
      updates.push({ key: "maintenance_banner", value: Boolean(settings.maintenanceBanner) });
    }

    if (updates.length === 0) {
      return errorResponse(400, "No settings provided");
    }

    const rows = updates.map(item => ({ key: item.key, value: item.value }));
    const { error } = await context.supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      return errorResponse(500, "Failed to update site settings");
    }

    return jsonResponse({ success: true });
  }

  return methodNotAllowed(["GET", "PUT"]);
}

async function handleGet(supabase: SupabaseClientType): Promise<Response> {
  const keys = Object.keys(DEFAULT_SITE_SETTINGS) as SettingKey[];

  const { data, error } = await supabase
    .from("site_settings")
    .select<SiteSettingRecord>("key, value, updated_at")
    .in("key", keys);

  if (error) {
    return errorResponse(500, "Failed to load site settings");
  }

  const map = new Map<string, SiteSettingRecord>();
  for (const row of data ?? []) {
    map.set(row.key, row);
  }

  const settings = {
    allowUploads: resolveBooleanSetting(map.get("allow_uploads"), DEFAULT_SITE_SETTINGS.allow_uploads),
    maintenanceBanner: resolveBooleanSetting(
      map.get("maintenance_banner"),
      DEFAULT_SITE_SETTINGS.maintenance_banner,
    ),
  };

  const metadata = {
    allowUploadsUpdatedAt: map.get("allow_uploads")?.updated_at ?? null,
    maintenanceBannerUpdatedAt: map.get("maintenance_banner")?.updated_at ?? null,
  };

  return jsonResponse({ settings, metadata });
}

function resolveBooleanSetting(record: SiteSettingRecord | undefined, fallback: boolean): boolean {
  if (!record) {
    return fallback;
  }

  if (typeof record.value === "boolean") {
    return record.value;
  }

  if (record.value && typeof record.value === "object" && "value" in (record.value as Record<string, unknown>)) {
    const nested = (record.value as Record<string, unknown>).value;
    if (typeof nested === "boolean") {
      return nested;
    }
  }

  return fallback;
}
